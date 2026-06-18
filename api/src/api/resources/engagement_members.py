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
"""API endpoints for managing engagements' memberships."""

from http import HTTPStatus

from flask import jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.schemas.membership_engagement import MembershipEngagementSchema
from api.schemas.memberships import MembershipSchema
from api.services.membership_service import MembershipService
from api.utils.util import allowedorigins, cors_preflight

API = Namespace('engagement_members',
                description='Endpoints for Engagement Membership Management')
"""Custom exception messages
"""


@cors_preflight('GET,OPTIONS')
@API.route('')
class EngagementMembership(Resource):
    """Resource for managing engagements' memberships."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def get(engagement_id):
        """Get memberships."""
        try:

            members = MembershipService.get_memberships(engagement_id)
            return jsonify(MembershipSchema().dump(members, many=True)), HTTPStatus.OK
        except BusinessException as err:
            return {'message': err.error}, err.status_code

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def post(engagement_id):
        """Create a new membership."""
        # TODO validate against a schema.
        try:
            member = MembershipService.create_membership(
                engagement_id, request.get_json())
            return MembershipSchema().dump(member), HTTPStatus.OK
        except BusinessException as err:
            return {'message': err.error}, err.status_code


@cors_preflight('GET,OPTIONS')
@API.route('/<user_id>')
class EngagementMembershipUser(Resource):
    """Resource for fetching memberships for user."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(engagement_id, user_id):  # pylint: disable=unused-argument
        """Get membership by id."""
        try:
            # TODO add auth for this method

            if engagement_id != 'all':
                return 'Invalid engagement id', HTTPStatus.BAD_REQUEST

            args = request.args
            include_engagement_details = args.get(
                'include_engagement_details',
                default=False,
                type=lambda v: v.lower() == 'true'
            )
            include_revoked = args.get(
                'include_revoked',
                default=False,
                type=lambda v: v.lower() == 'true'
            )
            members = MembershipService.get_assigned_engagements(
                user_id,
                include_revoked
            )

            membership_schema = MembershipEngagementSchema(
            ) if include_engagement_details else MembershipSchema()

            return jsonify(membership_schema.dump(members, many=True)), HTTPStatus.OK
        except BusinessException as err:
            return {'message': err.error}, err.status_code
        except ValueError as err:
            return str(err), HTTPStatus.BAD_REQUEST


@cors_preflight('PATCH,OPTIONS')
@API.route('/<user_id>/status')
class RevokeMembership(Resource):
    """Resource for revoking engagement membership for a user."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def patch(engagement_id, user_id):
        """Update membership status."""
        try:
            action = request.get_json().get('action', str)
            membership = MembershipService.update_membership_status(
                engagement_id, user_id, action)
            return MembershipSchema().dump(membership), HTTPStatus.OK
        except ValueError as err:
            return str(err), HTTPStatus.BAD_REQUEST
