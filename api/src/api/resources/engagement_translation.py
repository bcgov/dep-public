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
"""API endpoints for managing an engagement translation resource."""

from http import HTTPStatus

from flask import jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.schemas import utils as schema_utils
from api.schemas.engagement_translation import EngagementTranslationSchema
from api.services.engagement_translation_service import EngagementTranslationService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('engagement_translation', description='Endpoints for Engagement translation Management')


@cors_preflight('GET, OPTIONS')
@API.route('/language/<int:language_id>')
class EngagementTranslationResourceByLanguage(Resource):
    """Resource for managing a engagement translation."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(engagement_id, language_id):
        """Fetch a engagement by widget_id and language_id."""
        try:
            engagement = EngagementTranslationService().get_translation_by_engagement_and_language(
                engagement_id, language_id)
            return jsonify(engagement), HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('POST, OPTIONS')
@API.route('/')
class EngagementTranslations(Resource):
    """Resource for creating a engagement translation."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def post(engagement_id):
        """Add new engagement translation."""
        try:
            request_json = request.get_json()
            request_json['engagement_id'] = engagement_id
            valid_format, errors = schema_utils.validate(request_json, 'engagement_translation')
            if not valid_format:
                return {'message': schema_utils.serialize(errors)}, HTTPStatus.BAD_REQUEST

            pre_populate = request_json.get('pre_populate', True)

            engagement_translation = EngagementTranslationSchema().load(request_json)
            created_engagement_translation = EngagementTranslationService().create_engagement_translation(
                engagement_translation, pre_populate)
            return created_engagement_translation, HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST
        except BusinessException as err:
            return err.error, HTTPStatus.CONFLICT


@cors_preflight('GET, DELETE, PATCH, OPTIONS')
@API.route('/<int:engagement_translation_id>')
class EngagementTranslation(Resource):
    """Resource for managing engagement translations."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    # pylint: disable=unused-argument
    def get(engagement_id, engagement_translation_id):
        """Fetch a engagement translation by id."""
        try:
            engagement_translation = (
                EngagementTranslationService.get_engagement_translation_by_id(
                    engagement_translation_id
                )
            )
            return (
                EngagementTranslationSchema().dump(engagement_translation),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def delete(engagement_id, engagement_translation_id):
        """Remove engagement translation."""
        try:
            EngagementTranslationService().delete_engagement_translation(engagement_id,
                                                                         engagement_translation_id)
            return 'Engagement translation successfully removed', HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def patch(engagement_id, engagement_translation_id):
        """Update engagement translation."""
        try:
            request_json = request.get_json() or {}
            translation_data = EngagementTranslationSchema(partial=True).load(request_json)
            updated_engagement = EngagementTranslationService().update_engagement_translation(
                engagement_id, engagement_translation_id, translation_data)
            return updated_engagement, HTTPStatus.OK
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST


@cors_preflight('GET')
@API.route('/languages')
class EngagementTranslationsLanguages(Resource):
    """Get a list of languages that this engagement is translated into."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(engagement_id):
        """Get a list of all languages available for each of this engagement's translations."""
        try:
            available_translation_language = (
                EngagementTranslationService.get_available_engagement_translation_languages(
                    engagement_id
                )
            )
            return (
                jsonify(available_translation_language),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.BAD_REQUEST
