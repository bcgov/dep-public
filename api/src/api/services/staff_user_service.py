"""Service for user management."""
from http import HTTPStatus
from typing import Optional

from flask import current_app, g

from api.exceptions.business_exception import BusinessException
from api.models.db import db
from api.models.membership import Membership
from api.models.pagination_options import PaginationOptions
from api.models.staff_user import StaffUser as StaffUserModel
from api.models.user_group_membership import UserGroupMembership
from api.schemas.staff_user import StaffUserSchema
from api.services.user_group_membership_service import UserGroupMembershipService
from api.utils import notification
from api.utils.constants import CompositeRoles
from api.utils.enums import CompositeRoleId, CompositeRoleNames, UserStatus
from api.utils.roles import Role
from api.utils.template import Template


class StaffUserService:
    """User management service."""

    @classmethod
    def get_user_by_id(cls, _user_id, include_roles=False, include_inactive=False):
        """Get user by id."""
        user_schema = StaffUserSchema()
        db_user = StaffUserModel.get_by_id(_user_id, include_inactive)
        user = user_schema.dump(db_user)
        if include_roles:
            cls.attach_roles([user])
        return user

    @classmethod
    def get_user_by_external_id(cls, _external_id, include_inactive=False):
        """Get user by external id."""
        user_schema = StaffUserSchema()
        db_user = StaffUserModel.get_user_by_external_id(_external_id, include_inactive)
        return user_schema.dump(db_user)

    def create_or_update_user(self, user: dict):
        """Create or update a user."""
        self.validate_fields(user)

        external_id = user.get('external_id')
        db_user = StaffUserModel.get_user_by_external_id(external_id, include_inactive=True)

        if db_user is None:
            new_user = StaffUserModel.create_user(user)
            if len(user.get('roles', [])) == 0:
                self._send_access_request_email(new_user, getattr(g, 'tenant_id', None))
            return new_user

        return StaffUserModel.update_user(db_user.id, user)

    @classmethod
    def sync_super_admin_membership(cls, token_info: dict, token_roles, tenant_id=None):
        """Sync SUPER_ADMIN tenant membership from keycloak roles at login/request time."""
        if getattr(g, 'syncing_super_admin_membership', False) or getattr(db.session, '_flushing', False):
            return

        g.syncing_super_admin_membership = True
        if not token_info:
            g.syncing_super_admin_membership = False
            return

        try:
            external_id = token_info.get('sub')
            if not external_id:
                return

            has_super_admin_role = Role.SUPER_ADMIN.value in set(token_roles or [])

            db_user = StaffUserModel.get_user_by_external_id(external_id, include_inactive=True)
            if db_user is None:
                user_data = {
                    'external_id': external_id,
                    'first_name': token_info.get('given_name'),
                    'last_name': token_info.get('family_name'),
                    'email_address': token_info.get('email'),
                    'username': token_info.get('preferred_username'),
                    'identity_provider': token_info.get('identity_provider', ''),
                    'roles': set(token_roles or []),
                }
                required = ['external_id', 'first_name', 'last_name', 'email_address']
                if all(user_data.get(field) for field in required):
                    cls().create_or_update_user(user_data)

            if has_super_admin_role and tenant_id:
                UserGroupMembershipService.ensure_group_membership(external_id, tenant_id, 'SUPER_ADMIN')
                return

            if not has_super_admin_role:
                UserGroupMembershipService.remove_group_memberships_by_group_name(external_id, 'SUPER_ADMIN')
        finally:
            g.syncing_super_admin_membership = False

    @staticmethod
    def _send_access_request_email(user: StaffUserModel, tenant_id: Optional[int] = None) -> None:
        """Send a new user email.Throws error if fails."""
        templates = current_app.config['EMAIL_TEMPLATES']
        to_email_address = templates['ACCESS_REQUEST']['DEST_EMAIL_ADDRESS']
        if to_email_address is None:
            return
        template_id = templates['ACCESS_REQUEST']['ID']
        subject, body, args = StaffUserService._render_email_template(user, tenant_id)
        try:
            notification.send_email(subject=subject,
                                    email=to_email_address,
                                    html_body=body,
                                    args=args,
                                    template_id=template_id)
        except Exception as exc:  # noqa: B902
            current_app.logger.error('<Notification for new user registration failed', exc)
            raise BusinessException(
                error='Error sending new user registration email.',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR) from exc

    @staticmethod
    def _render_email_template(user: StaffUserModel, tenant_id: Optional[int] = None):
        template = Template.get_template('email_access_request.html')
        templates = current_app.config['EMAIL_TEMPLATES']
        paths = current_app.config['PATHS']
        subject = templates['ACCESS_REQUEST']['SUBJECT']
        tenant_id = tenant_id if tenant_id is not None else getattr(g, 'tenant_id', None)
        grant_access_url = notification.get_tenant_site_url(
            tenant_id, paths['USER_MANAGEMENT']
        ).replace('{id}', str(user.id))
        email_environment = templates['ENVIRONMENT']
        args = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'email_address': user.email_address,
            'grant_access_url': grant_access_url,
            'email_environment': email_environment,
        }
        body = template.render(
            first_name=args.get('first_name'),
            last_name=args.get('last_name'),
            username=args.get('username'),
            email_address=args.get('email_address'),
            grant_access_url=args.get('grant_access_url'),
            email_environment=args.get('email_environment'),
        )
        return subject, body, args

    @staticmethod
    def attach_roles(user_collection):
        """Attach composite roles to user object."""
        for user in user_collection:
            composite_role = UserGroupMembershipService.get_user_group_within_tenant(user.get('external_id'),
                                                                                     g.tenant_id)
            user['composite_roles'] = ''
            if composite_role:
                user['composite_roles'] = composite_role
                user['main_role'] = CompositeRoles[composite_role].value

    @classmethod
    def find_users(
        cls,
        pagination_options: PaginationOptions = None,
        search_text='',
        include_roles=False,
        include_inactive=False
    ):
        """Return a list of users."""
        users, total = StaffUserModel.get_all_paginated(pagination_options, search_text, include_inactive)
        user_collection = StaffUserSchema(many=True).dump(users)

        if include_roles:
            cls.attach_roles(user_collection)

        return {
            'items': user_collection,
            'total': total
        }

    @staticmethod
    def validate_fields(data: StaffUserSchema):
        """Validate all fields."""
        empty_fields = [not data.get(field, None) for field in [
            'first_name',
            'last_name',
            'email_address',
            'external_id',
        ]]

        if any(empty_fields):
            raise ValueError('Some required fields are empty')

    @classmethod
    def assign_composite_role_to_user(cls, external_id: str, composite_role: str):
        """Create or update a user."""
        db_user = StaffUserModel.get_user_by_external_id(external_id)

        cls.validate_user(db_user)

        # Get the corresponding group_id from the CompositeRoleId enum
        group_id = CompositeRoleId[composite_role].value
        UserGroupMembershipService.assign_composite_role_to_user({
            'external_id': external_id,
            'group_id': group_id
        })

        return StaffUserSchema().dump(db_user)

    @staticmethod
    def validate_user(db_user: StaffUserModel):
        """Validate user."""
        if db_user is None:
            raise KeyError('User not found')

        composite_role = UserGroupMembershipService.get_user_group_within_tenant(db_user.external_id,
                                                                                 g.tenant_id)
        if composite_role and CompositeRoleNames.ADMIN.value == composite_role:
            raise BusinessException(
                error='This user is already an Administrator.',
                status_code=HTTPStatus.CONFLICT.value)

    @classmethod
    def delete_deactivated_user(cls, user_id, actor_external_id: Optional[str] = None):
        """Permanently delete a user after required safeguards are satisfied."""
        db_user = StaffUserModel.get_by_id(user_id, include_inactive=True)
        if db_user is None:
            raise BusinessException(error='User not found.', status_code=HTTPStatus.NOT_FOUND)

        if db_user.status_id != UserStatus.INACTIVE.value:
            raise BusinessException(
                error='User must be deactivated before deletion.',
                status_code=HTTPStatus.BAD_REQUEST,
            )

        if actor_external_id and db_user.external_id.lower() == actor_external_id.lower():
            raise BusinessException(
                error='You cannot delete your own account.',
                status_code=HTTPStatus.CONFLICT,
            )

        Membership.query.filter(Membership.user_id == db_user.id).delete(synchronize_session=False)
        UserGroupMembership.query.filter(
            UserGroupMembership.staff_user_external_id == db_user.external_id,
        ).delete(synchronize_session=False)
        db.session.delete(db_user)
        db.session.commit()
