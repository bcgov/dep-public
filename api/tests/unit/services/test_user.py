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

"""Tests to verify the User Service class.

Test-Suite to ensure that the UserService is working as expected.
"""
import pytest
from faker import Faker
from unittest.mock import patch
from flask import current_app

from api.models.staff_user import StaffUser as StaffUserModel
from api.models.user_group import UserGroup
from api.models.user_group_membership import UserGroupMembership
from api.schemas.staff_user import StaffUserSchema
from api.services.staff_user_service import StaffUserService
from api.utils import notification
from api.utils.enums import UserStatus
from tests.utilities.factory_scenarios import TestTenantInfo, TestUserInfo
from tests.utilities.factory_utils import (
    factory_staff_user_model, factory_tenant_model, factory_user_group_membership_model, set_global_tenant)


fake = Faker()


def test_getuser(client, jwt, session, ):  # pylint:disable=unused-argument
    """Assert that an user can be fetched."""
    user_details = factory_staff_user_model()
    user: dict = StaffUserService.get_user_by_external_id(user_details.external_id)
    assert user.get('external_id') == user_details.external_id


def test_create_user_invalid_without_external_id(client, jwt, session, ):  # pylint:disable=unused-argument
    """Assert that an user can be Created."""
    user_data: dict = TestUserInfo.user_staff_1
    user_data['external_id'] = ''
    user_schema = StaffUserSchema().load(user_data)
    with pytest.raises(ValueError) as exception:
        StaffUserService().create_or_update_user(user_schema)
    assert exception is not None
    assert str(exception.value) == 'Some required fields are empty'


def test_create_user(client, jwt, session, notify_mock, ):  # pylint:disable=unused-argument
    """Assert that a user can be Created."""
    set_global_tenant()
    user_data: dict = TestUserInfo.user_staff_1
    external_id = str(fake.random_number(digits=5))
    user_data['external_id'] = external_id
    user_schema = StaffUserSchema().load(user_data)
    new_user = StaffUserService().create_or_update_user(user_schema)
    assert new_user is not None
    assert new_user.external_id == external_id
    assert new_user.first_name == user_data['first_name']


def test_update_user_email(client, jwt, session, ):  # pylint:disable=unused-argument
    """Assert that a user can be updated."""
    user_details = factory_staff_user_model()
    old_email = user_details.email_address
    user_id = user_details.id
    # verify existing details
    user: dict = StaffUserService.get_user_by_external_id(user_details.external_id)
    assert user.get('email_address') == old_email
    assert user.get('id') == user_id

    new_user_data = {
        'email_address': fake.email(),
        'first_name': user_details.first_name,
        'last_name': user_details.last_name,
        'external_id': user_details.external_id,
    }
    user_schema = StaffUserSchema().load(new_user_data)
    new_user = StaffUserService().create_or_update_user(user_schema)
    assert new_user is not None

    # verify same user , but different email id
    assert new_user.external_id == user_details.external_id
    assert new_user.first_name == user_details.first_name
    assert new_user.id == user_details.id
    assert new_user.email_address == new_user_data.get('email_address')


def test_delete_deactivated_user_removes_only_current_tenant_membership(client, jwt, session):
    """Assert tenant-aware delete only removes current tenant membership when user belongs elsewhere."""
    set_global_tenant(tenant_id=1)
    other_tenant = factory_tenant_model(TestTenantInfo.tenant2)
    user = factory_staff_user_model()
    user.status_id = UserStatus.INACTIVE.value
    user.save()

    factory_user_group_membership_model(str(user.external_id), tenant_id=1)
    factory_user_group_membership_model(str(user.external_id), tenant_id=other_tenant.id)

    response = StaffUserService.delete_deactivated_user(user.id, actor_external_id='different-actor')

    assert response.get('action') == 'removed_current_tenant_membership'
    assert StaffUserModel.get_by_id(user.id, include_inactive=True) is not None
    assert UserGroupMembership.get_group_by_user_and_tenant_id(str(user.external_id), 1) is None
    assert UserGroupMembership.get_group_by_user_and_tenant_id(str(user.external_id), other_tenant.id) is not None


def test_delete_deactivated_user_fully_deletes_single_tenant_user(client, jwt, session):
    """Assert tenant-aware delete fully deletes user when no other tenant memberships exist."""
    set_global_tenant(tenant_id=1)
    user = factory_staff_user_model()
    user.status_id = UserStatus.INACTIVE.value
    user.save()

    factory_user_group_membership_model(str(user.external_id), tenant_id=1)

    response = StaffUserService.delete_deactivated_user(user.id, actor_external_id='different-actor')

    assert response.get('action') == 'deleted_user'
    assert StaffUserModel.get_by_id(user.id, include_inactive=True) is None
    assert UserGroupMembership.get_group_by_user_and_tenant_id(str(user.external_id), 1) is None


def test_create_user_without_roles_creates_access_request_membership(client, jwt, session, notify_mock):
    """Assert first login with no roles creates a no-permissions tenant association."""
    set_global_tenant(tenant_id=1)
    user_data = dict(TestUserInfo.user_staff_1)
    user_data['external_id'] = str(fake.uuid4())
    user_data['roles'] = []

    created_user = StaffUserService().create_or_update_user(user_data)
    assert created_user is not None

    access_request_group = UserGroup.query.filter(UserGroup.name == 'ACCESS_REQUEST').first()
    assert access_request_group is not None

    membership = UserGroupMembership.get_group_by_user_and_tenant_id(str(created_user.external_id), 1)
    assert membership is not None
    assert membership.group_id == access_request_group.id


def test_existing_user_login_to_new_tenant_without_roles_creates_access_request_membership(client, jwt, session):
    """Assert no-role login to another tenant creates tenant-specific pending association."""
    set_global_tenant(tenant_id=1)
    existing_user = factory_staff_user_model()
    user_data = {
        'external_id': str(existing_user.external_id),
        'first_name': existing_user.first_name,
        'last_name': existing_user.last_name,
        'email_address': existing_user.email_address,
        'roles': [],
    }

    other_tenant = factory_tenant_model(TestTenantInfo.tenant2)
    set_global_tenant(tenant_id=other_tenant.id)

    StaffUserService().create_or_update_user(user_data)

    access_request_group = UserGroup.query.filter(UserGroup.name == 'ACCESS_REQUEST').first()
    membership = UserGroupMembership.get_group_by_user_and_tenant_id(str(existing_user.external_id), other_tenant.id)
    assert access_request_group is not None
    assert membership is not None
    assert membership.group_id == access_request_group.id


def test_access_request_email_sent_to_global_and_tenant_contacts(client, jwt, session, monkeypatch):
    """Assert access request sends notification to global and tenant primary contacts."""
    tenant_data = dict(TestTenantInfo.tenant1)
    tenant_data['short_name'] = 'GDXE'
    tenant_data['contact_email'] = 'tenant.contact@gov.bc.ca'
    tenant = factory_tenant_model(tenant_data)

    user = factory_staff_user_model()

    expected_global_contact = 'global.access@gov.bc.ca'
    monkeypatch.setitem(
        current_app.config['EMAIL_TEMPLATES']['ACCESS_REQUEST'],
        'DEST_EMAIL_ADDRESS',
        expected_global_contact,
    )

    with patch.object(notification, 'send_email') as mocked_send_email:
        StaffUserService._send_access_request_email(user, tenant_id=tenant.id)

    sent_to = [call.kwargs.get('email') for call in mocked_send_email.call_args_list]

    assert expected_global_contact in sent_to
    assert tenant.contact_email in sent_to
    assert len(sent_to) == 2
