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
"""Tests for the Submission service.

Test suite to ensure that the Submission service routines are working as expected.
"""
from typing import List
from unittest.mock import patch

from api.constants.comment_status import Status
from api.constants.email_verification import EmailVerificationType
from api.models.comment import Comment
from api.schemas.comment import CommentSchema
from api.schemas.submission import SubmissionSchema
from api.services import authorization
from api.services.comment_service import CommentService
from api.services.email_verification_service import EmailVerificationService
from api.services.submission_service import SubmissionService
from tests.utilities.factory_scenarios import TestSurveyInfo
from tests.utilities.factory_utils import (
    factory_comment_model, factory_email_verification, factory_engagement_setting_model, factory_participant_model,
    factory_staff_user_model, factory_submission_model, factory_survey_and_eng_model)


def test_create_submission(session):  # pylint:disable=unused-argument
    """Assert that a submission can be Created."""
    survey, eng = factory_survey_and_eng_model()
    email_verification = factory_email_verification(survey.id)
    participant = factory_participant_model()
    factory_engagement_setting_model(eng.id)
    submission_request: SubmissionSchema = {
        'submission_json': {'test_question': 'test answer'},
        'survey_id': survey.id,
        'participant_id': participant.id,
        'verification_token': email_verification.verification_token,
    }
    submission = SubmissionService().create(
        email_verification.verification_token, submission_request)
    actual_email_verification = EmailVerificationService().get(
        email_verification.verification_token)

    assert submission is not None
    assert actual_email_verification['is_active'] is False


def test_update_submission(session):  # pylint:disable=unused-argument
    """Assert that a submission can be updated using update_comments."""
    survey, eng = factory_survey_and_eng_model()
    staff_user = factory_staff_user_model(3)
    email_verification = factory_email_verification(survey.id)
    participant = factory_participant_model()
    factory_engagement_setting_model(eng.id)
    submission_request: SubmissionSchema = {
        'submission_json': {'test_question': 'test answer'},
        'engagement_id': eng.id,
        'survey_id': survey.id,
        'participant_id': participant.id,
        'verification_token': email_verification.verification_token,
    }
    submission = SubmissionService().create(
        email_verification.verification_token, submission_request)
    # reject the commnent
    staff_review_details = {
        'status_id': Status.Rejected.value,
        'has_personal_info': True,  # the reason for rejection
        'notify_email': False,
    }
    with patch.object(authorization, 'check_auth', return_value=True):
        submission_record = SubmissionService().review_comment(
            submission.id, staff_review_details, staff_user.external_id)
        assert submission_record.get(
            'comment_status_id') == Status.Rejected.value
    assert submission.comment_status_id == Status.Rejected.value
    comment: CommentSchema = CommentSchema().dump(
        factory_comment_model(survey.id, submission.id))
    email_verification = factory_email_verification(
        survey.id, type=EmailVerificationType.RejectedComment, submission_id=submission.id)
    updated_submission: List[Comment] = SubmissionService().update_comments(
        email_verification.verification_token, {'comments': [comment]})
    # Roll back any changes still in the transaction to make sure data was
    # committed by the service
    session.rollback()
    assert updated_submission[0].text == comment['text']
    assert submission.comment_status_id == Status.Pending.value


def test_create_submission_rollback(session):  # pylint:disable=unused-argument
    """Assert that a submission failure will rollback changes to email verification."""
    survey, _ = factory_survey_and_eng_model()
    email_verification = factory_email_verification(survey.id)
    participant = factory_participant_model()

    submission_request: SubmissionSchema = {
        'submission_json': '{ "test_question": "test answer"}',
        'survey_id': survey.id,
        'participant_id': participant.id,
        'verification_token': email_verification.verification_token,
    }

    with patch.object(CommentService, 'extract_comments_from_survey', side_effect=ValueError) as mock:
        try:
            SubmissionService().create(email_verification.verification_token, submission_request)
        except ValueError:
            mock.assert_called()
        actual_email_verification = EmailVerificationService().get(
            email_verification.verification_token)
        assert actual_email_verification['is_active'] is True


