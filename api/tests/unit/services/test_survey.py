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
"""Tests for the Survey service.

Test suite to ensure that the Survey service routines are working as expected.
"""

from types import SimpleNamespace

import pytest
import sqlalchemy

from api.constants.engagement_status import Status
from api.models import Survey as SurveyModel
from api.models import db
from api.services import authorization
from api.services.survey_service import SurveyService
from tests.utilities.factory_scenarios import TestJwtClaims, TestSurveyInfo
from tests.utilities.factory_utils import (
    factory_engagement_model, factory_staff_user_model, factory_survey_model, factory_user_group_membership_model,
    patch_token_info, set_global_tenant)


def test_create_survey(session, monkeypatch,):  # pylint:disable=unused-argument
    """Assert that a survey can be created."""
    survey_data = {
        'name': TestSurveyInfo.survey1.get('name'),
        'display': TestSurveyInfo.survey1.get('form_json').get('display'),
    }
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    saved_survey = SurveyService().create(survey_data)
    # fetch the survey with id and assert
    fetched_survey = SurveyService().get(saved_survey.id)
    assert fetched_survey.get('id') == saved_survey.id
    assert fetched_survey.get('name') == survey_data.get('name')


def _link_and_commit(survey, engagement):
    """Link a survey to an engagement and commit."""
    survey.engagement_id = engagement.id
    db.session.add_all([engagement, survey])
    db.session.commit()


def test_delete_success_without_translation(session, mocker):
    """Deleting a survey with no translations still deletes the survey."""
    eng = factory_engagement_model(status=Status.Draft.value)
    survey = factory_survey_model()
    _link_and_commit(survey, eng)
    sid = survey.id

    mocker.patch.object(authorization, 'check_auth', return_value=True)

    get_list = mocker.patch(
        'api.models.survey_translation.SurveyTranslation.get_survey_translation_list_by_survey_id',
        return_value=[],
    )
    del_tx = mocker.patch(
        'api.models.survey_translation.SurveyTranslation.delete_survey_translation',
        return_value=None,
    )

    result = SurveyService.delete(sid)

    get_list.assert_called_once_with(sid)
    del_tx.assert_not_called()
    assert SurveyModel.find_by_id(sid) is None
    assert isinstance(result, dict) and result.get('id') == sid


def test_delete_translation_valueerror_is_propagated(session, mocker):
    """If any translation delete raises ValueError, the service re-raises ValueError."""
    eng = factory_engagement_model(status=Status.Draft.value)
    survey = factory_survey_model()
    _link_and_commit(survey, eng)
    sid = survey.id

    mocker.patch.object(authorization, 'check_auth', return_value=True)

    mocker.patch(
        'api.models.survey_translation.SurveyTranslation.get_survey_translation_list_by_survey_id',
        return_value=[SimpleNamespace(id=456)],
    )
    mocker.patch(
        'api.models.survey_translation.SurveyTranslation.delete_survey_translation',
        side_effect=ValueError('boom'),
    )

    with pytest.raises(ValueError) as excinfo:
        SurveyService.delete(sid)

    assert 'boom' in str(excinfo.value)
    assert SurveyModel.find_by_id(sid) is not None


def test_delete_translation_sqlaerror_maps_to_runtimeerror(session, mocker):
    """If any translation delete raises SQLAlchemyError, service raises RuntimeError."""
    eng = factory_engagement_model(status=Status.Draft.value)
    survey = factory_survey_model()
    _link_and_commit(survey, eng)
    sid = survey.id

    mocker.patch.object(authorization, 'check_auth', return_value=True)

    mocker.patch(
        'api.models.survey_translation.SurveyTranslation.get_survey_translation_list_by_survey_id',
        return_value=[SimpleNamespace(id=789)],
    )
    mocker.patch(
        'api.models.survey_translation.SurveyTranslation.delete_survey_translation',
        side_effect=sqlalchemy.exc.SQLAlchemyError('db-fail'),
    )

    with pytest.raises(RuntimeError) as excinfo:
        SurveyService.delete(sid)

    assert 'Database error while deleting survey' in str(excinfo.value)
    assert SurveyModel.find_by_id(sid) is not None
