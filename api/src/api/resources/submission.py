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
"""API endpoints for managing a submission resource."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from api.auth import jwt as _jwt
from api.models.pagination_options import PaginationOptions
from api.schemas import utils as schema_utils
from api.schemas.submission import SubmissionSchema
from api.services.submission_service import SubmissionService
from api.utils.token_info import TokenInfo
from api.utils.util import allowedorigins, cors_preflight


API = Namespace('submissions', description='Endpoints for submission Management')
"""Custom exception messages
"""


@cors_preflight('GET,OPTIONS')
@API.route('/<submission_id>')
class Submission(Resource):
    """Resource for managing a submission."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def get(submission_id):
        """Fetch a single submission."""
        try:
            submission = SubmissionService().get_with_submission_json(submission_id)
            return submission, HTTPStatus.OK
        except KeyError:
            return 'Submission not found', HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def put(submission_id):
        """Update comment status by submission id."""
        try:
            requestjson = request.get_json()
            external_user_id = TokenInfo.get_id()
            submission = SubmissionService().review_comment(submission_id, requestjson, external_user_id)
            return submission, HTTPStatus.OK
        except KeyError:
            return 'Submission was not found', HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET,PUT,POST,OPTIONS')
@API.route('/public/<verification_token>')
class PublicSubmission(Resource):
    """Resource for managing public submissions."""

    @staticmethod
    # @TRACER.trace()
    @cross_origin(origins=allowedorigins())
    def get(verification_token):
        """Fetch a single submission."""
        try:
            submission = SubmissionService().get_by_token(verification_token)
            return submission, HTTPStatus.OK
        except KeyError:
            return 'Submission not found', HTTPStatus.NOT_FOUND
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    # @TRACER.trace()
    @cross_origin(origins=allowedorigins())
    def post(verification_token):
        """Create a new submission."""
        try:
            request_json = request.get_json()
            valid_format, errors = schema_utils.validate(request_json, 'submission')
            if not valid_format:
                return {'message': schema_utils.serialize(errors)}, HTTPStatus.BAD_REQUEST

            schema = SubmissionSchema().load(request_json)
            SubmissionService().create(verification_token, schema)
            return {}, HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def put(verification_token):
        """Update comment status by submission id."""
        try:
            requestjson = request.get_json()
            SubmissionService().update_comments(verification_token, requestjson)
            return {}, HTTPStatus.OK
        except KeyError:
            return 'Submission was not found', HTTPStatus.NOT_FOUND
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET, OPTIONS')
@API.route('/survey/<survey_id>')
class SurveySubmissions(Resource):
    """Resource for managing multiple submissions."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def get(survey_id):
        """Get submissions page."""
        try:
            args = request.args

            pagination_options = PaginationOptions(
                page=args.get('page', 1, int),
                size=args.get('size', 10, int),
                sort_key=args.get('sort_key', 'submission.id', str),
                sort_order=args.get('sort_order', 'asc', str),
            )
            advanced_search_filters = {
                'status': args.get('status', None, int),
                'comment_date_to': args.get('comment_date_to', None, str),
                'comment_date_from': args.get('comment_date_from', None, str),
                'reviewer': args.get('reviewer', None, str),
                'reviewed_date_from': args.get('reviewed_date_from', None, str),
                'reviewed_date_to': args.get('reviewed_date_to', None, str),
            }
            submission_page = SubmissionService()\
                .get_paginated(
                    survey_id,
                    pagination_options,
                    args.get('search_text', '', str),
                    advanced_search_filters=advanced_search_filters,
                    include_autoapproved=args.get('include_autoapproved', False, bool),
                    exclude_commentless=args.get('exclude_commentless', False, bool),
            )
            return submission_page, HTTPStatus.OK
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
