"""Service for user group membership management."""
from typing import List, Tuple

from sqlalchemy import func

from api.models.db import db
from api.models.user_group import UserGroup
from api.models.user_group_membership import UserGroupMembership
from api.models.user_role import UserRole


ACCESS_REQUEST_GROUP_NAME = 'ACCESS_REQUEST'


class UserGroupMembershipService:
    """User group membership management service."""

    @classmethod
    def get_user_roles_within_tenant(cls, external_id, tenant_id) -> Tuple[List[str], int]:
        """Get all roles for a user based on their external ID."""
        user_roles = []

        # Get the group membership for the user
        user_membership = UserGroupMembership.get_group_by_user_and_tenant_id(external_id, tenant_id)

        # Get all role mappings for the groups
        if user_membership:
            # Get all role IDs for the group
            role_ids = [mapping.role_id for mapping in user_membership.groups.role_mappings]

            # Get role names based on role IDs
            roles = UserRole.query.filter(UserRole.id.in_(role_ids)).all()

            # Extract role names from roles
            user_roles = [role.name for role in roles]

            return user_roles, user_membership.tenant_id

        return user_roles, 0

    @classmethod
    def get_user_group_within_tenant(cls, external_id, tenant_id):
        """Get the group to which a user belongs based on their external ID."""
        # Get the group membership for the user
        user_memberships = UserGroupMembership.get_group_by_user_and_tenant_id(external_id, tenant_id)
        return user_memberships.groups.name if user_memberships else None

    @classmethod
    def get_user_memberships(cls, external_id: str):
        """Get all group memberships for a user based on their external ID."""
        return UserGroupMembership.get_groups_by_user_id(external_id)

    @staticmethod
    def assign_composite_role_to_user(membership_data):
        """Create user_group_membership."""
        return UserGroupMembership.create_user_group_membership(membership_data)

    @staticmethod
    def reassign_composite_role_to_user(membership_data):
        """Update user_group_membership."""
        return UserGroupMembership.update_user_group_membership(membership_data)

    @staticmethod
    def ensure_group_membership(external_id: str, tenant_id: int, group_name: str):
        """Ensure the user has a membership for the given tenant and group name."""
        if not external_id or not tenant_id or not group_name:
            return None

        group = UserGroup.query.filter(UserGroup.name == group_name).first()
        if not group:
            return None

        membership = UserGroupMembership.query.filter(
            UserGroupMembership.staff_user_external_id == external_id,
            UserGroupMembership.tenant_id == tenant_id,
        ).first()

        if membership:
            if membership.group_id != group.id or not membership.is_active:
                membership.group_id = group.id
                membership.is_active = True
                db.session.commit()
            return membership

        membership = UserGroupMembership(
            staff_user_external_id=external_id,
            group_id=group.id,
            tenant_id=tenant_id,
            is_active=True,
        )
        membership.save()
        return membership

    @staticmethod
    def ensure_access_request_membership(external_id: str, tenant_id: int):
        """Ensure a tenant-scoped access-request membership exists for a user.

        The access-request group intentionally has no role mappings, so users
        become visible in tenant user management without receiving permissions.
        """
        if not external_id or not tenant_id:
            return None

        existing_membership = UserGroupMembership.query.filter(
            UserGroupMembership.staff_user_external_id == external_id,
            UserGroupMembership.tenant_id == tenant_id,
        ).first()
        if existing_membership:
            return existing_membership

        group = UserGroup.query.filter(UserGroup.name == ACCESS_REQUEST_GROUP_NAME).first()
        if not group:
            next_group_id = (db.session.query(func.max(UserGroup.id)).scalar() or 0) + 1
            group = UserGroup(name=ACCESS_REQUEST_GROUP_NAME)
            group.id = next_group_id
            group.save()

        membership = UserGroupMembership(
            staff_user_external_id=external_id,
            group_id=group.id,
            tenant_id=tenant_id,
            is_active=True,
        )
        membership.save()
        return membership

    @staticmethod
    def remove_group_memberships_by_group_name(external_id: str, group_name: str) -> int:
        """Remove all memberships for a user that belong to the given group name."""
        if not external_id or not group_name:
            return 0

        memberships = UserGroupMembership.query.join(
            UserGroup,
            UserGroupMembership.group_id == UserGroup.id,
        ).filter(
            UserGroupMembership.staff_user_external_id == external_id,
            UserGroup.name == group_name,
        ).all()

        if not memberships:
            return 0

        for membership in memberships:
            db.session.delete(membership)

        db.session.commit()
        return len(memberships)
