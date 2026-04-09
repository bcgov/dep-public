# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Tests to verify the Engagement API end-point.

Test-Suite to ensure that the /user endpoint is working as expected.
"""
import copy
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import current_app

from api.exceptions.business_exception import BusinessException
from api.models import Tenant as TenantModel
from api.services.staff_user_membership_service import StaffUserMembershipService
from api.services.staff_user_service import StaffUserService
from api.utils.constants import CompositeRoles
from api.utils.enums import CompositeRoleNames, ContentType, UserStatus
from tests.utilities.factory_scenarios import TestJwtClaims, TestTenantInfo, TestUserInfo
from tests.utilities.factory_utils import (
    factory_auth_header, factory_staff_user_model, factory_tenant_model, factory_user_group_membership_model,
    set_global_tenant)


@pytest.mark.parametrize(
    'side_effect, expected_status',
    [
        (KeyError('Test error'), HTTPStatus.BAD_REQUEST),
        (ValueError('Test error'), HTTPStatus.BAD_REQUEST),
    ],
)
def test_create_staff_user(client, jwt, session, side_effect, expected_status,
                           setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a user can be POSTed."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put('/api/user/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('email_address') == claims.get('email')
    tenant_short_name = current_app.config.get('DEFAULT_TENANT_SHORT_NAME')
    tenant = TenantModel.find_by_short_name(tenant_short_name)
    assert rv.json.get('tenant_id') == str(tenant.id)

    with patch.object(StaffUserService, 'create_or_update_user', side_effect=side_effect):
        rv = client.put('/api/user/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status


def test_get_staff_users(client, jwt, session, setup_admin_user_and_claims, setup_super_admin_user_and_claims):
    """Assert that users can be fetched as a list."""
    set_global_tenant()
    staff_1 = dict(TestUserInfo.user_staff_1)
    staff_2 = dict(TestUserInfo.user_staff_1)
    staff_other_tenant = dict(TestUserInfo.user_staff_2)
    staff_other_tenant['tenant_id'] = factory_tenant_model(TestTenantInfo.tenant2).id
    user1 = factory_staff_user_model(user_info=staff_1)
    # Mapping user1 to its tenant via user group membership
    factory_user_group_membership_model(str(user1.external_id), user1.tenant_id)
    user2 = factory_staff_user_model(user_info=staff_2)
    # Mapping user2 to its tenant via user group membership
    factory_user_group_membership_model(str(user2.external_id), user2.tenant_id)

    user3 = factory_staff_user_model(user_info=staff_other_tenant)
    # Mapping user3 to its tenant via user group membership
    factory_user_group_membership_model(str(user3.external_id), user3.tenant_id)

    # Check that staff admins can see users within the same tenant
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get('/api/user/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('total') == 5
    assert len(rv.json.get('items')) == 5

    # Check that super admins only see users from their currently selected tenant
    _, claims = setup_super_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get('/api/user/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('total') == 5
    # Users from other tenants should not be included
    assert len(rv.json.get('items')) == 5


@pytest.mark.parametrize(
    'side_effect, expected_status',
    [
        (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
        (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    ],
)
def test_add_user_to_admin_role(
    client, jwt, session, side_effect, expected_status, setup_admin_user_and_claims
):
    """Assert that a user can be added to the admin role."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    staff_info = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_info)
    rv = client.post(
        f'/api/user/{user.external_id}/roles?role={CompositeRoleNames.ADMIN.value}',
        headers=headers,
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.OK

    with patch.object(StaffUserService, 'assign_composite_role_to_user', side_effect=side_effect):
        rv = client.post(
            f'/api/user/{user.external_id}/roles?role={CompositeRoleNames.ADMIN.value}',
            headers=headers,
            content_type=ContentType.JSON.value,
        )
    assert rv.status_code == expected_status

    with patch.object(
        StaffUserService,
        'assign_composite_role_to_user',
        side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR),
    ):
        rv = client.post(
            f'/api/user/{user.external_id}/roles?role={CompositeRoleNames.ADMIN.value}',
            headers=headers,
            content_type=ContentType.JSON.value,
        )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_add_user_to_reviewer_role(client, jwt, session, setup_admin_user_and_claims):
    """Assert that a user can be added to the reviewer role."""
    user = factory_staff_user_model()

    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post(
        f'/api/user/{user.external_id}/roles?role={CompositeRoleNames.REVIEWER.value}',
        headers=headers,
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.OK

    rv = client.get(
        f'/api/user/{user.id}?include_roles={True}',
        headers=headers,
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('main_role') == CompositeRoles.REVIEWER.value


def test_add_user_to_team_member_role(client, jwt, session, setup_admin_user_and_claims):
    """Assert that a user can be added to the team member group."""
    user = factory_staff_user_model()

    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post(
        f'/api/user/{user.external_id}/roles?role={CompositeRoleNames.TEAM_MEMBER.value}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK

    rv = client.get(
        f'/api/user/{user.id}?include_roles={True}',
        headers=headers,
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('main_role') == CompositeRoles.TEAM_MEMBER.value


def test_add_user_to_team_member_role_across_tenants(client, jwt, session):
    """Assert that a user can be added to the team member role across tenants."""
    set_global_tenant(tenant_id=1)
    user = factory_staff_user_model()
    # users can't modify their own roles, so we need a second user
    other_user = factory_staff_user_model()
    factory_user_group_membership_model(str(user.external_id), user.tenant_id)

    claims = copy.deepcopy(TestJwtClaims.staff_admin_role.value)
    # sets a different tenant id in the request
    claims['tenant_id'] = 2
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post(
        f'/api/user/{other_user.external_id}/roles?role={CompositeRoleNames.TEAM_MEMBER.value}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    # assert staff admin cant do cross tenant operation
    assert rv.status_code == HTTPStatus.UNAUTHORIZED

    claims = copy.deepcopy(TestJwtClaims.system_admin_role.value)
    # sets a different tenant id in the request
    claims['tenant_id'] = 2
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post(
        f'/api/user/{other_user.external_id}/roles?role={CompositeRoleNames.TEAM_MEMBER.value}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    # assert super admins can do cross tenant operations
    # TODO Needs to be modified once the actual role for super admin is finalized
    assert rv.status_code == HTTPStatus.OK


def test_toggle_user_active_status(client, jwt, session, setup_admin_user_and_claims):
    """Assert that a user can be toggled."""
    user = factory_staff_user_model()

    assert user.status_id == UserStatus.ACTIVE.value
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.patch(
        f'/api/user/{user.external_id}/status',
        headers=headers,
        json={'active': False},
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('status_id') == UserStatus.INACTIVE.value


def test_team_member_cannot_toggle_user_active_status(client, jwt, session, setup_team_member_and_claims):
    """Assert that a team member cannot toggle user status."""
    user = factory_staff_user_model()

    assert user.status_id == UserStatus.ACTIVE.value
    _, claims = setup_team_member_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.patch(
        f'/api/user/{user.external_id}/status',
        headers=headers,
        json={'active': False},
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.UNAUTHORIZED


def test_reviewer_cannot_toggle_user_active_status(client, jwt, session, setup_reviewer_and_claims):
    """Assert that a reviewer cannot toggle user status."""
    user = factory_staff_user_model()

    assert user.status_id == UserStatus.ACTIVE.value
    _, claims = setup_reviewer_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.patch(
        f'/api/user/{user.external_id}/status',
        headers=headers,
        json={'active': False},
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.UNAUTHORIZED


def test_toggle_user_active_status_empty_body(client, jwt, session, setup_admin_user_and_claims):
    """Assert that returns bad request if bad request body."""
    user = factory_staff_user_model()

    assert user.status_id == UserStatus.ACTIVE.value
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.patch(
        f'/api/user/{user.external_id}/status',
        headers=headers,
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.BAD_REQUEST


def test_get_staff_users_by_id(client, jwt, session, setup_admin_user_and_claims):
    """Assert that a user can be fetched."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put('/api/user/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    user_id = rv.json.get('id')
    rv = client.get(
        f'/api/user/{user_id}',
        headers=headers,
        content_type=ContentType.JSON.value,
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('id') == user_id


@pytest.mark.parametrize(
    'side_effect, expected_status',
    [
        (KeyError('Test error'), HTTPStatus.BAD_REQUEST),
        (ValueError('Test error'), HTTPStatus.BAD_REQUEST),
    ],
)
def test_errors_on_toggle_user_active_status(
    client,
    jwt,
    session,
    side_effect,
    expected_status,
    setup_admin_user_and_claims,
):
    """Assert that a user can be toggled."""
    user = factory_staff_user_model()

    assert user.status_id == UserStatus.ACTIVE.value
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    with patch.object(
        StaffUserMembershipService,
        'reactivate_deactivate_user',
        side_effect=side_effect,
    ):
        rv = client.patch(
            f'/api/user/{user.external_id}/status',
            headers=headers,
            json={'active': False},
            content_type=ContentType.JSON.value,
        )
    assert rv.status_code == expected_status
