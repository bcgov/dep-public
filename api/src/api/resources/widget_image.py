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
"""API endpoints for managing a image widget resource."""
from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource, fields

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.schemas.widget_image import WidgetImageSchema
from api.services.widget_image_service import WidgetImageService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('widget_images',
                description='Endpoints for Image Widget Management')

# Do not allow updating the widget_id or engagement_id via API calls

image_creation_model = API.model(
    'ImageCreation',
    {
        'image_url': fields.String(description='The URL of the image', required=True),
        'alt_text': fields.String(description='The alt text for the image'),
        'description': fields.String(description='The description of the image'),
    },
)

image_update_model = API.model(
    'ImageUpdate',
    {
        'image_url': fields.String(description='The URL of the image'),
        'alt_text': fields.String(description='The alt text for the image'),
        'description': fields.String(description='The description of the image'),
    },
)


@cors_preflight('GET, POST, PATCH, OPTIONS')
@API.route('')
class Images(Resource):
    """Resource for managing image widgets."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(widget_id):
        """Get image widget."""
        try:
            widget_image = WidgetImageService().get_image(widget_id)
            return (
                WidgetImageSchema().dump(widget_image, many=True),
                HTTPStatus.OK,
            )
        except BusinessException as err:
            return str(err), err.status_code

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @API.expect(image_creation_model, validate=True)
    def post(widget_id):
        """Create image widget."""
        try:
            request_json = request.get_json()
            widget_image = WidgetImageService().create_image(widget_id, request_json)
            return WidgetImageSchema().dump(widget_image), HTTPStatus.OK
        except BusinessException as err:
            return str(err), err.status_code


@cors_preflight('PATCH')
@API.route('/<int:image_widget_id>')
class Image(Resource):
    """Resource for managing specific image widget instances by ID."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    @API.expect(image_update_model, validate=True)
    def patch(widget_id, image_widget_id):
        """Update image widget."""
        request_json = request.get_json()
        try:
            WidgetImageSchema(partial=True).load(request_json)
            widget_image = WidgetImageService().update_image(
                widget_id, image_widget_id, request_json
            )
            return WidgetImageSchema().dump(widget_image), HTTPStatus.OK
        except BusinessException as err:
            return str(err), err.status_code
