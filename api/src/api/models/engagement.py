"""Engagement model class.

Manages the engagement
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_, asc, desc, func, literal, or_, select, union_all
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.orderinglist import ordering_list
from sqlalchemy.sql import text
from sqlalchemy.sql.schema import ForeignKey

from api.constants.engagement_status import EngagementDisplayStatus, Status
from api.constants.user import SYSTEM_USER
from api.models.engagement_scope_options import EngagementScopeOptions
from api.models.membership import Membership as MembershipModel
from api.models.pagination_options import PaginationOptions
from api.models.staff_user import StaffUser
from api.utils.datetime import local_datetime, utc_now
from api.utils.enums import MembershipStatus
from api.utils.filter_types import filter_map

from .base_model import BaseModel
from .db import db
from .engagement_metadata import EngagementMetadata as EngagementMetadataModel
from .engagement_metadata import MetadataTaxon
from .engagement_status import EngagementStatus


class Engagement(BaseModel):
    """Definition of the Engagement entity."""

    __tablename__ = 'engagement'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(75))
    slug = db.Column(db.String(256), nullable=False)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    status_id = db.Column(db.Integer, ForeignKey(
        'engagement_status.id', ondelete='CASCADE'))
    status = db.relationship(
        'EngagementStatus', backref='engagement', viewonly=True)
    published_date = db.Column(db.DateTime, nullable=True)
    scheduled_date = db.Column(db.DateTime, nullable=True)
    banner_file_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        'uploaded_files.id'), nullable=True)
    selected_survey_id = db.Column(db.Integer, ForeignKey(
        'survey.id', ondelete='SET NULL'
    ), nullable=True)
    surveys = db.relationship(
        'Survey',
        back_populates='engagement',
        primaryjoin='Survey.engagement_id == Engagement.id',
        foreign_keys='Survey.engagement_id',
        passive_deletes=True,
        lazy='selectin',
    )
    status_block = db.relationship(
        'EngagementStatusBlock', backref='engagement')
    tenant_id = db.Column(
        db.Integer, db.ForeignKey('tenant.id'), nullable=True)
    tenant = db.relationship('Tenant', backref='engagements')
    is_internal = db.Column(db.Boolean, nullable=False)
    banner_file = db.relationship(
        'UploadedFile', foreign_keys=[banner_file_id], backref='banner_usages')
    file_assignments = db.relationship(
        'EngagementFile', back_populates='engagement')
    suggested_engagement_links = db.relationship(
        'SuggestedEngagement',
        back_populates='source_engagement',
        primaryjoin='SuggestedEngagement.engagement_id == Engagement.id',
        foreign_keys='SuggestedEngagement.engagement_id',
        order_by=lambda: __import__(
            'api.models.suggested_engagement',   # adjust to your actual module path
            fromlist=['SuggestedEngagement']
        ).SuggestedEngagement.sort_index,
        collection_class=ordering_list('sort_index', count_from=1),
        cascade='all, delete-orphan',
        passive_deletes=True,
        lazy='selectin',
    )
    suggested_by_links = db.relationship(
        'SuggestedEngagement',
        back_populates='suggested_engagement',
        primaryjoin='SuggestedEngagement.suggested_engagement_id == Engagement.id',
        foreign_keys='SuggestedEngagement.suggested_engagement_id',
        passive_deletes=True,
        lazy='selectin',
    )
    suggested_engagements = association_proxy(
        'suggested_engagement_links', 'suggested_engagement')
    suggested_engagement_ids = association_proxy(
        'suggested_engagement_links', 'suggested_engagement_id')

    __table_args__ = (db.UniqueConstraint(
        'slug', 'tenant_id', name='uq_slug_per_tenant'),
    )

    @classmethod
    def get_engagements_paginated(
            cls,
            external_user_id,
            pagination_options: PaginationOptions,
            scope_options: EngagementScopeOptions,
            search_options=None,
    ):
        """Get engagements paginated."""
        query = cls._get_engagements_query(external_user_id, scope_options, search_options)

        sort = cls._get_sort_order(pagination_options, search_options)

        query = query.order_by(*sort)

        no_pagination_options = not pagination_options.page or not pagination_options.size
        if no_pagination_options:
            items = query.all()
            return items, len(items)

        # Calculate offset and limit for pagination
        offset = (pagination_options.page - 1) * pagination_options.size
        limit = pagination_options.size

        # Apply pagination using limit and offset
        paginated_query = query.offset(offset).limit(limit)

        # Fetch paginated items and total count
        items = paginated_query.all()
        total_count = query.count()

        return items, total_count

    @classmethod
    def count_engagements(cls, external_user_id, scope_options: EngagementScopeOptions, search_options=None):
        """Count engagements matching the supplied search criteria."""
        return cls._get_engagements_query(external_user_id, scope_options, search_options).count()

    @classmethod
    def count_engagements_many(
        cls, external_user_id, scope_options: EngagementScopeOptions, search_options_list
    ):
        """Count engagements for multiple search filters in one database round trip."""
        if not search_options_list:
            return []

        assigned_engagement_ids = None
        if scope_options.restricted and scope_options.include_assigned:
            assigned_engagement_ids = cls._get_assigned_engagement_ids(
                external_user_id)

        count_queries = []
        for index, search_options in enumerate(search_options_list):
            query = cls._get_engagements_query(
                external_user_id,
                scope_options,
                search_options,
                assigned_engagement_ids,
            )
            count_query = query.with_entities(
                func.count(Engagement.id)
            ).scalar_subquery()
            count_queries.append(select(
                literal(index).label('request_index'),
                count_query.label('count'),
            ))

        rows = db.session.execute(union_all(*count_queries)).all()
        counts = [0] * len(search_options_list)
        for index, count in rows:
            counts[index] = count
        return counts

    @classmethod
    def _get_engagements_query(
        cls, external_user_id, scope_options, search_options, assigned_engagement_ids=None
    ):
        query = cls._add_tenant_filter(db.session.query(Engagement).join(EngagementStatus))
        if search_options:
            if search_options.get('public_search'):
                query = query.filter(Engagement.status_id != Status.Unpublished.value)
            query = cls._filter_by_search_text(query, search_options)
            query = cls._filter_by_created_date(query, search_options)
            query = cls._filter_by_published_date(query, search_options)
            query = cls._filter_by_engagement_status(query, search_options)
            query = cls._filter_by_metadata(query, search_options)

        query = cls._filter_by_internal(query, search_options)
        if scope_options.restricted:
            if scope_options.include_assigned:
                query = cls._filter_by_assigned_engagements(
                    query,
                    external_user_id,
                    scope_options.engagement_status_ids,
                    assigned_engagement_ids,
                )
            else:
                query = cls._filter_by_statuses(query, scope_options.engagement_status_ids)
        return query

    @classmethod
    def edit_engagement(cls, engagement_data: dict, commit: bool = True) -> Optional[Engagement]:
        """Update engagement."""
        engagement_id = engagement_data.get('id', None)
        query = Engagement.query.filter_by(id=engagement_id)
        engagement: Engagement = query.first()
        if not engagement:
            return None
        engagement_data['updated_date'] = utc_now()
        # Ensure no relationship fields are included in the update payload, only real columns
        updatable_columns = {
            column.name for column in Engagement.__table__.columns}
        updatable_columns.discard('id')  # ID can never be updated
        update_payload = {
            key: value for key, value in engagement_data.items() if key in updatable_columns
        }
        query.update(update_payload)
        if commit:
            db.session.commit()
        return engagement

    @classmethod
    def find_tenant_id_by_id(cls, engagement_id):
        """Return the tenant id for the engagement."""
        return db.session.query(cls.tenant_id).filter_by(id=engagement_id).scalar()

    @classmethod
    def close_engagements_due(cls) -> List[Engagement]:
        """Update engagement to closed."""
        now = local_datetime()
        # Strip the time off the datetime object
        date_due = datetime(now.year, now.month, now.day)
        update_fields = {
            'status_id': Status.Closed.value,
            'updated_date': utc_now(),
            'updated_by': SYSTEM_USER
        }
        # Close published engagements where end date is prior than today
        query = Engagement.query \
            .filter(Engagement.status_id == Status.Published.value) \
            .filter(Engagement.end_date < date_due)
        records = query.all()
        if not records:
            return []
        query.update(update_fields)
        db.session.commit()
        return records

    @classmethod
    def publish_scheduled_engagements_due(cls) -> Optional[List[Engagement]]:
        """Update scheduled engagements to published."""
        datetime_due = utc_now()
        logging.getLogger(__name__).debug(
            'Publish due date (UTC): %s', datetime_due)
        update_fields = {
            'status_id': Status.Published.value,
            'published_date': utc_now(),
            'updated_date': utc_now(),
            'updated_by': SYSTEM_USER
        }
        # Publish scheduled engagements where scheduled datetime is prior than now
        query = Engagement.query \
            .filter(Engagement.status_id == Status.Scheduled.value) \
            .filter(Engagement.scheduled_date <= datetime_due)
        records = query.all()
        if not records:
            return None
        query.update(update_fields)
        db.session.commit()
        return records

    @staticmethod
    def _get_sort_order(pagination_options, search_options):
        search_options = search_options or {}
        if not search_options.get('public_search'):
            sort = asc(text(pagination_options.sort_key)) if pagination_options.sort_order == 'asc' \
                else desc(text(pagination_options.sort_key))
            return (sort,)

        search_text = search_options.get('search_text', '')
        # default to sort by relevance with secondary sort by created date
        sort_by = Engagement.name.ilike(f"%{search_text or ''}%"), Engagement.created_date.desc()
        sort_key = pagination_options.sort_key
        if sort_key == 'newest':
            sort_by = (Engagement.created_date.desc(),)
        elif sort_key == 'oldest':
            sort_by = (Engagement.created_date.asc(),)
        return sort_by

    @staticmethod
    def _filter_by_engagement_status(query, search_options):
        if search_options.get('public_search'):
            return Engagement._filter_by_public_engagement_status(query, search_options)
        return Engagement._filter_by_admin_engagement_status(query, search_options)

    @staticmethod
    def _filter_by_admin_engagement_status(query, search_options):
        statuses = [int(status) for status in search_options.get('engagement_status', [])]
        if not statuses:
            return query

        allowed_statuses = [
            Status.Draft.value,
            Status.Published.value,
            Status.Closed.value,
            Status.Scheduled.value,
        ]
        status_filter = [Engagement.status_id.in_(
            [status for status in statuses if status in allowed_statuses])]

        if EngagementDisplayStatus.Upcoming.value in statuses:
            status_filter.append(
                and_(
                    Engagement.status_id == Status.Published.value,
                    Engagement.start_date > datetime.now()
                )
            )
        if EngagementDisplayStatus.Open.value in statuses:
            status_filter.append(
                and_(
                    Engagement.status_id == Status.Published.value,
                    Engagement.start_date <= datetime.now(),
                    Engagement.end_date > datetime.now()
                )
            )
        if EngagementDisplayStatus.Closed.value in statuses:
            status_filter.append(
                and_(
                    Engagement.status_id == Status.Published.value,
                    Engagement.end_date < datetime.now()
                )
            )
        if EngagementDisplayStatus.Unpublished.value in statuses:
            status_filter.append(Engagement.status_id == Status.Unpublished.value)
        return query.filter(or_(*status_filter))

    @staticmethod
    def _filter_by_public_engagement_status(query, search_options):
        statuses = [status.lower() for status in search_options.get('engagement_status', [])]
        if not statuses:
            return query

        allowed_statuses = [
            Status.Draft.name.lower(),
            Status.Published.name.lower(),
            Status.Closed.name.lower(),
            Status.Scheduled.name.lower(),
        ]
        status_filter = [Engagement.status_id.in_(
            [Status[status.title()] for status in statuses if status in allowed_statuses])]

        if EngagementDisplayStatus.Upcoming.name.lower() in statuses:
            status_filter.append(
                and_(
                    Engagement.status_id == Status.Published.value,
                    Engagement.start_date > datetime.now()
                )
            )
        if EngagementDisplayStatus.Open.name.lower() in statuses:
            status_filter.append(
                and_(
                    Engagement.status_id == Status.Published.value,
                    Engagement.start_date <= datetime.now(),
                    Engagement.end_date > datetime.now()
                )
            )
        if EngagementDisplayStatus.Closed.name.lower() in statuses:
            status_filter.append(
                and_(
                    Engagement.status_id == Status.Published.value,
                    Engagement.end_date < datetime.now()
                )
            )
        if EngagementDisplayStatus.Unpublished.name.lower() in statuses:
            status_filter.append(Engagement.status_id ==
                                 Status.Unpublished.value)
        query = query.filter(or_(*status_filter))
        return query

    @classmethod
    def _filter_by_published_date(cls, query, search_options):
        if published_from_date := search_options.get('published_from_date'):
            query = query.filter(
                Engagement.published_date >= published_from_date)
        if published_to_date := search_options.get('published_to_date'):
            query = query.filter(
                Engagement.published_date <= published_to_date)
        return query

    @staticmethod
    def _filter_by_created_date(query, search_options):
        if created_from_date := search_options.get('created_from_date'):
            query = query.filter(Engagement.created_date >= created_from_date)
        if created_to_date := search_options.get('created_to_date'):
            query = query.filter(Engagement.created_date <= created_to_date)
        return query

    @staticmethod
    def _filter_by_search_text(query, search_options):
        if search_text := search_options.get('search_text'):
            query = query.filter(
                Engagement.name.ilike('%' + search_text + '%'))
        return query

    @staticmethod
    def _filter_by_internal(query, search_options):
        if search_options.get('exclude_internal'):
            query = query.filter(Engagement.is_internal.is_(False))
        return query

    @staticmethod
    def _filter_by_metadata(query, search_options):
        """
        Filter the engagements based on metadata criteria.

        Ensures that each engagement matches all of the provided criteria.
        """
        if 'metadata' not in search_options:
            return query

        metadata_filter_config = search_options.get('_metadata_filter_config')
        public_only = search_options.get('filterable_metadata')
        public_filter_types = Engagement._get_public_metadata_filter_types(
            query, search_options, metadata_filter_config)
        for criterion in search_options['metadata']:
            query = Engagement._filter_by_metadata_criterion(
                query, criterion, public_filter_types, metadata_filter_config, public_only)
        return query

    @staticmethod
    def _get_public_metadata_filter_types(query, search_options, metadata_filter_config):
        if not search_options.get('filterable_metadata'):
            return {}
        if metadata_filter_config is not None:
            return {
                taxon_id: config['filter_type']
                for taxon_id, config in metadata_filter_config.items()
            }
        # Only public taxa (those with a filter type) may be filtered on; the stored type is authoritative.
        return dict(
            query.session.query(MetadataTaxon.id, MetadataTaxon.filter_type)
            .filter(MetadataTaxon.filter_type.isnot(None)).all())

    @staticmethod
    def _filter_by_metadata_criterion(
        query, criterion, public_filter_types, metadata_filter_config, public_only
    ):
        taxon_id = criterion.get('taxon_id')
        values = criterion.get('values')
        requested_type = criterion.get('filter_type')
        if public_only:
            requested_type = public_filter_types.get(taxon_id)

        filter_type = filter_map.get(requested_type)
        if taxon_id is None or values is None or filter_type is None:
            return query

        taxon_query = query.session.query(
            EngagementMetadataModel.engagement_id
        ).filter(EngagementMetadataModel.taxon_id == taxon_id)
        filter_result = filter_type(taxon_query, values)
        selectable = filter_result.subquery() if hasattr(filter_result, 'subquery') else filter_result
        filter_subquery = select(selectable.c.engagement_id).distinct()

        wildcard_name = Engagement._get_metadata_wildcard_name(
            query, taxon_id, metadata_filter_config)
        if wildcard_name:
            wildcard_subquery = query.session.query(
                EngagementMetadataModel.engagement_id
            ).filter(
                EngagementMetadataModel.taxon_id == taxon_id,
                EngagementMetadataModel.value == wildcard_name,
            )
            return query.filter(or_(
                Engagement.id.in_(filter_subquery),
                Engagement.id.in_(wildcard_subquery),
            ))
        return query.filter(Engagement.id.in_(filter_subquery))

    @staticmethod
    def _get_metadata_wildcard_name(query, taxon_id, metadata_filter_config):
        if metadata_filter_config is not None:
            return metadata_filter_config.get(taxon_id, {}).get('wildcard_name')
        return query.session.query(MetadataTaxon.wildcard_name).filter(
            MetadataTaxon.id == taxon_id,
            MetadataTaxon.wildcard_enabled.is_(True),
        ).scalar()

    @staticmethod
    def _filter_by_assigned_engagements(
        query,
        external_user_id: int,
        exception_status_ids: Optional[list[int]] = None,
        assigned_engagement_ids: Optional[list[int]] = None,
    ):
        if exception_status_ids is None:
            exception_status_ids = []

        if assigned_engagement_ids is None:
            assigned_engagement_ids = Engagement._get_assigned_engagement_ids(
                external_user_id)

        # filter out all engagements that are not assigned to the user except ones with the exception status ids
        query = query.filter(
            or_(
                Engagement.status_id.in_(exception_status_ids),
                Engagement.id.in_(assigned_engagement_ids)
            )
        )

        return query

    @staticmethod
    def _get_assigned_engagement_ids(external_user_id: int):
        return [
            engagement_id
            for engagement_id, in (
                db.session.query(Engagement.id)
                .join(MembershipModel, MembershipModel.engagement_id == Engagement.id)
                .join(StaffUser, StaffUser.external_id == external_user_id)
                .filter(MembershipModel.user_id == StaffUser.id)
                .filter(MembershipModel.is_latest.is_(True))
                .filter(MembershipModel.status == MembershipStatus.ACTIVE.value)
                .all()
            )
        ]

    # filter by statuses
    @staticmethod
    def _filter_by_statuses(query, statuses: list[int]):
        query = query.filter(Engagement.status_id.in_(statuses))
        return query

    @staticmethod
    def get_assigned_engagements(user_id: int) -> List[Engagement]:
        """Get engagements assigned to the given user id."""
        engagements = db.session.query(Engagement) \
            .join(MembershipModel) \
            .filter(
                and_(
                    MembershipModel.user_id == user_id,
                    MembershipModel.is_latest.is_(True),
                    MembershipModel.status == MembershipStatus.ACTIVE.value
                )) \
            .all()
        return engagements

    @classmethod
    def delete_engagement(cls, engagement_id) -> Engagement:
        """Delete a single engagement by ID."""
        engagement = db.session.get(cls, engagement_id)
        if engagement is None:
            raise ValueError('Engagement not found.')
        db.session.delete(engagement)
        db.session.commit()
        return engagement
