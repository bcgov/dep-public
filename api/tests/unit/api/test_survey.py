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
from http import HTTPStatus

from unittest.mock import patch
import pytest
from flask import current_app

from api.constants.engagement_status import Status
from api.exceptions.business_exception import BusinessException
from api.models.engagement import Engagement as EngagementModel
from api.models.membership import Membership as MembershipModel
from api.models.tenant import Tenant as TenantModel
from api.services.survey_service import SurveyService
from api.utils.constants import TENANT_ID_HEADER
from api.utils.enums import CompositeRoleId, ContentType, MembershipStatus
from tests.utilities.factory_scenarios import (
    TestEngagementInfo, TestJwtClaims, TestSurveyInfo, TestTenantInfo, TestUserInfo)
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_model, factory_membership_model, factory_staff_user_model,
    factory_survey_model, factory_tenant_model, factory_user_group_membership_model, set_global_tenant)


surveys_url = '/api/surveys/'


@pytest.mark.parametrize('survey_info', [TestSurveyInfo.survey1])
@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_create_survey(client, jwt, session, survey_info, side_effect, expected_status,
                       setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an survey can be POSTed."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    data = {
        'name': survey_info.get('name'),
        'display': survey_info.get('form_json').get('display'),
    }
    rv = client.post(surveys_url, data=json.dumps(data),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value
    assert rv.json.get('form_json') == survey_info.get('form_json')

    with patch.object(SurveyService, 'create', side_effect=side_effect):
        rv = client.post(surveys_url, data=json.dumps(data),
                         headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status


def test_create_survey_with_tenant(client, jwt, session,
                                   setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an survey can be POSTed."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant_short_name = current_app.config.get('DEFAULT_TENANT_SHORT_NAME')
    tenant = TenantModel.find_by_short_name(tenant_short_name)
    assert tenant is not None
    headers[TENANT_ID_HEADER] = tenant_short_name

    rv = client.post(surveys_url, data=json.dumps({
        'name': TestSurveyInfo.survey1.get('name'),
        'display': TestSurveyInfo.survey1.get('form_json').get('display'),
    }), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value
    survey_tenant_id = rv.json.get('tenant_id')
    assert survey_tenant_id == str(tenant.id)

    # Create a tenant, specifying a custom shortname to avoid collisions
    tenant_data = {**TestTenantInfo.tenant2, 'short_name': 'TENANT2'}
    factory_tenant_model(tenant_data)
    tenant2_short_name = tenant_data['short_name']
    tenant_2 = TenantModel.find_by_short_name(tenant2_short_name)
    # Verify that the tenant was created successfully
    assert tenant_2 is not None

    # Set the tenant ID header for future requests
    headers[TENANT_ID_HEADER] = tenant2_short_name

    # Assert same staff admin can't create survey in a different tenant since he is a part of initial tenant.
    rv = client.post(surveys_url, data=json.dumps({
        'name': TestSurveyInfo.survey2.get('name'),
        'display': TestSurveyInfo.survey2.get('form_json').get('display'),
    }), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.UNAUTHORIZED

    # emulate Tenant 2 staff admin by setting tenant id
    staff_info = dict(TestUserInfo.user_staff_3)
    staff_info['tenant_id'] = tenant_2.id
    user = factory_staff_user_model(user_info=staff_info)
    factory_user_group_membership_model(str(user.external_id), tenant_2.id)
    set_global_tenant(tenant_id=tenant_2.id)
    claims = copy.deepcopy(TestJwtClaims.staff_admin_role.value)
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    headers[TENANT_ID_HEADER] = tenant2_short_name

    # Create a survey within the new tenant
    rv = client.post(surveys_url, data=json.dumps({
        'name': TestSurveyInfo.survey2.get('name'),
        'display': TestSurveyInfo.survey2.get('form_json').get('display'),
    }), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value

    # Verify that the new survey belongs to the correct tenant
    survey_tenant_id = rv.json.get('tenant_id')
    assert survey_tenant_id == str(tenant_2.id)


@pytest.mark.parametrize('survey_info', [TestSurveyInfo.survey2])
@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_put_survey(client, jwt, session, survey_info, side_effect, expected_status,
                    setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an survey can be POSTed."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    survey = factory_survey_model()
    survey_id = str(survey.id)
    new_survey_name = 'new_survey_name'
    rv = client.put(surveys_url, data=json.dumps({'id': survey_id, 'name': new_survey_name}),
                    headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK.value

    rv = client.get(f'{surveys_url}{survey_id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value
    assert rv.json.get('form_json') == survey_info.get('form_json')
    assert rv.json.get('name') == new_survey_name

    with patch.object(SurveyService, 'update', side_effect=side_effect):
        rv = client.put(surveys_url, data=json.dumps({'id': survey_id, 'name': new_survey_name}),
                        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status

    with patch.object(SurveyService, 'update',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR)):
        rv = client.put(surveys_url, data=json.dumps({'id': survey_id, 'name': new_survey_name}),
                        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_survey_link(client, jwt, session, side_effect, expected_status,
                     setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a survey can be POSTed."""
    user, claims = setup_admin_user_and_claims
    survey = factory_survey_model()
    survey_id = survey.id
    headers = factory_auth_header(jwt=jwt, claims=claims)

    eng = factory_engagement_model()
    eng_id = eng.id

    # assert eng id is none in GET Survey
    rv = client.get(
        f'{surveys_url}{survey_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.json.get('engagement_id') is None

    # link them together
    client.put(
        f'{surveys_url}{survey_id}/link/engagement/{eng_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    with patch.object(SurveyService, 'link', side_effect=side_effect):
        rv = client.put(
            f'{surveys_url}{survey_id}/link/engagement/{eng_id}',
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == expected_status

    rv = client.get(
        f'{surveys_url}{survey_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.json.get('engagement_id') == str(eng_id)

    with patch.object(SurveyService, 'get', side_effect=side_effect):
        rv = client.get(
            f'{surveys_url}{survey_id}',
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == expected_status

    # test if public user can fetch open surveys
    rv = client.get(
        f'{surveys_url}{survey_id}',
        headers=factory_auth_header(jwt=jwt, claims=TestJwtClaims.public_user_role),
        content_type=ContentType.JSON.value
    )
    assert rv.json.get('engagement_id') == str(eng_id)


def test_get_hidden_survey_for_admins(client, jwt, session,
                                      setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a hidden survey can be fetched by admins."""
    set_global_tenant()
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    factory_survey_model(TestSurveyInfo.hidden_survey)

    page = 1
    page_size = 10
    sort_key = 'survey.created_date'
    sort_order = 'desc'

    rv = client.get(f'{surveys_url}?page={page}&size={page_size}&sort_key={sort_key}\
                    &sort_order={sort_order}&search_text=',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value
    assert rv.json.get('total') == 1


def test_get_survey_for_reviewer(client, jwt, session):  # pylint:disable=unused-argument
    """Assert reviewers different permission."""
    set_global_tenant()
    staff_1 = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_1)
    factory_user_group_membership_model(str(user.external_id), group_id=CompositeRoleId.REVIEWER.value)
    claims = copy.deepcopy(TestJwtClaims.reviewer_role.value)
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    survey1 = factory_survey_model(TestSurveyInfo.survey1)

    # Attempt to access unlinked survey
    rv = client.get(f'{surveys_url}{survey1.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == 403

    # Link to a draft engagement
    eng: EngagementModel = factory_engagement_model(status=Status.Draft.value)
    survey1.engagement_id = eng.id
    survey1.commit()

    # Attempt to access survey linked to draft engagement
    rv = client.get(f'{surveys_url}{survey1.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == 403

    # Add user as a reviewer in the team
    factory_membership_model(user_id=user.id, engagement_id=eng.id, member_type='REVIEWER')

    # Assert Reviewer can see the survey since he is added to the team.
    rv = client.get(f'{surveys_url}{survey1.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value

    # Deactivate membership
    membership_model: MembershipModel = MembershipModel.find_by_engagement_and_user_id(eng.id, user.id)
    membership_model.status = MembershipStatus.INACTIVE.value
    membership_model.commit()

    rv = client.get(f'{surveys_url}{survey1.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    # Verify reviewer lost access after being removed from the team
    assert rv.status_code == 403

    # Publish the engagement
    eng.status_id = Status.Published.value
    eng.commit()
    rv = client.get(f'{surveys_url}{survey1.id}',
                    headers=headers, content_type=ContentType.JSON.value)

    # Assert user can access  the survey even when he is removed from the team since its published.
    assert rv.status_code == HTTPStatus.OK.value


def test_get_hidden_survey_for_team_member(
    client, jwt, session, setup_team_member_and_claims
):  # pylint:disable=unused-argument
    """Assert that a hidden survey cannot be fetched by team members."""
    _, claims = setup_team_member_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    set_global_tenant()
    factory_survey_model(TestSurveyInfo.hidden_survey)

    page = 1
    page_size = 10
    sort_key = 'survey.created_date'
    sort_order = 'desc'

    rv = client.get(f'{surveys_url}?page={page}&size={page_size}&sort_key={sort_key}\
                    &sort_order={sort_order}&search_text=',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value
    assert rv.json.get('total') == 0


def test_get_template_survey(client, jwt, session,
                             setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a hidden survey cannot be fetched by team members."""
    set_global_tenant()
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    factory_survey_model(TestSurveyInfo.survey_template)

    page = 1
    page_size = 10
    sort_key = 'survey.created_date'
    sort_order = 'desc'

    rv = client.get(f'{surveys_url}?page={page}&size={page_size}&sort_key={sort_key}\
                    &sort_order={sort_order}&search_text=',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value
    assert rv.json.get('total') == 1


def test_edit_template_survey_for_admins(client, jwt, session,
                                         setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a hidden survey cannot be fetched by team members."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    survey = factory_survey_model(TestSurveyInfo.survey_template)
    survey_id = str(survey.id)
    new_survey_name = 'new_survey_name'
    rv = client.put(surveys_url, data=json.dumps({'id': survey_id, 'name': new_survey_name}),
                    headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK.value, 'Admins are able to edit template surveys'


def test_edit_template_survey_for_team_member(
    client, jwt, session, setup_team_member_and_claims
):  # pylint:disable=unused-argument
    """Assert that a hidden survey cannot be fetched by team members."""
    _, claims = setup_team_member_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    survey = factory_survey_model(TestSurveyInfo.survey_template)
    survey_id = str(survey.id)
    new_survey_name = 'new_survey_name'
    rv = client.put(surveys_url, data=json.dumps({'id': survey_id, 'name': new_survey_name}),
                    headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == 403, 'Team members are not able to edit template surveys, so throws exception.'


@pytest.mark.parametrize('survey_info', [TestSurveyInfo.survey2])
def test_surveys_clone_admin(mocker, client, jwt, session, survey_info,
                             setup_admin_user_and_claims):
    """Assert that a survey can be cloned."""
    user, claims = setup_admin_user_and_claims
    survey = factory_survey_model()
    headers = factory_auth_header(jwt=jwt, claims=claims)

    # Prepare test data
    request_data = {'name': 'New Survey'}

    # Mock the SurveyService.get method
    mocker.patch(
        'api.services.survey_service.SurveyService.get',
        return_value=survey_info
    )

    # Make a POST request to the SurveysClone endpoint
    response = client.post(
        f'{surveys_url}{survey.id}/clone',
        data=json.dumps(request_data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    # Assert the response status code and data
    assert response.status_code == HTTPStatus.OK
    assert response.get_json().get('form_json') == survey.form_json


@pytest.mark.parametrize('survey_info', [TestSurveyInfo.survey2])
def test_surveys_clone_team_member(mocker, client, jwt, session, survey_info,
                                   setup_team_member_and_claims):
    """Assert that a survey can be cloned."""
    _, claims = setup_team_member_and_claims
    survey = factory_survey_model()
    headers = factory_auth_header(jwt=jwt, claims=claims)

    # Prepare test data
    request_data = {'name': 'New Survey'}

    # Mock the SurveyService.get method
    mocker.patch(
        'api.services.survey_service.SurveyService.get',
        return_value=survey_info
    )

    # Make a POST request to the SurveysClone endpoint
    response = client.post(
        f'{surveys_url}{survey.id}/clone',
        data=json.dumps(request_data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    # Assert the response status code and data
    assert response.status_code == HTTPStatus.OK
    assert response.get_json().get('form_json') == survey.form_json


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_survey_unlink(client, jwt, session, side_effect, expected_status,
                       setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a survey can be unlinked from an engagement."""
    user, claims = setup_admin_user_and_claims
    survey = factory_survey_model()
    survey_id = survey.id
    headers = factory_auth_header(jwt=jwt, claims=claims)

    eng = factory_engagement_model(TestEngagementInfo.engagement_draft)
    eng_id = eng.id

    # assert eng id is none in GET Survey
    rv = client.get(
        f'{surveys_url}{survey_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.json.get('engagement_id') is None

    # link them together
    rv = client.put(
        f'{surveys_url}{survey_id}/link/engagement/{eng_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK

    rv = client.get(
        f'{surveys_url}{survey_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.json.get('engagement_id') == str(eng_id)

    # unlink the survey
    rv = client.delete(
        f'{surveys_url}{survey_id}/unlink/engagement/{eng_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK

    rv = client.get(
        f'{surveys_url}{survey_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.json.get('engagement_id') is None

    with patch.object(SurveyService, 'unlink', side_effect=side_effect):
        rv = client.delete(
            f'{surveys_url}{survey_id}/unlink/engagement/{eng_id}',
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == expected_status


def test_delete_survey(client, jwt, session, mocker,
                       setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that the resource DELETE /api/surveys/<id>/delete returns 200 on success and maps errors correctly."""
    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    survey = factory_survey_model()
    survey_id = str(survey.id)

    mocker.patch('api.services.survey_service.SurveyService.delete', return_value=None)
    rv = client.delete(
        f'{surveys_url}{survey_id}/delete',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.get_json() == {'id': survey_id}

    mocker.patch('api.services.survey_service.SurveyService.delete', side_effect=KeyError('boom'))
    rv = client.delete(
        f'{surveys_url}{survey_id}/delete',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR

    mocker.patch('api.services.survey_service.SurveyService.delete', side_effect=ValueError('bad'))
    rv = client.delete(
        f'{surveys_url}{survey_id}/delete',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.BAD_REQUEST
