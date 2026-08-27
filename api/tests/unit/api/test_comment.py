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

"""Tests to verify the comment API end-point.

Test-Suite to ensure that the /Comment endpoint is working as expected.
"""
import json
from http import HTTPStatus
from unittest.mock import MagicMock, patch

from faker import Faker

from api.constants.membership_type import MembershipType
from api.constants.staff_note_type import StaffNoteType
from api.services.comment_service import CommentService
from api.utils import notification
from api.utils.enums import ContentType
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_auth_header, factory_comment_model, factory_membership_model, factory_participant_model,
    factory_staff_user_model, factory_submission_model, factory_survey_and_eng_model, set_global_tenant)


fake = Faker()


def test_get_comments(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that comments can be fetched."""
    claims = TestJwtClaims.public_user_role

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/comments/survey/{survey.id}', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    with patch.object(CommentService, 'get_comments_paginated', side_effect=ValueError('Test error')):
        rv = client.get(f'/api/comments/survey/{survey.id}', headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_review_comment(client, jwt, session,
                        setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a comment can be reviewed."""
    _, claims = setup_admin_user_and_claims

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    to_dict = {
        'status_id': 2,
    }
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put(f'/api/submissions/{submission.id}',
                    data=json.dumps(to_dict), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK


def test_review_comment_by_team_member(client, jwt, session,
                                       setup_team_member_and_claims):  # pylint:disable=unused-argument
    """Assert that a comment can be reviewed."""
    user, claims = setup_team_member_and_claims

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    factory_membership_model(user_id=user.id, engagement_id=eng.id, member_type=MembershipType.TEAM_MEMBER.name)
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    to_dict = {
        'status_id': 2,
    }
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put(f'/api/submissions/{submission.id}',
                    data=json.dumps(to_dict), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK.value

    # Trying to put an engagement which he is a not a team member of
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    to_dict = {
        'status_id': 2,
    }
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put(f'/api/submissions/{submission.id}',
                    data=json.dumps(to_dict), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.FORBIDDEN.value


def test_review_comment_by_reviewer(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that a comment can be reviewed."""
    claims = TestJwtClaims.reviewer_role

    user = factory_staff_user_model(TestJwtClaims.staff_admin_role.get('sub'))

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    factory_membership_model(user_id=user.id, engagement_id=eng.id, member_type=MembershipType.REVIEWER.name)
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    to_dict = {
        'status_id': 2,
    }
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put(f'/api/submissions/{submission.id}',
                    data=json.dumps(to_dict), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.FORBIDDEN.value


def test_review_comment_internal_note(client, jwt, session,
                                      setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a comment can be reviewed."""
    _, claims = setup_admin_user_and_claims

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    note = fake.paragraph()
    staff_note = {'note': note,
                  'note_type': StaffNoteType.Internal.name}
    to_dict = {
        'status_id': 2,
        'staff_note': [staff_note]
    }

    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.put(f'/api/submissions/{submission.id}',
                    data=json.dumps(to_dict), headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    staff_notes = rv.json.get('staff_note', None)
    assert len(staff_notes) == 1
    assert staff_notes[0].get('note_type') == StaffNoteType.Internal.name
    assert staff_notes[0].get('note') == note


def test_review_comment_review_note(client, jwt, session,
                                    setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a comment can be reviewed."""
    _, claims = setup_admin_user_and_claims
    set_global_tenant()
    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    note = fake.paragraph()
    staff_note = {'note': note,
                  'note_type': StaffNoteType.Review.name}
    to_dict = {
        'status_id': 3,
        'has_personal_info': True,
        'staff_note': [staff_note]
    }

    headers = factory_auth_header(jwt=jwt, claims=claims)
    with patch.object(notification, 'send_email', return_value=False) as mock_mail:
        rv = client.put(f'/api/submissions/{submission.id}',
                        data=json.dumps(to_dict), headers=headers, content_type=ContentType.JSON.value)
        assert rv.status_code == HTTPStatus.OK
        staff_notes = rv.json.get('staff_note', None)
        assert len(staff_notes) == 1
        assert staff_notes[0].get('note_type') == StaffNoteType.Review.name
        assert staff_notes[0].get('note') == note
        mock_mail.assert_called()


def test_get_comments_spreadsheet_staff(mocker, client, jwt, session,
                                        setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that staff comments sheet can be fetched."""
    user, claims = setup_admin_user_and_claims

    mock_post_generate_document_response = MagicMock()
    mock_post_generate_document_response.content = b'mock data'
    mock_post_generate_document_response.headers = {}
    mock_post_generate_document_response.status_code = 200
    mock_post_generate_document = mocker.patch(
        'api.services.cdogs_api_service.CdogsApiService._post_generate_document',
        return_value=mock_post_generate_document_response
    )
    mock_get_access_token = mocker.patch(
        'api.services.cdogs_api_service.CdogsApiService._get_access_token',
        return_value='token'
    )

    mock_upload_template_response = MagicMock()
    mock_upload_template_response.headers = {
        'X-Template-Hash': 'hash_code'
    }
    mock_upload_template_response.status_code = 200
    mock_post_upload_template = mocker.patch(
        'api.services.cdogs_api_service.CdogsApiService._post_upload_template',
        return_value=mock_upload_template_response
    )

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/comments/survey/{survey.id}/sheet/staff',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    mock_post_generate_document.assert_called()
    mock_get_access_token.assert_called()
    mock_post_upload_template.assert_called()

    with patch.object(CommentService, 'export_comments_to_spread_sheet_staff',
                      side_effect=ValueError('Test error')):
        rv = client.get(f'/api/comments/survey/{survey.id}/sheet/staff',
                        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_get_comments_spreadsheet_proponent(mocker, client, jwt, session,
                                            setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that proponent comments sheet can be fetched."""
    user, claims = setup_admin_user_and_claims

    mock_post_generate_document_response = MagicMock()
    mock_post_generate_document_response.content = b'mock data'
    mock_post_generate_document_response.headers = {}
    mock_post_generate_document_response.status_code = 200
    mock_post_generate_document = mocker.patch(
        'api.services.cdogs_api_service.CdogsApiService._post_generate_document',
        return_value=mock_post_generate_document_response
    )
    mock_get_access_token = mocker.patch(
        'api.services.cdogs_api_service.CdogsApiService._get_access_token',
        return_value='token'
    )

    mock_upload_template_response = MagicMock()
    mock_upload_template_response.headers = {
        'X-Template-Hash': 'hash_code'
    }
    mock_upload_template_response.status_code = 200
    mock_post_upload_template = mocker.patch(
        'api.services.cdogs_api_service.CdogsApiService._post_upload_template',
        return_value=mock_upload_template_response
    )

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/comments/survey/{survey.id}/sheet/proponent',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    mock_post_generate_document.assert_called()
    mock_get_access_token.assert_called()
    mock_post_upload_template.assert_called()

    with patch.object(CommentService, 'export_comments_to_spread_sheet_proponent',
                      side_effect=ValueError('Test error')):
        rv = client.get(f'/api/comments/survey/{survey.id}/sheet/proponent',
                        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_get_comments_spreadsheet_without_role(mocker, client, jwt, session):  # pylint:disable=unused-argument
    """Assert that proponent comments sheet can be fetched."""
    mock_post_generate_document_response = MagicMock()
    mock_post_generate_document_response.content = b'mock data'
    mock_post_generate_document_response.headers = {}
    mock_post_generate_document_response.status_code = 200

    mock_upload_template_response = MagicMock()
    mock_upload_template_response.headers = {
        'X-Template-Hash': 'hash_code'
    }
    mock_upload_template_response.status_code = 200

    participant = factory_participant_model()
    survey, eng = factory_survey_and_eng_model()
    submission = factory_submission_model(survey.id, eng.id, participant.id)
    factory_comment_model(survey.id, submission.id)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.public_user_role)
    rv = client.get(f'/api/comments/survey/{survey.id}/sheet/staff',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.UNAUTHORIZED, \
        'User without role should not be able to access staff comments sheet'
