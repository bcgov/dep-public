"""User group membership model class.

Manages the staff user membership to a group
"""
from __future__ import annotations

from flask import g
from sqlalchemy import PrimaryKeyConstraint

from .base_model import BaseModel
from .db import db


class UserGroupMembership(BaseModel):  # pylint: disable=too-few-public-methods, too-many-instance-attributes
    """Definition of the User group membership entity."""

    __tablename__ = 'user_group_membership'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_user_external_id = db.Column(db.String(50), db.ForeignKey('staff_users.external_id'),
                                       primary_key=True, nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('user_group.id'), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenant.id'), primary_key=True, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False)

    tenant = db.relationship('Tenant', backref='user_group_memberships')
    groups = db.relationship('UserGroup', backref='user_group_membership')

    __table_args__ = (
        PrimaryKeyConstraint('id', 'staff_user_external_id', 'tenant_id'),
    )

    @classmethod
    def get_group_by_user_and_tenant_id(cls, external_id, tenant_id):
        """Get group by user id."""
        return db.session.query(UserGroupMembership).filter(
            UserGroupMembership.staff_user_external_id == external_id,
            UserGroupMembership.tenant_id == tenant_id).first()

    @classmethod
    def get_groups_by_user_id(cls, external_id):
        """Get groups by user id."""
        return db.session.query(UserGroupMembership).filter(
            UserGroupMembership.staff_user_external_id == external_id).all()

    @classmethod
    def create_user_group_membership(cls, membership_data: dict) -> UserGroupMembership:
        """Create a user group membership."""
        external_id = membership_data.get('external_id')
        group_id = membership_data.get('group_id')
        tenant_id = membership_data.get('tenant_id', getattr(g, 'tenant_id', None))

        if not external_id or not group_id or not tenant_id:
            raise ValueError('external_id, group_id and tenant_id are required to create membership')

        existing_membership: UserGroupMembership = UserGroupMembership.query.filter_by(
            staff_user_external_id=external_id,
            tenant_id=tenant_id,
        ).first()

        if existing_membership:
            existing_membership.group_id = group_id
            existing_membership.is_active = True
            db.session.commit()
            return existing_membership

        user = UserGroupMembership(
            staff_user_external_id=external_id,
            group_id=group_id,
            tenant_id=tenant_id,
            is_active=True,
        )
        user.save()

        return user

    @classmethod
    def update_user_group_membership(cls, membership_data: dict) -> UserGroupMembership:
        """Update a user group membership."""
        external_id = membership_data.get('external_id')
        membership: UserGroupMembership = UserGroupMembership.query.filter_by(
            staff_user_external_id=external_id, tenant_id=g.tenant_id).first()
        if membership:
            # Update membership fields
            for key in ['group_id']:
                if key in membership_data:
                    setattr(membership, key, membership_data[key])

            db.session.commit()

        return membership

    @classmethod
    def remove_user_from_group(cls, external_id, tenant_id, membership_data: dict) -> UserGroupMembership:
        """Remove a user from group."""
        membership: UserGroupMembership = UserGroupMembership.query.filter_by(
            staff_user_external_id=external_id, tenant_id=tenant_id).first()
        if membership:
            # Update membership fields
            if key := 'is_active' in membership_data:
                setattr(membership, key, False)

            db.session.commit()

        return membership
