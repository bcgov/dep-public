"""Resource lock validation decorators for API endpoints."""

from __future__ import annotations

from functools import wraps
from http import HTTPStatus
from typing import Any, Callable, Optional

from flask import g, request

from api.exceptions.business_exception import BusinessException
from api.services.resource_lock_service import ResourceLockService
from api.utils.token_info import TokenInfo


LockErrorBuilder = Callable[[BusinessException], tuple[Any, HTTPStatus]]


def lock_error_raw(err: BusinessException) -> tuple[Any, HTTPStatus]:
    """Return lock errors as raw payloads."""
    return err.error, err.status_code


def lock_error_message(err: BusinessException) -> tuple[dict[str, Any], HTTPStatus]:
    """Return lock errors wrapped in a message envelope."""
    return {'message': err.error}, err.status_code


def lock_error_status_failure(err: BusinessException) -> tuple[dict[str, Any], HTTPStatus]:
    """Return lock errors wrapped in status/failure envelope."""
    return {'status': 'failure', 'message': err.error}, err.status_code


def require_engagement_patch_lock(func: Callable) -> Callable:
    """Validate lock requirements for PATCH /engagements before calling the handler."""

    @wraps(func)
    def wrapper(*args, **kwargs):
        request_json = request.get_json()
        if not isinstance(request_json, dict):
            return 'Invalid engagement payload', HTTPStatus.BAD_REQUEST

        engagement_id = request_json.get('id')
        if isinstance(engagement_id, str) and engagement_id.isdigit():
            engagement_id = int(engagement_id)
            request_json['id'] = engagement_id

        if not isinstance(engagement_id, int):
            return 'Engagement id is required', HTTPStatus.BAD_REQUEST

        user_id = TokenInfo.get_id()
        try:
            ResourceLockService.validate_engagement_patch_lock(
                engagement_id=engagement_id,
                payload=request_json,
                lock_token=request.headers.get(
                    ResourceLockService.LOCK_HEADER_NAME),
                owner_user_sub=user_id,
            )
        except BusinessException as err:
            return err.error, err.status_code

        g.engagement_patch_payload = request_json
        g.engagement_patch_user_id = user_id
        return func(*args, **kwargs)

    return wrapper


def require_engagement_section_lock(
    *,
    section_key: str,
    language_kwarg: Optional[str] = None,
    error_builder: LockErrorBuilder = lock_error_raw,
    invalid_language_response: Optional[tuple[Any, HTTPStatus]] = None,
) -> Callable:
    """Validate engagement section lock for route-scoped operations."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            engagement_id = kwargs.get('engagement_id')
            user_id = TokenInfo.get_id()

            language_id = None
            if language_kwarg:
                try:
                    language_id = int(kwargs.get(language_kwarg))
                except (TypeError, ValueError):
                    if invalid_language_response is not None:
                        return invalid_language_response
                    return 'language_id must be an integer', HTTPStatus.BAD_REQUEST

            try:
                ResourceLockService.validate_engagement_section_lock(
                    engagement_id=engagement_id,
                    section_key=section_key,
                    language_id=language_id,
                    lock_token=request.headers.get(
                        ResourceLockService.LOCK_HEADER_NAME),
                    owner_user_sub=user_id,
                )
            except BusinessException as err:
                return error_builder(err)

            g.lock_validation_user_id = user_id
            if language_id is not None:
                g.lock_validation_language_id = language_id
            return func(*args, **kwargs)

        return wrapper

    return decorator


def require_engagement_content_translation_lock(
    *,
    error_builder: LockErrorBuilder = lock_error_message,
) -> Callable:
    """Validate lock for aggregated content translation operations."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            request_json = request.get_json() or {}
            user_id = TokenInfo.get_id()

            try:
                ResourceLockService.validate_engagement_content_translation_lock(
                    engagement_id=kwargs.get('engagement_id'),
                    language_id=kwargs.get('language_id'),
                    payload=request_json,
                    lock_token=request.headers.get(
                        ResourceLockService.LOCK_HEADER_NAME),
                    owner_user_sub=user_id,
                )
            except BusinessException as err:
                return error_builder(err)

            g.engagement_content_translation_payload = request_json
            g.lock_validation_user_id = user_id
            return func(*args, **kwargs)

        return wrapper

    return decorator


