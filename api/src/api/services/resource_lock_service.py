"""Service for resource lock management."""

from __future__ import annotations

from datetime import timedelta
from http import HTTPStatus
from typing import Any, NoReturn, Optional
from uuid import UUID, uuid4

from flask import current_app, has_app_context
from sqlalchemy.exc import IntegrityError

from api.exceptions.business_exception import BusinessException
from api.models.db import db
from api.models.engagement_translation import EngagementTranslation as EngagementTranslationModel
from api.models.resource_lock import ResourceLock
from api.models.widget import Widget as WidgetModel
from api.models.widget_translation import WidgetTranslation as WidgetTranslationModel
from api.utils.datetime import utc_now


class ResourceLockService:
    """Resource lock management service."""

    LOCK_HEADER_NAME = 'X-Resource-Lock-Token'
    ENGAGEMENT_PATCH_VALIDATION_FLAG = 'ENGAGEMENT_LOCK_VALIDATION_ENABLED'
    DEFAULT_TTL_SECONDS = 90

    RESOURCE_TYPE_ENGAGEMENT_SECTION = 'engagement_section'

    SECTION_AUTHORING_BANNER = 'authoring.banner'
    SECTION_AUTHORING_SUMMARY = 'authoring.summary'
    SECTION_AUTHORING_DETAILS = 'authoring.details'
    SECTION_AUTHORING_FEEDBACK = 'authoring.feedback'
    SECTION_AUTHORING_SUBSCRIBE = 'authoring.subscribe'
    SECTION_AUTHORING_MORE = 'authoring.more'
    SECTION_CONFIG_GENERAL = 'config.general'

    WIDGET_LOCATION_SUMMARY = 1
    WIDGET_LOCATION_DETAILS = 2
    WIDGET_LOCATION_FEEDBACK = 3
    WIDGET_LOCATION_SECTION_MAP = {
        WIDGET_LOCATION_SUMMARY: SECTION_AUTHORING_SUMMARY,
        WIDGET_LOCATION_DETAILS: SECTION_AUTHORING_DETAILS,
        WIDGET_LOCATION_FEEDBACK: SECTION_AUTHORING_FEEDBACK,
    }

    PATCH_META_FIELDS = {'id', 'updated_by'}
    TRANSLATION_META_FIELDS = {'id', 'engagement_id', 'language_id'}
    CONTENT_TRANSLATION_WIDGET_PAYLOAD_KEYS = (
        'widgets',
        'timeline_widgets',
        'events_widgets',
        'documents_widgets',
        'image_widgets',
    )

    PATCH_SECTION_FIELDS = {
        SECTION_AUTHORING_BANNER: {
            'status_block',
            'banner_filename',
        },
        SECTION_AUTHORING_FEEDBACK: {
            'selected_survey_id',
        },
        SECTION_AUTHORING_MORE: {
            'suggested_engagements',
            'suggested_engagements_input',
            'more_engagements_heading',
        },
        SECTION_CONFIG_GENERAL: {
            'name',
            'slug',
            'description',
            'start_date',
            'end_date',
            'status_id',
            'created_date',
            'published_date',
            'scheduled_date',
            'is_internal',
            'languages',
            'surveys',
            'tenant_id',
        },
    }

    TRANSLATION_SECTION_FIELDS = {
        SECTION_AUTHORING_BANNER: {
            'name',
            'sponsor_name',
            'upcoming_status_block_text',
            'open_status_block_text',
            'closed_status_block_text',
            'open_status_block_button_text',
            'view_results_status_block_button_text',
        },
        SECTION_AUTHORING_SUMMARY: {
            'description',
            'rich_description',
            'description_title',
            'content',
            'rich_content',
        },
        SECTION_AUTHORING_FEEDBACK: {
            'feedback_heading',
            'feedback_body',
        },
        SECTION_AUTHORING_SUBSCRIBE: {
            'subscribe_section_heading',
            'subscribe_section_description',
            'subscribe_consent_message',
            'consent_message',
        },
        SECTION_AUTHORING_MORE: {
            'more_engagements_heading',
        },
        SECTION_CONFIG_GENERAL: {
            'slug',
        },
    }

    @classmethod
    def build_scope_key(
        cls,
        resource_type: str,
        resource_id: int,
        section_key: Optional[str] = None,
        language_id: Optional[int] = None,
    ) -> str:
        """Build canonical lock scope key."""
        scope = f'{resource_type}:{resource_id}'
        if section_key:
            scope = f'{scope}:{section_key}'
        if language_id is not None:
            scope = f'{scope}:lang:{language_id}'
        return scope

    @classmethod
    def _lock_error(  # pylint: disable=too-many-arguments
        cls,
        code: str,
        message: str,
        status_code: HTTPStatus = HTTPStatus.LOCKED,
        lock_scope: Optional[str] = None,
        lock: Optional[ResourceLock] = None,
    ) -> NoReturn:
        """Raise a structured lock-related BusinessException."""
        error: dict[str, Any] = {
            'code': code,
            'message': message,
        }
        if lock_scope:
            error['lock_scope'] = lock_scope
        if lock:
            error['owner'] = {
                'user_sub': lock.owner_user_sub,
                'display_name': lock.owner_display_name,
            }
            error['expires_at'] = lock.expires_at.isoformat(
            ) if lock.expires_at else None
        raise BusinessException(error=error, status_code=status_code)

    @classmethod
    def _business_error(
        cls,
        *,
        message: str,
        code: str = 'invalid_request',
        status_code: HTTPStatus = HTTPStatus.BAD_REQUEST,
        **extra: Any,
    ) -> NoReturn:
        """Raise a generic structured BusinessException payload."""
        error: dict[str, Any] = {'code': code, 'message': message}
        error.update(extra)
        raise BusinessException(error=error, status_code=status_code)

    @classmethod
    def _released_lock_response(cls, lock: Optional[ResourceLock] = None) -> dict[str, Any]:
        return {
            'released': True,
            'released_at': lock.released_at.isoformat() if lock and lock.released_at else None,
        }

    @classmethod
    def _validate_uuid(cls, value: str, field_name: str) -> str:
        try:
            return str(UUID(value))
        except (ValueError, TypeError):
            cls._business_error(
                message=f'{field_name} must be a valid UUID',
            )

    @classmethod
    def _get_ttl_seconds_or_default(cls, ttl_seconds: Optional[int]) -> int:
        if ttl_seconds is None:
            return cls.DEFAULT_TTL_SECONDS
        if not isinstance(ttl_seconds, int):
            cls._business_error(
                message='ttl_seconds must be an integer',
            )
        if ttl_seconds < 30 or ttl_seconds > 600:
            cls._business_error(
                message='ttl_seconds must be between 30 and 600',
            )
        return ttl_seconds

    @classmethod
    def _normalize_payload_fields(cls, payload: dict[str, Any], ignored_fields: set[str]) -> set[str]:
        return {key for key in payload.keys() if key not in ignored_fields}

    @classmethod
    def _resolve_section_from_payload(
        cls,
        *,
        payload: dict[str, Any],
        ignored_fields: set[str],
        section_fields: dict[str, set[str]],
        default_section: Optional[str] = None,
    ) -> str:
        payload_fields = cls._normalize_payload_fields(payload, ignored_fields)
        return cls._resolve_section_from_fields(
            payload_fields=payload_fields,
            section_fields=section_fields,
            default_section=default_section,
        )

    @classmethod
    def _resolve_single_section(
        cls,
        *,
        sections: set[str],
        allow_empty: bool = True,
        multi_section_message: str,
    ) -> Optional[str]:
        if not sections:
            if allow_empty:
                return None
            cls._business_error(message='No lock-scoped section was resolved')

        if len(sections) > 1:
            cls._business_error(
                message=multi_section_message,
                sections=sorted(sections),
            )

        return next(iter(sections))

    @classmethod
    def _resolve_section_from_fields(
        cls,
        *,
        payload_fields: set[str],
        section_fields: dict[str, set[str]],
        default_section: Optional[str] = None,
    ) -> str:
        if not payload_fields:
            if default_section is not None:
                return default_section
            cls._business_error(
                message='No lock-scoped fields were provided',
            )

        matched_sections = {
            section for section, allowed_fields in section_fields.items()
            if payload_fields.intersection(allowed_fields)
        }

        if len(matched_sections) > 1:
            cls._business_error(
                message='Payload contains fields from multiple locked sections',
                sections=sorted(matched_sections),
            )

        if len(matched_sections) == 1:
            section = next(iter(matched_sections))
            allowed = section_fields[section]
            unknown_fields = payload_fields - allowed
            if unknown_fields:
                cls._business_error(
                    message='Payload includes unsupported fields for the resolved section',
                    section=section,
                    fields=sorted(unknown_fields),
                )
            return section

        if default_section is not None:
            return default_section

        cls._business_error(
            message='Unable to resolve lock section for payload fields',
            fields=sorted(payload_fields),
        )

    @classmethod
    def _validate_lock_for_scope(
        cls,
        *,
        expected_scope: str,
        lock_token: Optional[str],
        owner_user_sub: str,
    ) -> ResourceLock:
        if not lock_token:
            cls._lock_error(
                code='lock_required',
                message='Missing lock token header',
                status_code=HTTPStatus.BAD_REQUEST,
                lock_scope=expected_scope,
            )

        token = cls._validate_uuid(lock_token, 'lock_token')
        lock = ResourceLock.find_unexpired_by_token(token)
        if not lock:
            cls._lock_error(
                code='lock_expired',
                message='Lock token is invalid or expired',
                status_code=HTTPStatus.UNAUTHORIZED,
                lock_scope=expected_scope,
            )

        if lock.lock_scope != expected_scope:
            cls._lock_error(
                code='lock_conflict',
                message='Lock scope does not match requested operation',
                status_code=HTTPStatus.CONFLICT,
                lock_scope=expected_scope,
                lock=lock,
            )

        if lock.owner_user_sub != owner_user_sub:
            cls._lock_error(
                code='lock_not_owner',
                message='Lock is owned by another user',
                lock_scope=lock.lock_scope,
                lock=lock,
            )

        return lock

    @classmethod
    def validate_engagement_section_lock(  # pylint: disable=too-many-arguments
        cls,
        *,
        engagement_id: int,
        section_key: str,
        lock_token: Optional[str],
        owner_user_sub: str,
        language_id: Optional[int] = None,
    ) -> Optional[ResourceLock]:
        """Validate a lock token for an engagement section scope."""
        if not cls.is_engagement_lock_validation_enabled():
            return None

        expected_scope = cls.build_scope_key(
            cls.RESOURCE_TYPE_ENGAGEMENT_SECTION,
            engagement_id,
            section_key,
            language_id,
        )
        return cls._validate_lock_for_scope(
            expected_scope=expected_scope,
            lock_token=lock_token,
            owner_user_sub=owner_user_sub,
        )

    @classmethod
    def _resolve_translation_section_for_fields(cls, payload: dict[str, Any]) -> str:
        return cls._resolve_section_from_payload(
            payload=payload,
            ignored_fields=cls.TRANSLATION_META_FIELDS,
            section_fields=cls.TRANSLATION_SECTION_FIELDS,
        )

    @classmethod
    def validate_engagement_translation_lock(  # pylint: disable=too-many-arguments
        cls,
        *,
        engagement_id: int,
        language_id: int,
        translation_payload: dict[str, Any],
        lock_token: Optional[str],
        owner_user_sub: str,
    ) -> Optional[ResourceLock]:
        """Validate lock ownership/scope for engagement translation updates."""
        section_key = cls._resolve_translation_section_for_fields(
            translation_payload)
        return cls.validate_engagement_section_lock(
            engagement_id=engagement_id,
            section_key=section_key,
            language_id=language_id,
            lock_token=lock_token,
            owner_user_sub=owner_user_sub,
        )

    @classmethod
    def validate_engagement_translation_lock_by_id(  # pylint: disable=too-many-arguments
        cls,
        *,
        engagement_id: int,
        engagement_translation_id: int,
        translation_payload: dict[str, Any],
        lock_token: Optional[str],
        owner_user_sub: str,
    ) -> Optional[ResourceLock]:
        """Resolve translation language by id and validate matching section lock."""
        translation = EngagementTranslationModel.find_by_id(
            engagement_translation_id)
        if not translation or translation.engagement_id != engagement_id:
            cls._business_error(
                message='Engagement translation not found',
                status_code=HTTPStatus.NOT_FOUND,
            )

        return cls.validate_engagement_translation_lock(
            engagement_id=engagement_id,
            language_id=translation.language_id,
            translation_payload=translation_payload,
            lock_token=lock_token,
            owner_user_sub=owner_user_sub,
        )

    @classmethod
    def _section_for_widget_location(cls, location: int) -> str:
        section = cls.WIDGET_LOCATION_SECTION_MAP.get(location)
        if section is None:
            cls._business_error(message=f'Unknown widget location: {location}')
        return section

    @classmethod
    def _resolve_widget_sections_for_payload(
        cls,
        *,
        engagement_id: int,
        payloads: list[dict[str, Any]],
        payload_name: str,
    ) -> set[str]:
        if not payloads:
            return set()

        raw_widget_ids = {item.get('widget_id') for item in payloads}
        if None in raw_widget_ids:
            cls._business_error(
                message=f'{payload_name} payload requires widget_id for lock validation',
            )

        invalid_ids = [wid for wid in raw_widget_ids if not isinstance(
            wid, int) or wid <= 0]
        if invalid_ids:
            cls._business_error(
                message=f'{payload_name} includes invalid widget_id values',
                widget_ids=invalid_ids,
            )

        widget_ids: set[int] = {
            int(wid) for wid in raw_widget_ids if isinstance(wid, int)}

        widgets = (
            WidgetModel.query.filter(
                WidgetModel.id.in_(widget_ids),
                WidgetModel.engagement_id == engagement_id,
            ).all()
        )
        found_ids = {widget.id for widget in widgets}
        missing_ids = sorted(widget_ids - found_ids)
        if missing_ids:
            cls._business_error(
                message=f'{payload_name} references widget_ids outside this engagement',
                widget_ids=missing_ids,
            )

        return {cls._section_for_widget_location(widget.location) for widget in widgets}

    @classmethod
    def _resolve_widget_section(cls, *, widget_id: int) -> tuple[int, str]:
        """Return engagement id and section key for a widget id."""
        widget = WidgetModel.find_by_id(widget_id)
        if not widget:
            cls._business_error(
                message='Widget not found',
                status_code=HTTPStatus.NOT_FOUND,
            )
        return widget.engagement_id, cls._section_for_widget_location(widget.location)

    @classmethod
    def validate_widget_translation_lock(
        cls,
        *,
        widget_id: int,
        language_id: int,
        lock_token: Optional[str],
        owner_user_sub: str,
    ) -> Optional[ResourceLock]:
        """Validate lock ownership/scope for widget translation writes."""
        if not cls.is_engagement_lock_validation_enabled():
            return None

        engagement_id, section_key = cls._resolve_widget_section(
            widget_id=widget_id)
        return cls.validate_engagement_section_lock(
            engagement_id=engagement_id,
            section_key=section_key,
            language_id=language_id,
            lock_token=lock_token,
            owner_user_sub=owner_user_sub,
        )

    @classmethod
    def validate_widget_translation_lock_by_id(
        cls,
        *,
        widget_id: int,
        widget_translation_id: int,
        lock_token: Optional[str],
        owner_user_sub: str,
    ) -> Optional[ResourceLock]:
        """Resolve widget translation language by id and validate section lock."""
        translation = WidgetTranslationModel.find_by_id(widget_translation_id)
        if not translation or translation.widget_id != widget_id:
            cls._business_error(
                message='Widget translation not found',
                status_code=HTTPStatus.NOT_FOUND,
            )

        return cls.validate_widget_translation_lock(
            widget_id=widget_id,
            language_id=translation.language_id,
            lock_token=lock_token,
            owner_user_sub=owner_user_sub,
        )

    @classmethod
    def _resolve_sections_for_content_translation_payload(
        cls,
        *,
        engagement_id: int,
        payload: dict[str, Any],
    ) -> set[str]:
        """Resolve candidate authoring sections touched by content translation payload."""
        sections: set[str] = set()

        if payload.get('details_tabs') is not None:
            sections.add(cls.SECTION_AUTHORING_DETAILS)

        for key in cls.CONTENT_TRANSLATION_WIDGET_PAYLOAD_KEYS:
            value = payload.get(key)
            if value is None:
                continue
            if not isinstance(value, list):
                cls._business_error(
                    message=f'{key} payload must be a list',
                )
            sections.update(
                cls._resolve_widget_sections_for_payload(
                    engagement_id=engagement_id,
                    payloads=value,
                    payload_name=key,
                )
            )

        return sections

    @classmethod
    def validate_engagement_content_translation_lock(  # pylint: disable=too-many-arguments
        cls,
        *,
        engagement_id: int,
        language_id: int,
        payload: dict[str, Any],
        lock_token: Optional[str],
        owner_user_sub: str,
    ) -> Optional[ResourceLock]:
        """Validate lock for engagement content translation sync requests."""
        if not cls.is_engagement_lock_validation_enabled():
            return None

        sections = cls._resolve_sections_for_content_translation_payload(
            engagement_id=engagement_id,
            payload=payload,
        )
        section = cls._resolve_single_section(
            sections=sections,
            allow_empty=True,
            multi_section_message='Payload spans multiple sections; submit one section per request for lock validation',
        )
        if section is None:
            return None

        return cls.validate_engagement_section_lock(
            engagement_id=engagement_id,
            section_key=section,
            language_id=language_id,
            lock_token=lock_token,
            owner_user_sub=owner_user_sub,
        )

    @classmethod
    def acquire_lock(  # pylint: disable=too-many-arguments,too-many-locals
        cls,
        *,
        resource_type: str,
        resource_id: int,
        section_key: Optional[str],
        language_id: Optional[int],
        owner_user_sub: str,
        owner_session_id: str,
        owner_display_name: Optional[str] = None,
        ttl_seconds: Optional[int] = None,
    ) -> dict[str, Any]:
        """Acquire or reacquire a lock for a scope."""
        if not resource_type or not isinstance(resource_type, str):
            cls._business_error(
                message='resource_type is required',
            )
        if not isinstance(resource_id, int) or resource_id <= 0:
            cls._business_error(
                message='resource_id must be a positive integer',
            )

        session_id = cls._validate_uuid(owner_session_id, 'owner_session_id')
        ttl = cls._get_ttl_seconds_or_default(ttl_seconds)
        now = utc_now()
        expires_at = now + timedelta(seconds=ttl)
        lock_scope = cls.build_scope_key(
            resource_type, resource_id, section_key, language_id)

        active = ResourceLock.find_active_by_scope(lock_scope)
        existing_lock_response = cls._handle_existing_lock_on_acquire(
            active=active,
            lock_scope=lock_scope,
            owner_user_sub=owner_user_sub,
            owner_session_id=session_id,
            now=now,
            expires_at=expires_at,
        )
        if existing_lock_response is not None:
            return existing_lock_response

        lock = ResourceLock(
            lock_scope=lock_scope,
            resource_type=resource_type,
            resource_id=resource_id,
            section_key=section_key,
            language_id=language_id,
            owner_user_sub=owner_user_sub,
            owner_display_name=owner_display_name,
            owner_session_id=session_id,
            lock_token=str(uuid4()),
            acquired_at=now,
            heartbeat_at=now,
            expires_at=expires_at,
            released_at=None,
            release_reason=None,
        )

        try:
            db.session.add(lock)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            conflict = ResourceLock.find_active_by_scope(lock_scope)
            if conflict and conflict.owner_user_sub == owner_user_sub and conflict.owner_session_id == session_id:
                return cls._serialize_lock(conflict, is_mine=True)
            cls._lock_error(
                code='lock_conflict',
                message='Resource section is locked by another editor',
                lock_scope=lock_scope,
                lock=conflict,
            )

        return cls._serialize_lock(lock, is_mine=True)

    @classmethod
    def _handle_existing_lock_on_acquire(  # pylint: disable=too-many-arguments
        cls,
        *,
        active: Optional[ResourceLock],
        lock_scope: str,
        owner_user_sub: str,
        owner_session_id: str,
        now,
        expires_at,
    ) -> Optional[dict[str, Any]]:
        if not active:
            return None

        if active.expires_at and active.expires_at > now:
            if active.owner_user_sub == owner_user_sub and active.owner_session_id == owner_session_id:
                active.heartbeat_at = now
                active.expires_at = expires_at
                active.commit()
                return cls._serialize_lock(active, is_mine=True)

            cls._lock_error(
                code='lock_conflict',
                message='Resource section is locked by another editor',
                lock_scope=lock_scope,
                lock=active,
            )

        # Active row exists but has expired. Release in-place, then create a new lock row.
        active.release_by_token(
            lock_token=active.lock_token, release_reason='expired_takeover')
        db.session.flush()
        return None

    @classmethod
    def refresh_lock(
        cls,
        *,
        lock_token: str,
        owner_user_sub: str,
        owner_session_id: str,
        ttl_seconds: Optional[int] = None,
    ) -> dict[str, Any]:
        """Refresh an active lock heartbeat and expiry."""
        token = cls._validate_uuid(lock_token, 'lock_token')
        session_id = cls._validate_uuid(owner_session_id, 'owner_session_id')
        ttl = cls._get_ttl_seconds_or_default(ttl_seconds)

        lock = ResourceLock.find_by_token(token)
        if not lock:
            cls._lock_error(
                code='lock_not_found',
                message='Lock token was not found',
                status_code=HTTPStatus.CONFLICT,
            )

        now = utc_now()
        if lock.released_at is not None:
            cls._lock_error(
                code='lock_not_found',
                message='Lock is no longer active',
                status_code=HTTPStatus.CONFLICT,
                lock_scope=lock.lock_scope,
            )

        if lock.owner_user_sub != owner_user_sub or lock.owner_session_id != session_id:
            cls._lock_error(
                code='lock_not_owner',
                message='Lock is owned by another session',
                lock_scope=lock.lock_scope,
                lock=lock,
            )

        if lock.expires_at <= now:
            lock.release_by_token(
                lock_token=lock.lock_token, release_reason='expired_takeover')
            cls._lock_error(
                code='lock_expired',
                message='Lock has expired',
                lock_scope=lock.lock_scope,
                status_code=HTTPStatus.CONFLICT,
            )

        lock.heartbeat_at = now
        lock.expires_at = now + timedelta(seconds=ttl)
        lock.commit()
        return cls._serialize_lock(lock, is_mine=True)

    @classmethod
    def release_lock(
        cls,
        *,
        lock_token: str,
        owner_user_sub: str,
        release_reason: str = 'explicit',
        allow_force_takeover: bool = False,
    ) -> dict[str, Any]:
        """Release a lock token. Idempotent for already-released locks."""
        token = cls._validate_uuid(lock_token, 'lock_token')
        lock = ResourceLock.find_by_token(token)

        if not lock:
            return cls._released_lock_response()

        if lock.released_at is not None:
            return cls._released_lock_response(lock)

        if lock.owner_user_sub != owner_user_sub and not allow_force_takeover:
            cls._lock_error(
                code='lock_not_owner',
                message='Lock is owned by another user',
                lock_scope=lock.lock_scope,
                lock=lock,
            )

        lock.release_by_token(
            lock_token=lock.lock_token, release_reason=release_reason)
        return cls._released_lock_response(lock)

    @classmethod
    def get_active_locks_for_resource(
        cls,
        *,
        resource_type: str,
        resource_id: int,
        requester_user_sub: Optional[str] = None,
        requester_session_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Return active, unexpired locks for a resource."""
        now = utc_now()
        locks = (
            ResourceLock.query.filter_by(
                resource_type=resource_type,
                resource_id=resource_id,
                released_at=None,
            )
            .filter(ResourceLock.expires_at > now)
            .all()
        )

        normalized_session_id = None
        if requester_session_id:
            try:
                normalized_session_id = str(UUID(requester_session_id))
            except (ValueError, TypeError):
                normalized_session_id = None

        def _is_mine(lock: ResourceLock) -> bool:
            same_session = normalized_session_id is None
            if not same_session:
                same_session = lock.owner_session_id == normalized_session_id

            if requester_user_sub is None:
                return False

            if lock.owner_user_sub != requester_user_sub:
                return False

            return same_session

        return {
            'resource_type': resource_type,
            'resource_id': resource_id,
            'locks': [
                cls._serialize_lock(
                    lock,
                    is_mine=_is_mine(lock),
                )
                for lock in locks
            ],
        }

    @classmethod
    def resolve_engagement_section_for_patch(cls, payload: dict[str, Any]) -> str:
        """Resolve canonical engagement section key for PATCH /engagements payload."""
        return cls._resolve_section_from_payload(
            payload=payload,
            ignored_fields=cls.PATCH_META_FIELDS,
            section_fields=cls.PATCH_SECTION_FIELDS,
            default_section=cls.SECTION_CONFIG_GENERAL,
        )

    @classmethod
    def validate_engagement_patch_lock(
        cls,
        *,
        engagement_id: int,
        payload: dict[str, Any],
        lock_token: Optional[str],
        owner_user_sub: str,
    ) -> Optional[ResourceLock]:
        """Validate lock token ownership/scope for PATCH /engagements."""
        expected_section = cls.resolve_engagement_section_for_patch(payload)
        return cls.validate_engagement_section_lock(
            engagement_id=engagement_id,
            section_key=expected_section,
            lock_token=lock_token,
            owner_user_sub=owner_user_sub,
            language_id=None,
        )

    @classmethod
    def is_engagement_lock_validation_enabled(cls) -> bool:
        """Feature flag gate for engagement lock enforcement."""
        if not has_app_context():
            return False

        return bool(current_app.config.get(cls.ENGAGEMENT_PATCH_VALIDATION_FLAG, False))

    @classmethod
    def _serialize_lock(cls, lock: ResourceLock, is_mine: bool = False) -> dict[str, Any]:
        return {
            'lock_token': str(lock.lock_token),
            'lock_scope': lock.lock_scope,
            'resource_type': lock.resource_type,
            'resource_id': lock.resource_id,
            'section_key': lock.section_key,
            'language_id': lock.language_id,
            'owner': {
                'user_sub': lock.owner_user_sub,
                'display_name': lock.owner_display_name,
            },
            'owner_session_id': str(lock.owner_session_id),
            'acquired_at': lock.acquired_at.isoformat() if lock.acquired_at else None,
            'heartbeat_at': lock.heartbeat_at.isoformat() if lock.heartbeat_at else None,
            'expires_at': lock.expires_at.isoformat() if lock.expires_at else None,
            'is_mine': is_mine,
        }
