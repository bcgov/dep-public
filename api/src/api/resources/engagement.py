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
"""API endpoints for managing an engagement resource."""

import json
from http import HTTPStatus

from flask import current_app, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.auth import auth
from api.auth import jwt as _jwt
from api.models.pagination_options import PaginationOptions
from api.models.tenant import Tenant as TenantModel
from api.schemas.engagement import EngagementSchema
from api.services.engagement_service import EngagementService
from api.utils.roles import Role
from api.utils.tenant_validator import require_role
from api.utils.token_info import TokenInfo
from api.utils.util import allowedorigins, cors_preflight


API = Namespace(
    'engagements', description='Endpoints for Engagements Management')
"""Custom exception messages
"""

ENGAGEMENT_NOT_FOUND = 'Engagement was not found'


@cors_preflight('GET,OPTIONS')
@API.route('/<engagement_id>')
class Engagement(Resource):
    """Resource for managing a single engagement."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.optional
    def get(engagement_id):
        """Fetch a single engagement matching the provided id."""
        try:
            engagement_record = EngagementService().get_engagement(engagement_id)

            if engagement_record:
                return engagement_record, HTTPStatus.OK

            return ENGAGEMENT_NOT_FOUND, HTTPStatus.NOT_FOUND
        except KeyError:
            return ENGAGEMENT_NOT_FOUND, HTTPStatus.NOT_FOUND
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET,OPTIONS')
@API.route('/slug/<slug>')
class EngagementBySlug(Resource):
    """Resource for fetching a single engagement by slug."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.optional
    def get(slug):
        """Fetch a single engagement matching the provided slug."""
        default_tenant = current_app.config.get(
            'DEFAULT_TENANT_SHORT_NAME', 'default')
        tenant_short_name = request.headers.get('tenant-id', default_tenant)
        tenant = TenantModel.find_by_short_name(tenant_short_name)
        try:
            engagement_record = EngagementService().get_engagement_by_slug(slug, tenant.id)

            if engagement_record:
                return engagement_record, HTTPStatus.OK

            return ENGAGEMENT_NOT_FOUND, HTTPStatus.NOT_FOUND
        except KeyError:
            return ENGAGEMENT_NOT_FOUND, HTTPStatus.NOT_FOUND
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('DELETE, OPTIONS')
@API.route('/<engagement_id>/delete')
class EngagementDelete(Resource):
    """Resource for deleting engagements."""

    @staticmethod
    @require_role([Role.UNPUBLISH_ENGAGEMENT.value, Role.SUPER_ADMIN.value])
    @cross_origin(origins=allowedorigins())
    def delete(engagement_id: int):
        """Delete an engagement."""
        try:
            EngagementService.delete(engagement_id)
            return {'id': engagement_id}, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValueError as err:
            return str(err), HTTPStatus.BAD_REQUEST


@cors_preflight('GET, POST, PATCH, OPTIONS')
@API.route('/')
class Engagements(Resource):
    """Resource for managing engagements."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @auth.optional
    def get():
        """Fetch engagements."""
        try:
            args = request.args
            external_user_id = TokenInfo.get_id()

            pagination_options = PaginationOptions(
                page=args.get('page', 1, int),
                size=args.get('size', 10, int),
                sort_key=args.get('sort_key', 'name', str),
                sort_order=args.get('sort_order', 'asc', str),
            )

            exclude_internal = None
            if external_user_id is None:
                exclude_internal = True

            metadata = []
            metadata_param = args.get('metadata')
            if isinstance(metadata_param, str) and metadata_param:
                parsed_metadata = json.loads(metadata_param)
                if not isinstance(parsed_metadata, list) or not all(isinstance(item, dict) for item in parsed_metadata):
                    # if metadata is not a list of dictionaries, it is in the wrong format.
                    # blank it to avoid any issues.
                    parsed_metadata = []
                metadata = parsed_metadata

            search_options = {
                'search_text': args.get('search_text', '', type=str),
                'engagement_status': args.getlist('engagement_status[]'),
                'created_from_date': args.get('created_from_date', None, type=str),
                'created_to_date': args.get('created_to_date', None, type=str),
                'published_from_date': args.get('published_from_date', None, type=str),
                'published_to_date': args.get('published_to_date', None, type=str),
                'metadata': metadata,
                'exclude_internal': exclude_internal,
                # the membership changing pages sometimes need only engagements where users can add a member.
                # pass this has_team_access to restrict searches only within engagements they have access on.
                'has_team_access': args.get(
                    'has_team_access',
                    default=False,
                    type=lambda v: v.lower() == 'true'
                ),
            }

            engagement_records = EngagementService() \
                .get_engagements_paginated(
                external_user_id,
                pagination_options,
                search_options,
                include_banner_url=args.get(
                    'include_banner_url',
                    default=False,
                    type=lambda v: v.lower() == 'true'
                ),
            )

            return engagement_records, HTTPStatus.OK
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.CREATE_ENGAGEMENT.value])
    def post():
        """Create a new engagement."""
        try:
            requestjson = request.get_json()
            engagement_schema = EngagementSchema()
            engagement_model = EngagementService().create_engagement(requestjson)
            return engagement_schema.dump(engagement_model), HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def patch():
        """Update saved engagement partially."""
        try:
            requestjson = request.get_json()
            user_id = TokenInfo.get_id()
            requestjson['updated_by'] = user_id

            engagement_schema = EngagementSchema()
            payload = engagement_schema.load(requestjson, partial=True)
            if not isinstance(payload, dict):
                return 'Invalid engagement payload', HTTPStatus.BAD_REQUEST
            engagement = EngagementService().edit_engagement(payload)

            return engagement_schema.dump(engagement), HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST
