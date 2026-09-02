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
"""Tests for the report settings service.

Test suite to ensure that the Survey report settings service routines are working as expected.
"""
from api.services.report_setting_service import ReportSettingService
from tests.utilities.factory_scenarios import TestSurveyInfo
from tests.utilities.factory_utils import factory_survey_and_eng_model


def test_refresh_report_setting(session):  # pylint:disable=unused-argument
    """Assert report settings are refreshed."""
    survey, _ = factory_survey_and_eng_model(TestSurveyInfo.survey3)
    result = ReportSettingService.refresh_report_setting(survey.id, survey.form_json.get('components'))
    assert result == survey.form_json.get('components')

    report_settings = ReportSettingService.get_report_setting(survey.id)
    assert len(report_settings) == 1
    assert report_settings[0].get('survey_id') == survey.id
