# Copyright © 2021 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""API endpoints for managing an user resource."""

from http import HTTPStatus

from flask import current_app, g, jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from api.auth import auth
from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.models.pagination_options import PaginationOptions
from api.schemas.engagement import EngagementSchema
from api.schemas.staff_user import StaffUserSchema
from api.schemas.tenant import TenantSchema
from api.services import authorization
from api.services.membership_service import MembershipService
from api.services.staff_user_membership_service import StaffUserMembershipService
from api.services.staff_user_service import StaffUserService
from api.services.tenant_service import TenantService
from api.services.user_group_membership_service import UserGroupMembershipService
from api.utils.roles import Role
from api.utils.tenant_validator import require_role
from api.utils.token_info import TokenInfo
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('user', description='Endpoints for User Management')
"""Custom exception messages
"""


@cors_preflight('GET, PUT')
@API.route('/')
class StaffUsers(Resource):
    """User controller class."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def put():
        """Update or create a user."""
        try:
            user_data = TokenInfo.get_user_data()
            user = StaffUserService().create_or_update_user(user_data)
            user.roles = current_app.config['JWT_ROLE_CALLBACK'](g.jwt_oidc_token_info)
            user_info = StaffUserSchema().dump(user)
            StaffUserService.attach_roles([user_info])
            return user_info, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.VIEW_USERS.value])
    def get():
        """Return a set of users(staff only)."""
        args = request.args
        pagination_options = PaginationOptions(
            page=args.get('page', None, int),
            size=args.get('size', None, int),
            sort_key=args.get('sort_key', '', str),
            sort_order=args.get('sort_order', 'asc', str),
        )
        users = StaffUserService.find_users(
            pagination_options=pagination_options,
            search_text=args.get('search_text', '', str),
            include_roles=args.get('include_roles', default=False, type=lambda v: v.lower() == 'true'),
            include_inactive=args.get('include_inactive', default=False, type=lambda v: v.lower() == 'true')
        )
        return jsonify(users), HTTPStatus.OK


@cors_preflight('GET, DELETE')
@API.route('/<user_id>')
class StaffUser(Resource):
    """User controller class."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.VIEW_USERS.value])
    def get(user_id):
        """Fetch a user by id."""
        args = request.args
        user = StaffUserService.get_user_by_id(
            user_id,
            include_roles=args.get('include_roles', default=False, type=lambda v: v.lower() == 'true'),
            include_inactive=True,
        )
        return user, HTTPStatus.OK

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.SUPER_ADMIN.value])
    def delete(user_id):
        """Permanently delete an inactive user."""
        try:
            user_data = TokenInfo.get_user_data()
            StaffUserService.delete_deactivated_user(user_id, user_data.get('external_id'))
            return {'message': 'User deleted successfully.'}, HTTPStatus.OK
        except BusinessException as err:
            return {'message': err.error}, err.status_code


@cors_preflight('PATCH')
@API.route('/<user_id>/status')
class StaffUserStatus(Resource):
    """User controller class."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.TOGGLE_USER_STATUS.value])
    def patch(user_id):
        """Return a set of users(staff only)."""
        try:
            data = request.get_json()
            if data.get('active', None) is None:
                return {'message': 'active field is required'}, HTTPStatus.BAD_REQUEST

            user = StaffUserMembershipService().reactivate_deactivate_user(
                user_id,
                active=data.get('active'),
            )
            return user, HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.BAD_REQUEST


@cors_preflight('POST, PUT')
@API.route('/<user_id>/roles')
class UserRoles(Resource):
    """Add user to composite roles."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.CREATE_ADMIN_USER.value])
    def post(user_id):
        """Add user to composite roles."""
        try:
            args = request.args
            user_schema = StaffUserService().assign_composite_role_to_user(user_id, args.get('role'))
            return user_schema, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except BusinessException as err:
            return {'message': err.error}, err.status_code

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.UPDATE_USER_GROUP.value])
    def put(user_id):
        """Update user composite roles."""
        try:
            args = request.args
            user_schema = StaffUserMembershipService().reassign_user(user_id, args.get('role'))
            return user_schema, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except BusinessException as err:
            return {'message': err.error}, err.status_code


@cors_preflight('GET,OPTIONS')
@API.route('/<user_id>/engagements')
class EngagementMemberships(Resource):
    """Resource for fetching engagements for user."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.VIEW_USERS.value])
    def get(user_id):
        """Get engagement details by user id."""
        try:
            members = MembershipService.get_engagements_by_user(user_id)
            engagement_schema = EngagementSchema(exclude=['surveys', 'rich_content', 'rich_description'], many=True)
            return jsonify(engagement_schema.dump(members, many=True)), HTTPStatus.OK
        except BusinessException as err:
            return {'message': err.error}, err.status_code


@cors_preflight('GET,OPTIONS')
@API.route('/<user_id>/tenants')
class UserTenants(Resource):
    """Fetches tenants for a given user."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.requires_auth
    def get(user_id):
        """Get tenant details by user id."""
        if user_id == 'me':
            user_data = TokenInfo.get_user_data()
            user_id = user_data.get('external_id')
            current_app.logger.debug('User ID: %s', user_id)
            user_roles = current_app.config['JWT_ROLE_CALLBACK'](g.jwt_oidc_token_info)
            if Role.SUPER_ADMIN.value in user_roles:
                return TenantService.get_all(), HTTPStatus.OK
        else:
            authorization.check_auth(
                one_of_roles=(
                    Role.VIEW_USERS.value,
                ),
                user_id=user_id
            )

        try:
            members = UserGroupMembershipService.get_user_memberships(user_id)
            tenants = TenantSchema().dumps([member.tenant for member in members], many=True)
            return tenants, HTTPStatus.OK
        except BusinessException as err:
            return {'message': err.error}, err.status_code
