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
"""API endpoints for managing documents resource."""

from http import HTTPStatus
from typing import Any, cast

from flask import jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from api.auth import auth
from api.exceptions.business_exception import BusinessException
from api.models import Engagement as EngagementModel
from api.models import Survey as SurveyModel
from api.models.db import db
from api.models.tenant import Tenant
from api.resources.metadata_taxon import ensure_tenant_access
from api.schemas.document import Document
from api.schemas.public_upload import PublicObjectAccessRequestSchema, PublicUploadAuthorizationRequestSchema
from api.schemas.uploaded_file import UploadedFileSchema
from api.services.email_verification_service import EmailVerificationService
from api.services.file_upload_service import FileUploadService
from api.services.object_storage_service import ObjectStorageService
from api.utils.roles import Role
from api.utils.tenant_validator import require_role
from api.utils.util import allowedorigins, cors_preflight


API = Namespace(
    'document', description='Endpoints for Document Storage Management')
"""Custom exception messages"""


def _get_public_upload_scope(verification_token: str):
    """Return the validated public upload scope for the provided verification token."""
    verification = cast(
        dict[str, Any], EmailVerificationService().get_active(verification_token))
    survey_id = verification.get('survey_id')
    if not survey_id:
        raise ValueError('Survey not found.')

    survey = SurveyModel.get_open(survey_id)
    if not survey:
        raise PermissionError('Engagement not open to submissions.')

    engagement = EngagementModel.find_by_id(survey.engagement_id)
    if not engagement:
        raise ValueError('Engagement not found.')

    return verification, survey, engagement


@cors_preflight('POST,OPTIONS')
@API.route('/')
class DocumentStorage(Resource):
    """Document storage resource controller."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @require_role([Role.EDIT_ENGAGEMENT.value])
    @ensure_tenant_access()
    def post(tenant: Tenant):
        """Retrieve authentication properties for document storage."""
        try:
            object_storage = None
            requestfilejson = request.get_json()
            documents = cast(list[dict[str, Any]],
                             Document().load(requestfilejson, many=True))
            auth_headers = []
            for document in documents:
                if document.get('s3sourceuri'):
                    object_storage = object_storage or ObjectStorageService()
                    auth_headers.append(
                        object_storage.get_auth_headers([document])[0])
                else:
                    auth_headers.append(FileUploadService(db.session).prepare_file_upload(
                        tenant_id=tenant.id,
                        file_name=document['filename'],
                        content_type=document.get('content_type'),
                        engagement_id=document.get('engagement_id'),
                        widget_id=document.get('widget_id')
                    )[0])

            return jsonify(auth_headers), HTTPStatus.OK
        except BusinessException as err:
            return str(err), err.status_code
        except KeyError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('PATCH,DELETE')
@API.route('/<string:file_id>')
class DocumentResource(Resource):
    """Handles operations on a specific document identified by file_id."""

    @staticmethod
    @auth.requires_auth
    @require_role([Role.EDIT_ENGAGEMENT.value])
    @cross_origin(origins=allowedorigins())
    def patch(file_id: str):
        """Update a specific document identified by file_id."""
        file_upload_service = FileUploadService(db.session)  # type: ignore
        file = file_upload_service.get_file_upload(file_id)
        UploadedFileSchema().load(request.get_json(), instance=file,
                                  partial=True, session=db.session)
        db.session.commit()
        return UploadedFileSchema().dump(file), HTTPStatus.OK

    @staticmethod
    @auth.requires_auth
    @require_role([Role.EDIT_ENGAGEMENT.value])
    @cross_origin(origins=allowedorigins())
    def delete(file_id: str):
        """Delete a specific document identified by file_id."""
        file_upload_service = FileUploadService(db.session)  # type: ignore
        file_upload_service.delete_file_upload(file_id)
        db.session.commit()
        return '', HTTPStatus.NO_CONTENT


@cors_preflight('POST')
@API.route('/<string:file_id>/finalize')
class FinalizeDocumentUpload(Resource):
    """Finalizes the upload of a document to the storage service."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def post(file_id: str):
        """Finalize the upload of a document to the storage service."""
        upload_service = FileUploadService(db.session)  # type: ignore
        try:
            uploaded_file, status_code = upload_service.finalize_file_upload(
                file_id)
            return UploadedFileSchema().dump(uploaded_file), status_code
        except ValueError as err:
            if 'not found' in str(err):
                return str(err), HTTPStatus.NOT_FOUND
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST


