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

"""Tests to verify the Submission API end-point.

Test-Suite to ensure that the /Submission endpoint is working as expected.
"""
import copy
import json
from http import HTTPStatus

from unittest.mock import patch
import pytest
from faker import Faker

from api.constants.comment_status import Status
from api.constants.email_verification import EmailVerificationType
from api.constants.membership_type import MembershipType
from api.services.submission_service import SubmissionService
from api.utils.enums import CompositeRoleId, ContentType
from tests.utilities.factory_scenarios import TestJwtClaims, TestSubmissionInfo
from tests.utilities.factory_utils import (
    factory_auth_header, factory_comment_model, factory_email_verification, factory_engagement_setting_model,
    factory_membership_model, factory_participant_model, factory_staff_user_model, factory_submission_model,
    factory_survey_and_eng_model, factory_user_group_membership_model)


DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
fake = Faker()


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_valid_submission(client, jwt, session, side_effect, expected_status):  # pylint:disable=unused-argument
    """Assert that an engagement can be POSTed."""
    claims = TestJwtClaims.public_user_role

    survey, eng = factory_survey_and_eng_model()
    factory_engagement_setting_model(eng.id)
    email_verification = factory_email_verification(survey.id)
    to_dict = {
        'survey_id': survey.id,
        'submission_json': {'simplepostalcode': 'abc'},
        'verification_token': email_verification.verification_token
    }
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post(f'/api/submissions/public/{email_verification.verification_token}', data=json.dumps(to_dict),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    with patch.object(SubmissionService, 'create', side_effect=side_effect):
        rv = client.post(f'/api/submissions/public/{email_verification.verification_token}',
                         data=json.dumps(to_dict),
                         headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status


def test_edit_rejected_submission(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that an engagement can updated after rejection."""
    claims = TestJwtClaims.public_user_role

    survey, eng = factory_survey_and_eng_model()
    email_verification = factory_email_verification(survey.id)
    participant = factory_participant_model()
    factory_engagement_setting_model(eng.id)
    submission_request = {
        'submission_json': {'test_question': 'test answer'},
        'engagement_id': eng.id,
        'survey_id': survey.id,
        'participant_id': participant.id,
        'verification_token': email_verification.verification_token,
    }
    submission = factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.rejected_submission)
    email_verification = factory_email_verification(
        survey.id, type=EmailVerificationType.RejectedComment, submission_id=submission.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put(f'/api/submissions/public/{email_verification.verification_token}',
                    data=json.dumps(submission_request),
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    # roll back any pending changes to make sure the session is clean
    # the changes should still be committed because the submission was updated
    session.rollback()
    assert submission.comment_status_id == Status.Pending.value


@pytest.mark.parametrize('submission_info', [TestSubmissionInfo.submission1])
def test_get_submission_by_id(client, jwt, session, submission_info,
                              setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement can be fetched."""
    user, claims = setup_admin_user_and_claims

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(
        survey.id, eng.id, participant.id, submission_info)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/{submission.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('submission_json', None) is None


@pytest.mark.parametrize('submission_info', [TestSubmissionInfo.submission1])
def test_get_submission_page(client, jwt, session, submission_info,
                             setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that an engagement page can be fetched."""
    user, claims = setup_admin_user_and_claims

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(
        survey.id, eng.id, participant.id, submission_info)
    factory_comment_model(survey.id, submission.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/survey/{survey.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('items', [])[0].get('submission_json', None) is None


def test_get_comment_filtering(client, jwt, session,
                               setup_admin_user_and_claims,
                               setup_reviewer_and_claims):  # pylint:disable=unused-argument
    """Assert comments filtering works for different users."""
    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission_info = TestSubmissionInfo.submission1
    submission = factory_submission_model(
        survey.id, eng.id, participant.id, submission_info)
    factory_comment_model(survey.id, submission.id)
    claims = TestJwtClaims.public_user_role
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/survey/{survey.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert len(rv.json.get('items')
               ) == 0, 'Public user cant see unapproved comments'

    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/survey/{survey.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('items', [])[0].get('submission_json', None) is None
    assert len(rv.json.get('items')
               ) == 1, 'Admin user can see unapproved comments'

    # add new approved comment
    claims = TestJwtClaims.public_user_role
    submission_approved = factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.approved_submission)
    factory_comment_model(survey.id, submission_approved.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/survey/{survey.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert len(rv.json.get('items')
               ) == 1, 'Public user can see approved comments'

    user, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/survey/{survey.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert len(rv.json.get('items')
               ) == 2, 'Admin user can see approved and unapproved comments'

    # create membership for the reviewer user and see
    user = factory_staff_user_model()
    factory_membership_model(
        user_id=user.id, engagement_id=eng.id, member_type=MembershipType.REVIEWER.name)
    user, claims = setup_reviewer_and_claims
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/survey/{survey.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert len(rv.json.get(
        'items')) == 1, 'Reviewer with reviewer team membership can see only approved comments'

    # create membership for the team member and see
    user = factory_staff_user_model()
    factory_membership_model(
        user_id=user.id, engagement_id=eng.id, member_type=MembershipType.TEAM_MEMBER.name)
    factory_user_group_membership_model(str(user.external_id), group_id=CompositeRoleId.TEAM_MEMBER.value)
    claims = copy.deepcopy(TestJwtClaims.team_member_role.value)
    claims['sub'] = str(user.external_id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/submissions/survey/{survey.id}',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert len(rv.json.get(
        'items')) == 2, 'Team Member with team membership can see approved and unapproved comments'


def test_invalid_submission(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that an engagement can be POSTed."""
    claims = TestJwtClaims.public_user_role

    survey, _ = factory_survey_and_eng_model()
    email_verification = factory_email_verification(survey.id)
    to_dict = {
        'blah': str(survey.id),
        'submission_json': {'simplepostalcode': 'abc'},
        'verification_token': email_verification.verification_token
    }
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post(f'/api/submissions/public/{email_verification.verification_token}', data=json.dumps(to_dict),
                     headers=headers, content_type=ContentType.JSON.value)

    assert rv.status == '400 BAD REQUEST'

    to_dict = {
    }
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.post('/api/submissions/public/123', data=json.dumps(to_dict),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status == '400 BAD REQUEST'


@pytest.mark.parametrize('submission_info', [TestSubmissionInfo.approved_submission])
def test_advanced_search_submission(client, jwt, session, submission_info):  # pylint:disable=unused-argument
    """Assert that an engagement page can be fetched."""
    claims = TestJwtClaims.public_user_role

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission_approved = factory_submission_model(
        survey.id, eng.id, participant.id, submission_info)
    factory_comment_model(survey.id, submission_approved.id)
    submission_rejected = factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.rejected_submission)
    factory_comment_model(survey.id, submission_rejected.id)
    submission_pending = factory_submission_model(
        survey.id, eng.id, participant.id, TestSubmissionInfo.pending_submission)
    factory_comment_model(survey.id, submission_pending.id)

    params = {
        'status': submission_approved.comment_status_id,
        'reviewer': submission_approved.reviewed_by,
        'comment_date_to': submission_approved.created_date,
        'comment_date_from': submission_approved.created_date,
        'review_date_to': submission_approved.review_date,
        'review_date_from': submission_approved.review_date,
    }

    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(
        f'/api/submissions/survey/{survey.id}',
        headers=headers,
        content_type=ContentType.JSON.value,
        query_string=params
    )

    assert rv.status_code == HTTPStatus.OK
    assert len(rv.json.get('items', [])) == 1

    fetched_submission = rv.json.get('items')[0]
    assert fetched_submission.get(
        'comment_status_id') == submission_approved.comment_status_id
    assert fetched_submission.get(
        'reviewed_by') == submission_approved.reviewed_by
    assert fetched_submission.get(
        'created_date') == submission_approved.created_date.strftime(DATE_FORMAT)
    assert fetched_submission.get(
        'review_date') == submission_approved.review_date.strftime(DATE_FORMAT)
