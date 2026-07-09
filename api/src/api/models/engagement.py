"""Engagement model class.

Manages the engagement
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_, asc, desc, or_, select
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
from api.schemas.engagement import EngagementSchema
from api.utils.datetime import local_datetime, utc_now
from api.utils.enums import MembershipStatus
from api.utils.filter_types import filter_map

from .base_model import BaseModel
from .db import db
from .engagement_metadata import EngagementMetadata as EngagementMetadataModel
from .engagement_status import EngagementStatus


def _suggested_engagement_order_by():
    # Importing here to avoid circular import between engagement and
    # suggested engagement models as the sort index for suggested engagement is defined in
    # the suggested engagement model while the relationship is defined in the engagement model
    from .suggested_engagement import SuggestedEngagement   # pylint: disable=import-outside-toplevel
    # noqa: E501, E261, I005

    return SuggestedEngagement.sort_index


class Engagement(BaseModel):
    """Definition of the Engagement entity."""

    __tablename__ = 'engagement'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50))
    slug = db.Column(db.String(256), nullable=False)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    status_id = db.Column(db.Integer, ForeignKey(
        'engagement_status.id', ondelete='CASCADE'))
    status = db.relationship(
        'EngagementStatus', backref='engagement', viewonly=True)
    published_date = db.Column(db.DateTime, nullable=True)
    scheduled_date = db.Column(db.DateTime, nullable=True)
    banner_filename = db.Column(db.String(), unique=False, nullable=True)
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
    suggested_engagement_links = db.relationship(
        'SuggestedEngagement',
        back_populates='source_engagement',
        primaryjoin='SuggestedEngagement.engagement_id == Engagement.id',
        foreign_keys='SuggestedEngagement.engagement_id',
        order_by=_suggested_engagement_order_by,
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
        query = db.session.query(Engagement).join(EngagementStatus)

        query = cls._add_tenant_filter(query)

        if search_options:
            query = cls._filter_by_search_text(query, search_options)

            query = cls._filter_by_created_date(query, search_options)

            query = cls._filter_by_published_date(query, search_options)

            query = cls._filter_by_engagement_status(query, search_options)

            query = cls._filter_by_metadata(query, search_options)

        query = cls._filter_by_internal(query, search_options)

        if scope_options.restricted:
            if scope_options.include_assigned:
                # the engagement status ids that should not be filtered out
                exception_status_ids = scope_options.engagement_status_ids
                query = cls._filter_by_assigned_engagements(
                    query, external_user_id, exception_status_ids)
            else:
                # the engagement status ids of the engagements that should fetched
                statuses = scope_options.engagement_status_ids
                query = cls._filter_by_statuses(query, statuses)

        sort = cls._get_sort_order(pagination_options)

        query = query.order_by(sort)

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
    def update_engagement(cls, engagement: EngagementSchema) -> Optional[Engagement]:
        """Update engagement."""
        engagement_id = engagement.get('id', None)
        query = Engagement.query.filter_by(id=engagement_id)
        record: Engagement = query.first()
        if not record:
            return None

        update_fields = {
            'start_date': engagement.get('start_date', None),
            'end_date': engagement.get('end_date', None),
            'status_id': engagement.get('status_id', None),
            'selected_survey_id': engagement.get('selected_survey_id', None),
            # to fix the bug with UI not passing published date always.
            # Defaulting to existing
            'published_date': engagement.get(
                'published_date', record.published_date),
            'scheduled_date': engagement.get(
                'scheduled_date', record.scheduled_date),
            'updated_date': utc_now(),
            'updated_by': engagement.get('updated_by', None),
            'banner_filename': engagement.get('banner_filename', None),
            'is_internal': engagement.get('is_internal', record.is_internal),
            'cta_url': engagement.get('cta_url', record.cta_url),
        }
        query.update(update_fields)
        db.session.commit()
        return record

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
    def _get_sort_order(pagination_options):
        sort = asc(text(pagination_options.sort_key)) if pagination_options.sort_order == 'asc' \
            else desc(text(pagination_options.sort_key))
        return sort

    @staticmethod
    def _filter_by_engagement_status(query, search_options):
        statuses = [int(status)
                    for status in search_options.get('engagement_status', [])]
        if not statuses:
            return query

        allowed_statuses = [
            Status.Draft.value,
            Status.Published.value,
            Status.Closed.value,
            Status.Scheduled.value
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
                    Engagement.status_id == Status.Closed.value,
                    Engagement.end_date < datetime.now()
                )
            )

        if EngagementDisplayStatus.Unpublished.value in statuses:
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

        for criterion in search_options['metadata']:
            taxon_id = criterion.get('taxon_id')
            values = criterion.get('values')

            # pick the type of filtering to apply
            filter_type = filter_map.get(criterion.get('filter_type'))

            if any([taxon_id is None, values is None, filter_type is None]):
                continue  # skip invalid criteria

            # Base query (single column)
            taxon_query = query.session.query(
                EngagementMetadataModel.engagement_id
            ).filter(
                EngagementMetadataModel.taxon_id == taxon_id
            )

            filter_result = filter_type(taxon_query, values)

            if hasattr(filter_result, 'subquery'):
                selectable = filter_result.subquery()
            else:
                selectable = filter_result

            filter_subquery = select(selectable.c.engagement_id).distinct()
            query = query.filter(Engagement.id.in_(filter_subquery))
        return query

    @staticmethod
    def _filter_by_assigned_engagements(query, external_user_id: int, exception_status_ids: Optional[list[int]] = None):
        if exception_status_ids is None:
            exception_status_ids = []

        assigned_engagement_ids = [
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

        # filter out all engagements that are not assigned to the user except ones with the exception status ids
        query = query.filter(
            or_(
                Engagement.status_id.in_(exception_status_ids),
                Engagement.id.in_(assigned_engagement_ids)
            )
        )

        return query

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
