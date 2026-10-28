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
"""
API endpoints for managing the metadata for an engagement resource.

This API is located at /api/engagements/<engagement_id>/metadata
"""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource, fields
from marshmallow import ValidationError
from api.auth import auth_methods
from api.auth import jwt as _jwt
from api.constants.membership_type import MembershipType
from api.services import authorization
from api.services.engagement_service import EngagementService
from api.services.engagement_metadata_service import EngagementMetadataService
from api.utils.roles import Role
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('engagement_metadata',
                path='/engagements/<engagement_id>/metadata',
                description='Endpoints for Engagement Metadata Management',
                authorizations=auth_methods)

metadata_update_model = API.model('EngagementMetadataUpdate', model_dict := {
    'value': fields.String(required=True, description='The value of the metadata entry'),
})

metadata_bulk_value_model = API.model('EngagementMetadataValue', {
    'id': fields.Integer(required=False, description='The id of the metadata entry'),
    'value': fields.String(required=True, description='The value of the metadata entry'),
    'position': fields.Integer(required=False, description='The position of the metadata entry'),
})

metadata_bulk_update_model = API.model('EngagementMetadataBulkUpdate', {
    'taxon_id': fields.Integer(required=True, description='The id of the taxon'),
    'values': fields.List(
        fields.Nested(metadata_bulk_value_model),
        required=True,
        description='The values to save to the taxon',
    ),
})

metadata_create_model = API.model('EngagementMetadataCreate', model_dict := {
    'taxon_id': fields.Integer(required=True, description='The id of the taxon'),
    **model_dict
})

metadata_return_model = API.model('EngagementMetadataReturn', {
    'id': fields.Integer(required=True, description='The id of the metadata entry'),
    'engagement_id': fields.Integer(required=True, description='The id of the engagement'),
    **model_dict
})

engagement_service = EngagementService()
metadata_service = EngagementMetadataService()


@cors_preflight('GET,POST,PATCH')
@API.route('')  # /api/engagements/{engagement.id}/metadata
@API.doc(params={'engagement_id': 'The numeric id of the engagement'})
class EngagementMetadata(Resource):
    """Resource for managing engagements' metadata."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.marshal_list_with(metadata_return_model)
    def get(engagement_id):
        """Fetch engagement metadata entries by engagement id."""
        return metadata_service.get_by_engagement(engagement_id)

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.doc(security='apikey')
    @API.expect(metadata_create_model)
    @API.marshal_with(metadata_return_model, code=HTTPStatus.CREATED)  # type: ignore
    @_jwt.requires_auth
    def post(engagement_id: int):
        """Create a new metadata entry for an engagement."""
        authorization.check_auth(
            one_of_roles=(
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value
            ),
            engagement_id=engagement_id
        )
        request_json = request.get_json(force=True)
        try:
            engagement_metadata = metadata_service.create(
                engagement_id, request_json['taxon_id'], request_json['value']
            )
            return engagement_metadata, HTTPStatus.CREATED
        except KeyError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except (ValueError, ValidationError) as err:
            return str(err), HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.doc(security='apikey')
    @API.expect(metadata_bulk_update_model, validate=True)
    @API.marshal_list_with(metadata_return_model)
    @_jwt.requires_auth
    def patch(engagement_id):
        """Update the values of existing metadata entries for an engagement."""
        authorization.check_auth(
            one_of_roles=(
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value
            ),
            engagement_id=engagement_id
        )
        data = request.get_json(force=True)
        taxon_id = data['taxon_id']
        updated_values = data['values']
        result = metadata_service.update_by_taxon(
            engagement_id, taxon_id, updated_values
        )
        return result, HTTPStatus.OK


@cors_preflight('GET,PUT,DELETE')
@API.route('/<metadata_id>')  # /metadata/{metadata.id}
@API.doc(params={'engagement_id': 'The numeric id of the engagement',
                 'metadata_id': 'The numeric id of the metadata entry'})
@API.doc(security='apikey')
class EngagementMetadataById(Resource):
    """Resource for managing invividual engagement metadata entries."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def get(engagement_id, metadata_id):
        """Fetch an engagement metadata entry by id."""
        authorization.check_auth(
            one_of_roles=(
                MembershipType.TEAM_MEMBER.name,
                Role.VIEW_ENGAGEMENT.value
            ),
            engagement_id=engagement_id
        )
        try:
            metadata = metadata_service.get(metadata_id)
            if str(metadata['engagement_id']) != str(engagement_id):
                raise ValidationError('Metadata does not belong to this '
                                      f"engagement:{metadata['engagement_id']}"
                                      f' != {engagement_id}')
            return metadata, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return err.messages, HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.expect(metadata_update_model)
    @_jwt.requires_auth
    def patch(engagement_id, metadata_id):
        """Update the values of an existing metadata entry for an engagement."""
        authorization.check_auth(
            one_of_roles=(
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value
            ),
            engagement_id=engagement_id
        )
        request_json = request.get_json(force=True)
        try:
            value = request_json.get('value')
            if not value:
                raise ValidationError('Value is required')
            metadata = metadata_service.get(metadata_id)
            if str(metadata['engagement_id']) != str(engagement_id):
                raise ValidationError('Metadata does not belong to this '
                                      f"engagement:{metadata['engagement_id']}"
                                      f' != {engagement_id}')
            metadata = metadata_service.update(metadata_id, value)
            return metadata, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return err.messages, HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def delete(engagement_id, metadata_id):
        """Delete an existing metadata entry for an engagement."""
        try:
            authorization.check_auth(
                one_of_roles=(
                    MembershipType.TEAM_MEMBER.name,
                    Role.EDIT_ENGAGEMENT.value
                ),
                engagement_id=engagement_id
            )
            metadata = metadata_service.get(metadata_id)
            if str(metadata['engagement_id']) != str(engagement_id):
                raise ValidationError('Metadata does not belong to this '
                                      f"engagement:{metadata['engagement_id']}"
                                      f' != {engagement_id}')
            metadata_service.delete(metadata_id)
            return {}, HTTPStatus.NO_CONTENT
        except KeyError as err:
            return str(err), HTTPStatus.NOT_FOUND
