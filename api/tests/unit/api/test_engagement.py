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

"""Tests to verify the Engagement API end-point.

Test-Suite to ensure that the /Engagement endpoint is working as expected.
"""
import copy
import json
import pytest
from http import HTTPStatus
from unittest.mock import patch

from faker import Faker
from flask import current_app
from marshmallow import ValidationError

from api.constants.engagement_status import EngagementDisplayStatus, SubmissionStatus
from api.models.tenant import Tenant as TenantModel
from api.services.engagement_service import EngagementService
from api.utils.constants import TENANT_ID_HEADER
from api.utils.enums import CompositeRoleId, ContentType
from tests.utilities.factory_scenarios import (
    TestEngagementInfo, TestJwtClaims, TestSubmissionInfo, TestTenantInfo, TestUserInfo)
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_metadata_model, factory_engagement_model, factory_membership_model,
    factory_metadata_taxon_model, factory_participant_model, factory_staff_user_model, factory_submission_model,
    factory_survey_and_eng_model, factory_tenant_model, factory_user_group_membership_model, set_global_tenant)


fake = Faker()


@pytest.mark.parametrize('engagement_info', [TestEngagementInfo.engagement1])
@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_add_engagements(client, jwt, session, engagement_info, side_effect, expected_status,
                         setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement can be POSTed."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    with patch.object(EngagementService, 'create_engagement', side_effect=side_effect):
        rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                         headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status

    with patch.object(EngagementService, 'create_engagement', side_effect=ValidationError('Test error')):
        rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                         headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_tenant_id_in_create_engagements(client, jwt, session,
                                         setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement can be POSTed with tenant id."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant_short_name = current_app.config.get('DEFAULT_TENANT_SHORT_NAME')
    tenant = TenantModel.find_by_short_name(tenant_short_name)
    assert tenant is not None
    headers[TENANT_ID_HEADER] = tenant_short_name
    rv = client.post('/api/engagements/', data=json.dumps(TestEngagementInfo.engagement1),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    engagament_tenant_id = rv.json.get('tenant_id')
    assert engagament_tenant_id == str(tenant.id)

    # Create a tenant
    tenant_data = TestTenantInfo.tenant1
    factory_tenant_model(tenant_data)
    tenant2_short_name = tenant_data['short_name']
    tenant_2 = TenantModel.find_by_short_name(tenant2_short_name)

    # Verify that the tenant was created successfully
    assert tenant_2 is not None

    # Set the tenant ID header for future requests
    headers[TENANT_ID_HEADER] = tenant2_short_name

    # Create an engagement for the tenant without setting users tenant
    engagement_data = TestEngagementInfo.engagement2
    response = client.post('/api/engagements/',
                           data=json.dumps(engagement_data),
                           headers=headers,
                           content_type=ContentType.JSON.value)

    # 403 since engagement tenant id is different from users tenant id
    assert response.status_code == HTTPStatus.UNAUTHORIZED

    # set user's tenant id to be same as engagement's tenant id
    staff_2 = dict(TestUserInfo.user_staff_2)
    user = factory_staff_user_model(user_info=staff_2)
    factory_user_group_membership_model(str(user.external_id), tenant_2.id)
    claims = copy.deepcopy(TestJwtClaims.staff_admin_role.value)
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    headers[TENANT_ID_HEADER] = tenant2_short_name
    response = client.post('/api/engagements/',
                           data=json.dumps(engagement_data),
                           headers=headers,
                           content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.OK
    assert response.json['tenant_id'] == str(tenant_2.id)


@pytest.mark.parametrize('engagement_info', [TestEngagementInfo.engagement1])
def test_add_engagements_invalid(client, jwt, session, engagement_info,
                                 setup_unprivileged_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement can not be POSTed without authorization."""
    user, claims = setup_unprivileged_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.UNAUTHORIZED


# pylint:disable=unused-argument
def test_creating_engagments_cross_tenant(client, jwt, session, setup_admin_user_and_claims,
                                          setup_super_admin_user_and_claims):
    """Tests to ensure that (only) super-admins can create engagements across tenants.

    By extension, this tests the superuser's general ability to perform actions across tenants,
    where this would be disallowed for any other user.
    """
    _, adm_claims = setup_admin_user_and_claims
    _, sup_claims = setup_super_admin_user_and_claims
    tenant_short_name = current_app.config.get('DEFAULT_TENANT_SHORT_NAME')
    tenant_1 = TenantModel.find_by_short_name(tenant_short_name)
    assert tenant_1 is not None
    tenant_2 = factory_tenant_model(TestTenantInfo.tenant2)

    engagement_info = TestEngagementInfo.engagement1

    headers = factory_auth_header(jwt=jwt, claims=adm_claims)
    super_headers = factory_auth_header(jwt=jwt, claims=sup_claims)

    # Assert that the staff admin user can create engagements in their tenant,
    # but not in other tenants
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    headers[TENANT_ID_HEADER] = tenant_2.short_name
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.UNAUTHORIZED
    # Assert that the super admin user can create engagements in any tenant
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=super_headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    super_headers[TENANT_ID_HEADER] = tenant_2.short_name
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=super_headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK


@pytest.mark.parametrize('engagement_info', [TestEngagementInfo.engagement1])
@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_get_engagements(client, jwt, session, engagement_info, side_effect, expected_status,
                         setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement can be POSTed."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    created_eng = rv.json

    rv = client.get(f'/api/engagements/{created_eng.get("id")}', data=json.dumps(engagement_info),
                    headers=headers, content_type=ContentType.JSON.value)

    assert created_eng.get('name') == rv.json.get('name')
    assert created_eng.get('content') == rv.json.get('content')

    with patch.object(EngagementService, 'get_engagement', side_effect=side_effect):
        rv = client.get(f'/api/engagements/{created_eng.get("id")}', data=json.dumps(engagement_info),
                        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status

    engagement_id = fake.pyint()
    rv = client.get(f'/api/engagements/{engagement_id}', data=json.dumps(engagement_info),
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


@pytest.mark.parametrize('engagement_info', [TestEngagementInfo.engagement_draft])
def test_get_engagements_reviewer(client, jwt, session, engagement_info,
                                  setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert reviewers access on an engagement."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value
    created_eng = rv.json
    eng_id = created_eng.get('id')
    staff_2 = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_2)
    factory_user_group_membership_model(str(user.external_id), group_id=CompositeRoleId.REVIEWER.value)
    claims = copy.deepcopy(TestJwtClaims.reviewer_role.value)
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/engagements/{eng_id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.FORBIDDEN.value

    factory_membership_model(
        user_id=user.id, engagement_id=eng_id, member_type='REVIEWER')

    # Reveiwer has access to draft engagement if he is assigned
    rv = client.get(f'/api/engagements/{eng_id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value


@pytest.mark.parametrize('engagement_info', [TestEngagementInfo.engagement1])
@pytest.mark.parametrize('side_effect, expected_status', [
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_search_engagements_by_status(client, jwt,
                                      session, engagement_info, side_effect, expected_status,
                                      setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement can be fetched by filtering using the engagement status."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post('/api/engagements/', data=json.dumps(engagement_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    page = 1
    page_size = 10
    sort_key = 'engagement.created_date'
    sort_order = 'desc'
    engagement_status = EngagementDisplayStatus.Open.value

    rv = client.get(f'/api/engagements/?page={page}&size={page_size}&sort_key={sort_key}\
                    &sort_order={sort_order}&engagement_status={[engagement_status]}',
                    data=json.dumps(engagement_info),
                    headers=headers, content_type=ContentType.JSON.value)

    assert rv.json.get('total') == 1

    with patch.object(EngagementService, 'get_engagements_paginated', side_effect=side_effect):
        rv = client.get(f'/api/engagements/?page={page}&size={page_size}&sort_key={sort_key}\
                        &sort_order={sort_order}&engagement_status={[engagement_status]}',
                        data=json.dumps(engagement_info),
                        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status


def test_search_engagements(client, jwt, session,
                            setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Verify the functionality of searching engagements with different access levels."""
    similar_engagement_base_name = fake.name(
    )  # Generate a base name for similar engagements
    set_global_tenant()
    _, claims = setup_admin_user_and_claims

    similar_engagements = []
    total_similar_engagements = 4

    # Create multiple engagements with similar names for testing search
    for i in range(total_similar_engagements):
        # Append a number to distinguish names
        name = f'{similar_engagement_base_name}{i}'
        similar_engagements.append(factory_engagement_model(name=name))

    # Create a dissimilar engagement
    name2 = fake.name()
    eng2 = factory_engagement_model(name=name2)

    total_no_engagements = total_similar_engagements + 1

    # Perform a public search with no parameters to return all engagements
    rv = client.get('/api/engagements/', content_type=ContentType.JSON.value)
    assert rv.json.get('total') == total_no_engagements
    assert rv.status_code == HTTPStatus.OK

    # Perform a public search for similar engagements
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}',
                    content_type=ContentType.JSON.value)
    assert rv.json.get('total') == total_similar_engagements

    # Attempt a public user search for team-level access (should not return anything)
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}&has_team_access=true',
                    content_type=ContentType.JSON.value)
    assert rv.json.get('total') == 0, 'No role, so no results expected'

    # Admin-level searches
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}', headers=headers,
                    content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == total_similar_engagements, 'Matching similar names count for admin'

    # Admin searches with team-level access
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}&has_team_access=true',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == total_similar_engagements, 'Matching similar names count for admin even with team access'

    # Team member level checks
    staff_1 = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_1)
    claims = copy.deepcopy(TestJwtClaims.team_member_role.value)
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    # Team member searches for similar engagements
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}', headers=headers,
                    content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == total_similar_engagements, 'Name search fetches all engagements for team member'

    # Team member with no membership, access should be denied
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}&has_team_access=true',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 0, 'Team member with no membership should not fetch any results'

    # Create membership for a specific engagement for the team member
    factory_membership_model(
        user_id=user.id, engagement_id=similar_engagements[0].id, member_type='TEAM_MEMBER')

    # Team member search with membership, should return the specific engagement
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}&has_team_access=true',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 1, 'Name search works for team member with membership'

    # Create membership for a different engagement and search with the base name
    factory_membership_model(
        user_id=user.id, engagement_id=eng2.id, member_type='TEAM_MEMBER')
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}&has_team_access=true',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 1, 'Different name, so returns only base name results.'

    # Create membership for another similar engagement and perform the search
    factory_membership_model(
        user_id=user.id, engagement_id=similar_engagements[1].id, member_type='TEAM_MEMBER')
    rv = client.get(f'/api/engagements/?search_text={similar_engagement_base_name}&has_team_access=true',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 2, 'Similar name, team member search fetches multiple results'


def test_search_engagements_not_logged_in(client, session):  # pylint:disable=unused-argument
    """Assert that an engagement can be fetched without JWT Token."""
    factory_engagement_model()

    rv = client.get('/api/engagements/', content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 1, 'its visible for public user wit no tenant information'
    assert rv.status_code == HTTPStatus.OK

    tenant_header = {TENANT_ID_HEADER: current_app.config.get(
        'DEFAULT_TENANT_SHORT_NAME')}
    rv = client.get('/api/engagements/', headers=tenant_header,
                    content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 0, 'Tenant based fetching.So dont return the non-tenant info.'
    assert rv.status_code == HTTPStatus.OK

    factory_engagement_model(TestEngagementInfo.engagement3)
    rv = client.get('/api/engagements/', content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 2, 'Both of the engagaments should visible for public user wit no tenant information'
    assert rv.status_code == HTTPStatus.OK

    tenant_header = {TENANT_ID_HEADER: current_app.config.get(
        'DEFAULT_TENANT_SHORT_NAME')}
    rv = client.get('/api/engagements/', headers=tenant_header,
                    content_type=ContentType.JSON.value)
    assert rv.json.get(
        'total') == 1, 'Tenant based fetching.So dont return the non-tenant info.'
    assert rv.status_code == HTTPStatus.OK


@pytest.mark.parametrize('engagement_info', [TestEngagementInfo.engagement1])
@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_patch_engagement(client, jwt, session, engagement_info, side_effect, expected_status,
                          setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement can be updated."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    engagement = factory_engagement_model()
    engagement_id = str(engagement.id)

    engagement_edits = {
        'id': engagement_id,
        'name': fake.name(),
        'start_date': fake.date(),
        'end_date': fake.date(),
        'description': fake.text(),
        'created_date': fake.date(),
    }

    rv = client.patch('/api/engagements/', data=json.dumps(engagement_edits),
                      headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK

    rv = client.get(f'/api/engagements/{engagement_id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('name') == engagement_edits.get('name')
    assert engagement_edits.get('start_date') in rv.json.get('start_date')
    assert engagement_edits.get('end_date') in rv.json.get('end_date')
    assert rv.json.get('description') == engagement_edits.get('description')
    assert engagement_edits.get('created_date') in rv.json.get('created_date')

    with patch.object(EngagementService, 'edit_engagement', side_effect=side_effect):
        rv = client.patch('/api/engagements/', data=json.dumps(engagement_edits),
                          headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status

    with patch.object(EngagementService, 'edit_engagement', side_effect=ValidationError('Test error')):
        rv = client.patch('/api/engagements/', data=json.dumps(engagement_edits),
                          headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.BAD_REQUEST


def test_patch_engagement_by_member(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that an engagement can be updated."""
    engagement = factory_engagement_model()
    engagement_id = str(engagement.id)

    engagement_edits = {
        'id': engagement_id,
        'name': fake.name(),
        'start_date': fake.date(),
        'end_date': fake.date(),
        'description': fake.text(),
        'created_date': fake.date(),
    }

    staff_1 = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_1)
    factory_user_group_membership_model(str(user.external_id), group_id=CompositeRoleId.TEAM_MEMBER.value)
    claims = copy.deepcopy(TestJwtClaims.reviewer_role.value)
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    rv = client.patch('/api/engagements/', data=json.dumps(engagement_edits),
                      headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.FORBIDDEN, 'Not a team member.So throws exception.'

    factory_membership_model(user_id=user.id, engagement_id=engagement_id)

    rv = client.patch('/api/engagements/', data=json.dumps(engagement_edits),
                      headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK, 'Added as team member.So throws exception.'

    rv = client.get(f'/api/engagements/{engagement_id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('name') == engagement_edits.get('name')


def test_patch_engagement_persists_and_returns_suggested_engagements(
    client, jwt, session, setup_admin_user_and_claims
):  # pylint:disable=unused-argument
    """Assert PATCH can persist suggested engagements and include them in response payload."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    source_engagement = factory_engagement_model()
    suggested_target = factory_engagement_model()

    payload = {
        'id': source_engagement.id,
        'more_engagements_heading': 'You may also be interested in',
        'suggested_engagements': [
            {
                'sort_index': 1,
                'suggested_engagement_id': suggested_target.id,
            }
        ],
    }

    rv = client.patch(
        '/api/engagements/',
        data=json.dumps(payload),
        headers=headers,
        content_type=ContentType.JSON.value,
    )

    assert rv.status_code == HTTPStatus.OK
    assert 'suggested_engagements' in rv.json
    assert len(rv.json['suggested_engagements']) == 1
    suggestion = rv.json['suggested_engagements'][0]
    assert suggestion.get('sort_index') == 1
    assert suggestion.get('suggested_engagement_id') == suggested_target.id


def test_patch_new_survey_block_engagement(client, jwt, session,
                                           setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement's survey status blocks can be updated."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    engagement = factory_engagement_model()
    engagement_id = str(engagement.id)

    engagement_edits = {
        'id': engagement_id,
        'status_block': [{
            'block_text': '{"foo":"bar"}',
            'survey_status': SubmissionStatus.Upcoming.name,
            'link_type': 'none',
        }]}
    rv = client.patch('/api/engagements/', data=json.dumps(engagement_edits),
                      headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK

    rv = client.get(f'/api/engagements/{engagement_id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    actual_status_blocks = rv.json.get('status_block')
    assert len(actual_status_blocks) == 1
    assert actual_status_blocks[0].get('block_text') == engagement_edits.get(
        'status_block')[0].get('block_text')
    assert actual_status_blocks[0].get('survey_status') == engagement_edits.get(
        'status_block')[0].get('survey_status')


def test_update_survey_block_engagement(client, jwt, session,
                                        setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement's survey status blocks can be updated."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    engagement = factory_engagement_model(TestEngagementInfo.engagement2)
    engagement_id = str(engagement.id)

    block_text_for_upcoming = '{"foo1":"bar1"}'
    engagement_edits = {
        'id': engagement_id,
        'status_block': [{
            'block_text': block_text_for_upcoming,
            'survey_status': SubmissionStatus.Closed.name,
            'link_type': 'none',
        }, {
            'block_text': '{"foo2":"bar2"}',
            'survey_status': SubmissionStatus.Open.name,
            'link_type': 'none',
        }]}
    rv = client.patch('/api/engagements/', data=json.dumps(engagement_edits),
                      headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK

    rv = client.get(f'/api/engagements/{engagement_id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    actual_status_blocks = rv.json.get('status_block')
    assert len(actual_status_blocks) == 2
    upcoming_block = next(x for x in actual_status_blocks if x.get(
        'survey_status') == SubmissionStatus.Closed.name)
    assert upcoming_block.get('block_text') == block_text_for_upcoming


@pytest.mark.parametrize('engagement_info', [TestEngagementInfo.engagement1])
def test_count_submissions(client, jwt, session, engagement_info):  # pylint:disable=unused-argument
    """Assert that an engagement can be POSTed."""
    headers = factory_auth_header(
        jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    factory_staff_user_model(TestJwtClaims.public_user_role.get('sub'))
    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.approved_submission)
    factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.rejected_submission)
    factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.needs_further_review_submission)
    factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.pending_submission)

    rv = client.get(f'/api/engagements/{eng.id}', data=json.dumps(engagement_info),
                    headers=headers, content_type=ContentType.JSON.value)

    submission_meta_data = rv.json.get('submissions_meta_data', {})
    assert submission_meta_data.get('total', 0) == 4
    assert submission_meta_data.get('approved', 0) == 1
    assert submission_meta_data.get('pending', 0) == 1
    assert submission_meta_data.get('needs_further_review', 0) == 1


def test_get_engagements_metadata_match_all(client, session):  # pylint:disable=unused-argument
    """Assert that engagements can be looked up by metadata (match all)."""
    engagements = [factory_engagement_model({
        **TestEngagementInfo.engagement1,
        'tenant_id': 1
    }) for _ in range(0, 10)]
    taxon = factory_metadata_taxon_model(1, {
        'name': 'Category',
        'description': 'Category description',
        'data_type': 'text',
        'tenant_id': 1
    })
    for engagement in engagements:
        factory_engagement_metadata_model({
            'engagement_id': engagement.id,
            'taxon_id': taxon.id,
            'value': 'Category value',
            'tenant_id': 1
        })

    # Add a value to one of the engagements to test the filter
    factory_engagement_metadata_model({
        'engagement_id': engagements[0].id,
        'taxon_id': taxon.id,
        'value': 'Different',
        'tenant_id': 1
    })
    # pass in pagination options and do the count
    metadata_1 = json.dumps(
        [{
            'name': 'Category',
            'values': ['Category value'],
            'filter_type': 'chips_all',
            'taxon_id': taxon.id
        }],
        separators=(',', ':')  # Remove spaces between keys and values
    )

    rv = client.get(f'/api/engagements/?metadata={metadata_1}')

    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('total') == 10

    metadata_2 = json.dumps(
        [{
            'name': 'Category',
            'values': ['Different'],
            'filter_type': 'chips_all',
            'taxon_id': taxon.id
        }],
        separators=(',', ':')  # Remove spaces between keys and values
    )

    rv = client.get(f'/api/engagements/?metadata={metadata_2}')
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('total') == 1

    metadata_3 = json.dumps(
        [{
            'name': 'Category',
            'values': ['Category value', 'Different'],
            'filter_type': 'chips_all',
            'taxon_id': taxon.id
        }],
        separators=(',', ':')  # Remove spaces between keys and values
    )

    rv = client.get(
        f'/api/engagements/?metadata={metadata_3}')
    assert rv.status_code == HTTPStatus.OK
    # the filter should only return the engagement with both values
    assert rv.json.get('total') == 1


def test_get_engagements_metadata_match_any(client, session):  # pylint:disable=unused-argument
    """Assert that engagements can be looked up by metadata (match all)."""
    engagements = [factory_engagement_model({
        **TestEngagementInfo.engagement1,
        'tenant_id': 1
    }) for _ in range(0, 10)]
    taxon = factory_metadata_taxon_model(1, {
        'name': 'Category',
        'description': 'Category description',
        'data_type': 'text',
        'tenant_id': 1
    })
    for engagement in engagements:
        factory_engagement_metadata_model({
            'engagement_id': engagement.id,
            'taxon_id': taxon.id,
            'value': 'Category value',
            'tenant_id': 1
        })

    # Add a value to one of the engagements to test the filter
    factory_engagement_metadata_model({
        'engagement_id': engagements[0].id,
        'taxon_id': taxon.id,
        'value': 'Different',
        'tenant_id': 1
    })
    # pass in pagination options and do the count
    metadata_1 = json.dumps(
        [{
            'name': 'Category',
            'values': ['Category value'],
            'filter_type': 'chips_any',
            'taxon_id': taxon.id
        }],
        separators=(',', ':')  # Remove spaces between keys and values
    )

    rv = client.get(f'/api/engagements/?metadata={metadata_1}')

    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('total') == 10

    metadata_2 = json.dumps(
        [{
            'name': 'Category',
            'values': ['Different'],
            'filter_type': 'chips_any',
            'taxon_id': taxon.id
        }],
        separators=(',', ':')  # Remove spaces between keys and values
    )

    rv = client.get(f'/api/engagements/?metadata={metadata_2}')
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('total') == 1

    metadata_3 = json.dumps(
        [{
            'name': 'Category',
            'values': ['Category value', 'Different'],
            'filter_type': 'chips_any',
            'taxon_id': taxon.id
        }],
        separators=(',', ':')  # Remove spaces between keys and values
    )

    rv = client.get(
        f'/api/engagements/?metadata={metadata_3}')
    assert rv.status_code == HTTPStatus.OK
    # the filter should return the engagements with either value
    assert rv.json.get('total') == 10


def test_delete_engaement(client, jwt, session, mocker,
                          setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that the resource DELETE /api/engagements/<id>/delete returns 200 on success and maps errors correctly."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    engagement = factory_engagement_model()
    engagement_id = str(engagement.id)

    mocker.patch('api.services.engagement_service.EngagementService.delete', return_value=None)
    rv = client.delete(
        f'api/engagements/{engagement_id}/delete',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.get_json() == {'id': engagement_id}

    mocker.patch('api.services.engagement_service.EngagementService.delete', side_effect=KeyError('boom'))
    rv = client.delete(
        f'api/engagements/{engagement_id}/delete',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR

    mocker.patch('api.services.engagement_service.EngagementService.delete', side_effect=ValueError('bad'))
    rv = client.delete(
        f'api/engagements/{engagement_id}/delete',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.BAD_REQUEST
