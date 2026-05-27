"""Membership class.

Manages the membership between a user and engagement/survey
"""
from __future__ import annotations
from typing import List

from sqlalchemy import ForeignKey, and_, or_

from api.constants.membership_type import MembershipType
from api.utils.enums import MembershipStatus
from api.utils.datetime import utc_now

from .base_model import BaseModel
from .db import db
from .staff_user import StaffUser


class Membership(BaseModel):
    """Definition of the Memebership entity."""

    __tablename__ = 'membership'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    status = db.Column(
        ForeignKey('membership_status_codes.id')
    )
    revoked_date = db.Column(db.DateTime, nullable=True)
    engagement_id = db.Column(db.Integer, ForeignKey('engagement.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, ForeignKey('staff_users.id'), nullable=True)
    type = db.Column(db.Enum(MembershipType), nullable=False)
    user = db.relationship('StaffUser', foreign_keys=[user_id], lazy='joined')
    membership_status = db.relationship('MembershipStatusCode', foreign_keys=[status], lazy='select')
    engagement = db.relationship('Engagement', foreign_keys=[engagement_id], lazy='select')
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenant.id'), nullable=True)
    version = db.Column(db.Integer, nullable=False, default=1)
    is_latest = db.Column(db.Boolean, nullable=False, default=True)

    @classmethod
    def find_by_engagement(cls, engagement_id, status=None) -> List[Membership]:
        """Get a survey."""
        query = db.session.query(Membership) \
            .filter(and_(
                Membership.engagement_id == engagement_id,
                Membership.is_latest.is_(True)
            ))
        if status:
            query = query.filter(Membership.status == status)
        memberships = query.all()
        return memberships

    @classmethod
    def find_by_external_user_id(
        cls,
        user_external_id,
        status=None,
    ) -> List[Membership]:
        """Get memberships by external user id."""
        query = db.session.query(Membership) \
            .join(StaffUser, StaffUser.id == Membership.user_id) \
            .filter(
                and_(
                    StaffUser.external_id == user_external_id,
                    or_(
                        Membership.type == MembershipType.TEAM_MEMBER,
                        Membership.type == MembershipType.REVIEWER
                    ),
                    Membership.is_latest.is_(True)
                ))

        if status:
            query = query.filter(Membership.status == status)

        memberships = query.all()
        return memberships

    @classmethod
    def find_by_user_id(
        cls,
        user_id,
    ) -> List[Membership]:
        """Get memberships by user id."""
        query = db.session.query(Membership) \
            .filter(
                and_(
                    Membership.user_id == user_id,
                    Membership.is_latest.is_(True)
                ))

        memberships = query.all()
        return memberships

    @classmethod
    def find_by_engagement_and_user_id(cls, eng_id, userid, status=None) \
            -> Membership:
        """Get a membership by engagement and user ID."""
        query = db.session.query(Membership) \
            .join(StaffUser, StaffUser.id == Membership.user_id) \
            .filter(and_(Membership.engagement_id == eng_id,
                         Membership.user_id == userid,
                         Membership.is_latest.is_(True)
                         )
                    )
        if status:
            query = query.filter(Membership.status == status)
        membership = query.first()
        return membership

    @classmethod
    def create_new_version(cls, engagement_id, user_id, new_membership: dict) -> Membership:
        """Create new version of membership."""
        latest_membership = db.session.query(Membership) \
            .filter(and_(Membership.engagement_id == engagement_id,
                         Membership.user_id == user_id,
                         Membership.is_latest.is_(True)
                         )
                    ) \
            .first()
        if latest_membership:
            latest_membership.is_latest = False
            latest_membership.save()

        new_membership: Membership = Membership(
            engagement_id=engagement_id,
            user_id=user_id,
            status=new_membership.get('status'),
            type=new_membership.get('type'),
            revoked_date=new_membership.get('revoked_date', None),
            is_latest=True,
            version=latest_membership.version + 1 if latest_membership else 1
        )
        new_membership.save()
        return new_membership

    @classmethod
    def revoke_memberships_bulk(cls, user_id: int):
        """Create in bulk revoked versions of memberships."""
        # Get all latest memberships by engagement ids
        current_memberships = db.session.query(Membership) \
            .filter(and_(
                Membership.user_id == user_id,
                Membership.is_latest.is_(True),
                Membership.status == MembershipStatus.ACTIVE.value
            )) \
            .all()

        if not current_memberships:
            return []

        # Create new versions with the desired changes
        new_memberships = []
        for current_membership in current_memberships:
            current_membership.is_latest = False
            db.session.add(current_membership)

            new_membership = Membership(
                engagement_id=current_membership.engagement_id,
                user_id=user_id,
                status=MembershipStatus.REVOKED.value,
                type=current_membership.type,
                revoked_date=utc_now(),
                is_latest=True,
                version=current_membership.version + 1
            )
            new_memberships.append(new_membership)

        # Bulk insert new versions
        db.session.bulk_save_objects(new_memberships)
        db.session.commit()

        return new_memberships

    @classmethod
    def deactivate_memberships_bulk(cls, user_id: int):
        """Create in bulk deactivated versions of memberships."""
        # Get all latest memberships by engagement ids
        current_memberships = db.session.query(Membership) \
            .filter(and_(
                Membership.user_id == user_id,
                Membership.is_latest.is_(True),
                Membership.status == MembershipStatus.ACTIVE.value
            )) \
            .all()

        if not current_memberships:
            return []

        # Create new versions with the desired changes
        new_memberships = []
        for current_membership in current_memberships:
            current_membership.is_latest = False
            db.session.add(current_membership)

            new_membership = Membership(
                engagement_id=current_membership.engagement_id,
                user_id=user_id,
                status=MembershipStatus.INACTIVE.value,
                type=current_membership.type,
                revoked_date=utc_now(),
                is_latest=True,
                version=current_membership.version + 1
            )
            new_memberships.append(new_membership)

        # Bulk insert new versions
        db.session.bulk_save_objects(new_memberships)
        db.session.commit()

        return new_memberships
