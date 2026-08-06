# Copyright © 2021 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""API endpoints for managing report setting resource."""

from http import HTTPStatus

from flask import jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.auth import auth
from api.auth import jwt as _jwt
from api.resources.lock_validation_decorators import require_survey_section_lock
from api.services.report_setting_service import ReportSettingService
from api.services.resource_lock_service import ResourceLockService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('reportsettings', description='Endpoints for report setting management')
"""Custom exception messages
"""


@cors_preflight('GET, POST, PATCH, OPTIONS')
@API.route('')
class ReportSetting(Resource):
    """Resource for managing report setting."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.optional
    def get(survey_id):
        """Fetch report setting for the survey id provided."""
        try:
            report_setting = ReportSettingService().get_report_setting(survey_id)

            if report_setting:
                return jsonify(report_setting), HTTPStatus.OK

            return 'Report setting was not found', HTTPStatus.NO_CONTENT
        except KeyError:
            return 'Report setting was not found', HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @require_survey_section_lock(
        section_key=ResourceLockService.SECTION_SURVEY_REPORT_SETTINGS,
    )
    def patch(survey_id):
        """Update saved report setting partially."""
        try:
            new_report_settings = request.get_json()
            report_setting = ReportSettingService().update_report_setting(survey_id, new_report_settings)

            return jsonify(report_setting), HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValidationError as err:
            return str(err.messages), HTTPStatus.INTERNAL_SERVER_ERROR
