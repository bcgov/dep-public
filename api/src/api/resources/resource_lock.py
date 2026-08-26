"""API endpoints for managing resource locks."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.services import authorization
from api.services.resource_lock_service import ResourceLockService
from api.utils.roles import Role
from api.utils.token_info import TokenInfo
from api.utils.util import allowedorigins, cors_preflight

API = Namespace('locks', description='Endpoints for Resource Lock Management')


@cors_preflight('POST, OPTIONS')
@API.route('/acquire')
class AcquireLock(Resource):
    """Acquire resource lock endpoint."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def post():
        """Acquire a lock for a resource scope."""
        try:
            request_json = request.get_json() or {}
            owner_user_sub = TokenInfo.get_id()
            response = ResourceLockService.acquire_lock(
                resource_type=request_json.get('resource_type'),
                resource_id=request_json.get('resource_id'),
                section_key=request_json.get('section_key'),
                language_id=request_json.get('language_id'),
                owner_user_sub=owner_user_sub,
                owner_session_id=request_json.get('owner_session_id'),
                owner_display_name=request_json.get('owner_display_name'),
                ttl_seconds=request_json.get('ttl_seconds'),
            )
            return response, HTTPStatus.OK
        except BusinessException as err:
            return err.error, err.status_code


@cors_preflight('POST, OPTIONS')
@API.route('/refresh')
class RefreshLock(Resource):
    """Refresh resource lock endpoint."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def post():
        """Refresh an existing lock token."""
        try:
            request_json = request.get_json() or {}
            owner_user_sub = TokenInfo.get_id()
            response = ResourceLockService.refresh_lock(
                lock_token=request_json.get('lock_token'),
                owner_user_sub=owner_user_sub,
                owner_session_id=request_json.get('owner_session_id'),
                ttl_seconds=request_json.get('ttl_seconds'),
            )
            return response, HTTPStatus.OK
        except BusinessException as err:
            return err.error, err.status_code


@cors_preflight('POST, OPTIONS')
@API.route('/release')
class ReleaseLock(Resource):
    """Release resource lock endpoint."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def post():
        """Release an existing lock token."""
        try:
            request_json = request.get_json() or {}
            owner_user_sub = TokenInfo.get_id()
            allow_force_takeover = authorization.check_auth(
                one_of_roles=(Role.EDIT_MEMBERS.value,),
                abort=False,
            )
            release_reason = request_json.get('release_reason') or 'explicit'
            if release_reason == 'force_takeover' and not allow_force_takeover:
                return {
                    'code': 'forbidden',
                    'message': 'force_takeover release requires additional privileges',
                }, HTTPStatus.FORBIDDEN

            response = ResourceLockService.release_lock(
                lock_token=request_json.get('lock_token'),
                owner_user_sub=owner_user_sub,
                release_reason=release_reason,
                allow_force_takeover=allow_force_takeover,
            )
            return response, HTTPStatus.OK
        except BusinessException as err:
            return err.error, err.status_code
