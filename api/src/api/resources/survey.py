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
"""API endpoints for managing an survey resource."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from api.auth import auth
from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.models.pagination_options import PaginationOptions
from api.models.survey_search_options import SurveySearchOptions
from api.schemas.survey import SurveySchema
from api.services.survey_service import SurveyService
from api.utils.roles import Role
from api.utils.tenant_validator import require_role
from api.utils.token_info import TokenInfo
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('surveys', description='Endpoints for Survey Management')
"""Custom exception messages
"""


@cors_preflight('GET,OPTIONS')
@API.route('/<survey_id>')
class Survey(Resource):
    """Resource for managing a single survey."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.optional
    def get(survey_id):
        """Fetch a single survey matching the provided id."""
        try:
            user_id = TokenInfo.get_id()
            if user_id:
                survey_record = SurveyService().get(survey_id)
            else:
                survey_record = SurveyService().get_open(survey_id)
            if survey_record:
                return survey_record, HTTPStatus.OK

            return 'Survey was not found', HTTPStatus.INTERNAL_SERVER_ERROR
        except KeyError:
            return 'Survey was not found', HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET, POST, PUT, OPTIONS')
@API.route('/')
class Surveys(Resource):
    """Resource for managing surveys."""

    @staticmethod
    @_jwt.requires_auth
    @cross_origin(origins=allowedorigins())
    def get():
        """Fetch surveys."""
        try:
            args = request.args
            user_id = TokenInfo.get_id()
            pagination_options = PaginationOptions(
                page=args.get('page', None, int),
                size=args.get('size', None, int),
                sort_key=args.get('sort_key', 'survey.name', str),
                sort_order=args.get('sort_order', 'asc', str),
            )

            search_options = SurveySearchOptions(
                exclude_hidden=args.get('exclude_hidden', False, bool),
                exclude_template=args.get('exclude_template', False, bool),
                search_text=args.get('search_text', '', str),
                is_unlinked=args.get(
                    'is_unlinked', default=False, type=lambda v: v.lower() == 'true'),
                is_linked=args.get('is_linked', default=False,
                                   type=lambda v: v.lower() == 'true'),
                is_hidden=args.get('is_hidden', default=False,
                                   type=lambda v: v.lower() == 'true'),
                is_template=args.get(
                    'is_template', default=False, type=lambda v: v.lower() == 'true'),
                created_date_from=args.get(
                    'created_date_from', None, type=str),
                created_date_to=args.get('created_date_to', None, type=str),
                published_date_from=args.get(
                    'published_date_from', None, type=str),
                published_date_to=args.get(
                    'published_date_to', None, type=str),
            )

            survey_records = SurveyService()\
                .get_surveys_paginated(
                    user_id,
                    pagination_options,
                    search_options,
            )
            return survey_records, HTTPStatus.OK
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @require_role([Role.CREATE_SURVEY.value])
    @cross_origin(origins=allowedorigins())
    def post():
        """Create a new survey."""
        try:
            requestjson = request.get_json()
            result = SurveyService().create(requestjson)
            survey_schema = SurveySchema()
            return survey_schema.dump(result), HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def put():
        """Update a existing survey."""
        try:
            requestjson = request.get_json()
            survey_schema = SurveySchema().load(requestjson)
            user_id = TokenInfo.get_id()
            survey_schema['updated_by'] = user_id
            SurveyService().update(survey_schema)
            return survey_schema, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except BusinessException as err:
            return {'message': err.error}, err.status_code


@cors_preflight('PUT,OPTIONS')
@API.route('/<survey_id>/link/engagement/<engagement_id>')
class SurveyLink(Resource):
    """Resource for linking a single survey to an engagement."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def put(survey_id, engagement_id):
        """Update survey to be linked with engagement."""
        try:

            survey = SurveyService().link(survey_id, engagement_id)

            if survey:
                return 'Survey successfully linked', HTTPStatus.OK

            return 'Error occurred while linking survey to engagement', HTTPStatus.INTERNAL_SERVER_ERROR
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('DELETE, OPTIONS')
@API.route('/<survey_id>/unlink/engagement/<engagement_id>')
class SurveyUnlink(Resource):
    """Resource for linking a single survey to an engagement."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def delete(survey_id, engagement_id):
        """Update survey to be unlinked to an engagement."""
        try:

            survey = SurveyService().unlink(survey_id, engagement_id)

            if survey:
                return 'Survey successfully unlinked', HTTPStatus.OK

            return 'Error occurred while unlinking survey from engagement', HTTPStatus.INTERNAL_SERVER_ERROR
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('POST, OPTIONS')
@API.route('/<survey_id>/clone')
class SurveysClone(Resource):
    """Resource for managing surveys."""

    @staticmethod
    @require_role([Role.CLONE_SURVEY.value])
    @cross_origin(origins=allowedorigins())
    def post(survey_id):
        """Clone a new survey."""
        try:
            requestjson = request.get_json()
            result = SurveyService().clone(requestjson, survey_id)
            survey_schema = SurveySchema()
            return survey_schema.dump(result), HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('DELETE, OPTIONS')
@API.route('/<survey_id>/delete')
class SurveyDelete(Resource):
    """Resource for deleting surveys."""

    @staticmethod
    @require_role([Role.EDIT_ALL_SURVEYS.value, Role.SUPER_ADMIN.value])
    @cross_origin(origins=allowedorigins())
    def delete(survey_id: int):
        """Delete a survey."""
        try:
            SurveyService.delete(survey_id)
            return {'id': survey_id}, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.BAD_REQUEST