def require_widget_translation_lock(
    *,
    error_builder: LockErrorBuilder = lock_error_raw,
) -> Callable:
    """
    Validate lock for widget translation create operations.

    Intended for use when *creating* a new translation for a widget, where the
    widget needs to acquire a lock on a language, but a translation does not
    yet exist.
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            request_json = request.get_json() or {}
            language_id = request_json.get('language_id')
            try:
                language_id = int(language_id)
            except (TypeError, ValueError):
                return 'language_id is required', HTTPStatus.BAD_REQUEST

            user_id = TokenInfo.get_id()
            try:
                ResourceLockService.validate_widget_translation_lock(
                    widget_id=kwargs.get('widget_id'),
                    language_id=language_id,
                    lock_token=request.headers.get(
                        ResourceLockService.LOCK_HEADER_NAME),
                    owner_user_sub=user_id,
                )
            except BusinessException as err:
                return error_builder(err)

            g.lock_validation_user_id = user_id
            g.lock_validation_language_id = language_id
            return func(*args, **kwargs)

        return wrapper

    return decorator


def require_widget_translation_lock_by_id(
    *,
    error_builder: LockErrorBuilder = lock_error_raw,
) -> Callable:
    """
    Validate lock for widget translation update/delete operations by id.

    Intended for use when *updating* or deleting an existing translation for a
    widget, where the translation already exists and has a lock on a language.
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            user_id = TokenInfo.get_id()
            try:
                ResourceLockService.validate_widget_translation_lock_by_id(
                    widget_id=kwargs.get('widget_id'),
                    widget_translation_id=kwargs.get('widget_translation_id'),
                    lock_token=request.headers.get(
                        ResourceLockService.LOCK_HEADER_NAME),
                    owner_user_sub=user_id,
                )
            except BusinessException as err:
                return error_builder(err)

            g.lock_validation_user_id = user_id
            return func(*args, **kwargs)

        return wrapper

    return decorator


def require_survey_section_lock(
    *,
    section_key: str,
    survey_id_kwarg: str = 'survey_id',
    error_builder: LockErrorBuilder = lock_error_raw,
) -> Callable:
    """Validate a survey section lock for route-scoped operations.

    Reads survey_id from URL kwargs by default; pass survey_id_kwarg to override.
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            survey_id = kwargs.get(survey_id_kwarg)
            user_id = TokenInfo.get_id()
            try:
                ResourceLockService.validate_survey_section_lock(
                    survey_id=survey_id,
                    section_key=section_key,
                    lock_token=request.headers.get(
                        ResourceLockService.LOCK_HEADER_NAME),
                    owner_user_sub=user_id,
                )
            except BusinessException as err:
                return error_builder(err)

            g.lock_validation_user_id = user_id
            return func(*args, **kwargs)

        return wrapper

    return decorator


def require_survey_builder_lock(func: Callable) -> Callable:
    """Validate survey builder lock for PUT /surveys/ before calling the handler.

    Reads survey id from the JSON body since the PUT route has no URL id param.
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        request_json = request.get_json()
        if not isinstance(request_json, dict):
            return 'Invalid survey payload', HTTPStatus.BAD_REQUEST

        survey_id = request_json.get('id')
        if isinstance(survey_id, str) and survey_id.isdigit():
            survey_id = int(survey_id)

        if not isinstance(survey_id, int):
            return 'Survey id is required', HTTPStatus.BAD_REQUEST

        user_id = TokenInfo.get_id()
        try:
            ResourceLockService.validate_survey_section_lock(
                survey_id=survey_id,
                section_key=ResourceLockService.SECTION_SURVEY_BUILDER,
                lock_token=request.headers.get(
                    ResourceLockService.LOCK_HEADER_NAME),
                owner_user_sub=user_id,
            )
        except BusinessException as err:
            return err.error, err.status_code

        g.survey_builder_payload = request_json
        g.lock_validation_user_id = user_id
        return func(*args, **kwargs)

    return wrapper