@cors_preflight('GET,POST,DELETE,OPTIONS')
@API.route('/public')
class PublicDocumentUploadAuthorization(Resource):
    """Token-scoped public upload/download/delete authorization controller."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def post():
        """Retrieve upload authorization for a public survey file upload."""
        try:
            request_json = request.get_json()
            upload_request = cast(
                dict[str, Any],
                PublicUploadAuthorizationRequestSchema().load(request_json),
            )

            verification, survey, _ = _get_public_upload_scope(
                upload_request['verification_token'])

            object_storage_service = ObjectStorageService()
            object_key, unique_filename = object_storage_service.build_public_upload_key(
                tenant_id=survey.tenant_id,
                survey_id=survey.id,
                verification_id=verification['id'],
                filename=upload_request['filename'],
            )
            signed_upload = object_storage_service.get_signed_upload_details(
                object_key=object_key,
                content_type=upload_request.get('content_type'),
            )

            return {
                **signed_upload,
                'uniquefilename': unique_filename,
                'filename': upload_request['filename'],
                'content_type': upload_request['content_type'],
                'size': upload_request['size'],
            }, HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except PermissionError as err:
            return {'message': str(err)}, HTTPStatus.FORBIDDEN
        except ValueError as err:
            return {'message': str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get():
        """Retrieve download authorization for a public survey file upload."""
        try:
            file_id = request.args.get('file_id')
            verification_token = request.headers.get('Verification-Token')
            if not file_id or not verification_token:
                return {'message': 'Missing required parameters.'}, HTTPStatus.BAD_REQUEST
            access_request = cast(
                dict[str, Any],
                PublicObjectAccessRequestSchema().load({
                    'file_id': request.args.get('file_id'),
                    'verification_token': request.headers.get('Verification-Token'),
                }),
            )
            verification, survey, _ = _get_public_upload_scope(
                access_request['verification_token'])

            object_storage_service = ObjectStorageService()
            object_key = object_storage_service.get_object_key(
                access_request['file_id'])
            expected_prefix = object_storage_service.build_public_upload_prefix(
                tenant_id=survey.tenant_id,
                survey_id=survey.id,
                verification_id=verification['id'],
            )
            if not object_key.startswith(expected_prefix):
                return {'message': 'Invalid file requested.'}, HTTPStatus.FORBIDDEN

            return object_storage_service.get_signed_request_details('GET', object_key), HTTPStatus.OK
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except PermissionError as err:
            return {'message': str(err)}, HTTPStatus.FORBIDDEN
        except ValueError as err:
            return {'message': str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def delete():
        """Delete a public survey upload for a valid verification token."""
        try:
            headers = request.headers
            args = request.args
            if not args.get('file_id') or not headers.get('Verification-Token'):
                return {'message': 'Missing required parameters.'}, HTTPStatus.BAD_REQUEST
            access_request = cast(
                dict[str, Any],
                PublicObjectAccessRequestSchema().load({
                    'file_id': args.get('file_id'),
                    'verification_token': headers.get('Verification-Token'),
                }),
            )
            verification, survey, _ = _get_public_upload_scope(
                access_request['verification_token'])

            object_storage_service = ObjectStorageService()
            object_key = object_storage_service.get_object_key(
                access_request['file_id'])
            expected_prefix = object_storage_service.build_public_upload_prefix(
                tenant_id=survey.tenant_id,
                survey_id=survey.id,
                verification_id=verification['id'],
            )
            if not object_key.startswith(expected_prefix):
                return {'message': 'Invalid file requested.'}, HTTPStatus.FORBIDDEN

            object_storage_service.delete_file(object_key)
            return {}, HTTPStatus.NO_CONTENT
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except PermissionError as err:
            return {'message': str(err)}, HTTPStatus.FORBIDDEN
        except ValueError as err:
            return {'message': str(err)}, HTTPStatus.BAD_REQUEST
