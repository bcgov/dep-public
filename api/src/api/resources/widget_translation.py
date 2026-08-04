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
"""API endpoints for managing an widget translation resource."""

from http import HTTPStatus

from flask import jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.resources.lock_validation_decorators import (
    require_widget_translation_lock, require_widget_translation_lock_by_id)
from api.schemas import utils as schema_utils
from api.schemas.widget_translation import WidgetTranslationSchema
from api.services.widget_translation_service import WidgetTranslationService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('widget_translation',
                description='Endpoints for Widget translation Management')


@cors_preflight('GET, OPTIONS')
@API.route('/language/<language_id>')
class WidgetTranslationResourceByLanguage(Resource):
    """Resource for managing a widget translation."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(widget_id, language_id):
        """Fetch a list of widgets by widget_id and language_id."""
        try:
            widgets = WidgetTranslationService().get_translation_by_widget_id_and_language_id(
                widget_id, language_id)
            return jsonify(widgets), HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('POST, OPTIONS')
@API.route('/')
class WidgetTranslations(Resource):
    """Resource for creating a widget translation."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @require_widget_translation_lock()
    def post(widget_id):
        """Add new widget translation."""
        try:
            request_json = request.get_json()
            request_json['widget_id'] = widget_id
            valid_format, errors = schema_utils.validate(
                request_json, 'widget_translation')
            if not valid_format:
                return {'message': schema_utils.serialize(errors)}, HTTPStatus.BAD_REQUEST

            pre_populate = request_json.get('pre_populate', True)
            translation = WidgetTranslationSchema().load(request_json)
            created_widget_translation = WidgetTranslationService().create_widget_translation(translation,
                                                                                              pre_populate)
            return created_widget_translation, HTTPStatus.OK
        except BusinessException as err:
            return err.error, err.status_code
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST


@cors_preflight('GET, DELETE, PATCH')
@API.route('/<int:widget_translation_id>')
class EditWidgetTranslation(Resource):
    """Resource for updating or deleting a widget translation."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @require_widget_translation_lock_by_id()
    def delete(widget_id, widget_translation_id):
        """Remove widget translation for a widget."""
        try:
            WidgetTranslationService().delete_widget_translation(
                widget_id, widget_translation_id)
            return 'Widget translation successfully removed', HTTPStatus.OK
        except BusinessException as err:
            return err.error, err.status_code
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @require_widget_translation_lock_by_id()
    def patch(widget_id, widget_translation_id):
        """Update widget translation."""
        try:
            translation_data = request.get_json()
            updated_widget = WidgetTranslationService().update_widget_translation(widget_id,
                                                                                  widget_translation_id,
                                                                                  translation_data)
            return updated_widget, HTTPStatus.OK
        except BusinessException as err:
            return err.error, err.status_code
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST
