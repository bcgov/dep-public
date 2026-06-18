"""The Authorization service.

This module is to handle authorization related queries.
"""
from http import HTTPStatus

from flask import current_app, g
from flask_restx import abort

from api.constants.membership_type import MembershipType
from api.models.engagement import Engagement as EngagementModel
from api.models.membership import Membership as MembershipModel
from api.models.staff_user import StaffUser as StaffUserModel
from api.utils.enums import MembershipStatus
from api.utils.roles import Role
from api.utils.user_context import UserContext
from api.utils.user_context import user_context as add_user_context


UNAUTHORIZED_MSG = 'You are not authorized to perform this action!'


# pylint: disable=unused-argument
@add_user_context
def check_auth(**kwargs):
    """Check if user is authorized to perform action on the service."""
    skip_tenant_check = current_app.config.get('IS_SINGLE_TENANT_ENVIRONMENT')
    user_from_context: UserContext = kwargs['user_context']
    user_from_db = StaffUserModel.get_user_by_external_id(
        user_from_context.sub)
    if not user_from_db:
        abort(HTTPStatus.FORBIDDEN, 'User not found')

    # Retrieve tenant specific user roles from OIDC token info
    user_roles = current_app.config['JWT_ROLE_CALLBACK'](
        user_from_context.token_info)

    if not user_roles:
        abort(HTTPStatus.FORBIDDEN, UNAUTHORIZED_MSG)

    if Role.SUPER_ADMIN.value in user_roles:
        return  # Let Super Admins do anything they want :3

    required_roles = set(kwargs.get('one_of_roles', []))
    has_valid_roles = set(user_roles) & required_roles
    if has_valid_roles:
        if skip_tenant_check:
            return
        if 'engagement_id' in kwargs:
            _check_engagement_has_tenant(
                kwargs.get('engagement_id'), g.tenant_id)
        return
    membership_eligible_roles = {MembershipType.TEAM_MEMBER.name, MembershipType.REVIEWER.name
                                 } & required_roles
    # check if the user is a member of a passed engagement
    if membership_eligible_roles and _has_team_membership(kwargs, user_from_context,
                                                          membership_eligible_roles):
        return

    abort(HTTPStatus.FORBIDDEN, UNAUTHORIZED_MSG)


@add_user_context
def can_edit_authoring_engagement(*, engagement_id, user_context: UserContext) -> bool:
    """Return whether the current user can access the authoring UI for an engagement."""
    return get_authoring_engagement_access(engagement_id=engagement_id, user_context=user_context)['can_edit']


@add_user_context
def get_authoring_engagement_access(*, engagement_id, user_context: UserContext) -> dict:
    """Return authoring access details for the current user and engagement."""
    token_info = user_context.token_info or {}
    subject = user_context.sub or token_info.get('sub')
    user_from_db = StaffUserModel.get_user_by_external_id(subject)
    user_roles = []
    try:
        user_roles = current_app.config['JWT_ROLE_CALLBACK'](token_info)
    except KeyError:
        current_app.logger.warning(
            'JWT_ROLE_CALLBACK is not configured. No roles will be found for the user.')
    if not subject \
            or not (user_from_db := StaffUserModel.get_user_by_external_id(subject)) \
            or not user_roles:
        return {'can_edit': False, 'access_level': None}

    if Role.SUPER_ADMIN.value in user_roles or Role.VIEW_PRIVATE_ENGAGEMENTS.value in user_roles:
        return {'can_edit': True, 'access_level': 'ADMIN'}

    membership = MembershipModel.find_by_engagement_and_user_id(
        engagement_id,
        user_from_db.id,
        status=MembershipStatus.ACTIVE.value,
    )

    if not membership:
        return {'can_edit': False, 'access_level': None}

    skip_tenant_check = current_app.config.get('IS_SINGLE_TENANT_ENVIRONMENT')
    if not skip_tenant_check and membership.tenant_id and str(membership.tenant_id) != str(g.tenant_id):
        return {'can_edit': False, 'access_level': None}

    if membership.type == MembershipType.TEAM_MEMBER:
        return {'can_edit': True, 'access_level': MembershipType.TEAM_MEMBER.name}

    return {'can_edit': False, 'access_level': membership.type.name}


def _check_engagement_has_tenant(eng_id, tenant_id):
    """Validate users tenant id with engagements tenant id."""
    if not eng_id:
        return
    engagement_tenant_id = EngagementModel.find_tenant_id_by_id(eng_id)
    if engagement_tenant_id and str(tenant_id) != str(engagement_tenant_id):
        current_app.logger.debug('Aborting . Tenant Id on Engagement and user context Mismatch\n'
                                 f'engagement_tenant_id:{engagement_tenant_id}\n'
                                 f'tenant_id: {tenant_id}')

        abort(HTTPStatus.FORBIDDEN, UNAUTHORIZED_MSG)


def _has_team_membership(kwargs, user_from_context, team_permitted_roles) -> bool:
    eng_id = kwargs.get('engagement_id')

    if not eng_id:

        return False

    user = StaffUserModel.get_user_by_external_id(user_from_context.sub)

    if not user:

        return False

    membership = MembershipModel.find_by_engagement_and_user_id(
        eng_id, user.id, status=MembershipStatus.ACTIVE.value)

    if not membership:

        return False

    skip_tenant_check = current_app.config.get('IS_SINGLE_TENANT_ENVIRONMENT')
    if not skip_tenant_check:
        # check tenant matching
        if membership.tenant_id and str(membership.tenant_id) != str(g.tenant_id):
            current_app.logger.debug(f'Aborting . Tenant Id on membership and user context Mismatch'
                                     f'membership.tenant_id:{membership.tenant_id} '
                                     f'user_from_context.tenant_id: {g.tenant_id}')
            abort(HTTPStatus.FORBIDDEN, UNAUTHORIZED_MSG)

    return membership.type.name in team_permitted_roles
