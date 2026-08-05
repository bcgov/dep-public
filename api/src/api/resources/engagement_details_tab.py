
# Copyright © 2025 Province of British Columbia
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
"""API endpoints for managing engagement details tabs."""

from http import HTTPStatus

from flask import g, jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.resources.lock_validation_decorators import (
    lock_error_message, lock_error_status_failure, require_engagement_section_lock)
from api.schemas import utils as schema_utils
from api.services.engagement_details_tab_service import EngagementDetailsTabService
from api.services.resource_lock_service import ResourceLockService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('engagement_details_tabs',
                description='Endpoints for Engagement Details Tabs')


@cors_preflight('GET, POST, PUT, OPTIONS')
@API.route('')  # /api/engagement/<int:engagement_id>/details
class EngagementDetailsTabsResource(Resource):
    """Resource for managing engagement details tabs."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(engagement_id):
        """Fetch all details tabs for a given engagement."""
        try:
            tabs = EngagementDetailsTabService().get_tabs_by_engagement_id(engagement_id)
            return jsonify(tabs), HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return {'message': str(err)}, HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @require_engagement_section_lock(
        section_key=ResourceLockService.SECTION_AUTHORING_DETAILS,
        error_builder=lock_error_message,
    )
    def post(engagement_id):
        """Create new details tabs for an engagement (single or bulk)."""
        try:
            request_json = request.get_json()
            valid_format, errors = schema_utils.validate(
                request_json, 'engagement_details_tab')
            if not valid_format:
                return {'message': schema_utils.serialize(errors)}, HTTPStatus.BAD_REQUEST

            created_tabs = EngagementDetailsTabService(
            ).create_tabs(engagement_id, request_json)
            return jsonify(created_tabs), HTTPStatus.CREATED
        except BusinessException as err:
            return {'message': err.error}, err.status_code
        except ValidationError as err:
            return {'message': err.messages}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @require_engagement_section_lock(
        section_key=ResourceLockService.SECTION_AUTHORING_DETAILS,
        error_builder=lock_error_status_failure,
    )
    def put(engagement_id):
        """Bulk update details tabs for an engagement (sync create/update/delete)."""
        try:
            request_json = request.get_json()
            EngagementDetailsTabService().sync_tabs(
                engagement_id, request_json, user_id=g.lock_validation_user_id)
            return {'status': 'success'}, HTTPStatus.OK
        except BusinessException as err:
            return {'status': 'failure', 'message': err.error}, err.status_code
        except ValidationError as err:
            return {'status': 'failure', 'message': err.messages}, HTTPStatus.BAD_REQUEST