def test_review_comment(client, jwt, session, monkeypatch):  # pylint:disable=unused-argument
    """Assert that a comment can be reviewed."""
    with patch.object(authorization, 'check_auth', return_value=True):
        admin_user = factory_staff_user_model(3)
        participant = factory_participant_model()
        survey, eng = factory_survey_and_eng_model()
        submission = factory_submission_model(
            survey.id, eng.id, participant.id)
        factory_comment_model(survey.id, submission.id)
        reasons = {
            'status_id': 2,
        }
        submission_record = SubmissionService().review_comment(
            submission.id, reasons, admin_user.external_id)
        assert submission_record.get('comment_status_id') == 2


def test_auto_approval_of_submissions_without_comment(session):  # pylint:disable=unused-argument
    """Assert that a submission without comment is auto approved."""
    survey, eng = factory_survey_and_eng_model({**TestSurveyInfo.survey1, 'form_json': {
        'components': [
            {
                'id': 'approval-choice',
                'type': 'simplecheckboxes',
                'key': 'approvalchoice',
                'label': 'Approval Choice'
            }
        ]
    }})
    email_verification = factory_email_verification(survey.id)
    participant = factory_participant_model()
    factory_engagement_setting_model(eng.id)
    submission_request: SubmissionSchema = {
        'submission_json': {'simplepostalcode': 'abc', 'approvalchoice': []},
        'survey_id': survey.id,
        'participant_id': participant.id,
        'verification_token': email_verification.verification_token,
    }
    submission = SubmissionService().create(
        email_verification.verification_token, submission_request)

    assert submission is not None
    assert submission.comment_status_id == Status.Approved.value


def test_submissions_with_comment_are_not_auto_approved(session):  # pylint:disable=unused-argument
    """Assert that a submission with comment is not auto approved."""
    survey, eng = factory_survey_and_eng_model({**TestSurveyInfo.survey1, 'form_json': {
        'components': [
            {
                'type': 'textfield',
                'key': 'simpletextfield',
                'inputType': 'text',
                'label': 'Simple Text Field'
            },
            {
                'type': 'textarea',
                'key': 'simpletextarea',
                'label': 'Simple Text Area'
            },
            {
                'type': 'textarea',
                'key': 'simpletextarea1',
                'label': 'Simple Text Area 1'
            }
        ]
    }})
    email_verification = factory_email_verification(survey.id)
    participant = factory_participant_model()
    factory_engagement_setting_model(eng.id)
    submission_request: SubmissionSchema = {
        'submission_json': {'simplepostalcode': 'abc', 'simpletextarea': 'Test Comment',
                            'simpletextarea1': 'Test Comment 2'},
        'survey_id': survey.id,
        'participant_id': participant.id,
        'verification_token': email_verification.verification_token,
    }
    submission = SubmissionService().create(
        email_verification.verification_token, submission_request)

    assert submission is not None
    assert submission.comment_status_id == Status.Pending.value


def test_check_if_submission_can_handle_multiple_comments(session):
    """Assert that submissions can handle multiple comments."""
    survey, eng = factory_survey_and_eng_model()
    email_verification = factory_email_verification(survey.id)
    participant = factory_participant_model()
    factory_engagement_setting_model(eng.id)
    # Create a sample submission with a comment in a text field that starts with 'simpletextarea'
    submission_request: SubmissionSchema = {
        'submission_json': {'simplepostalcode': 'abc', 'simpletextfield': 'This is some text',
                            'simpletextfield2': 'This is some text 2', 'simpletextarea2': 'This is a comment 1',
                            'simpletextarea1': 'This is a comment 1'},
        'survey_id': survey.id,
        'participant_id': participant.id,
        'verification_token': email_verification.verification_token,
    }

    submission = SubmissionService().create(
        email_verification.verification_token, submission_request)
    submission_json = submission.submission_json

    # Assert that the function returns True since there is a comment in a text field that starts with 'simpletextfield2'
    assert 'simpletextfield2' in submission_json.keys()
