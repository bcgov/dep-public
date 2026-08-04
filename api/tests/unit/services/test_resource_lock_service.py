# Copyright © 2019 Province of British Columbia
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
"""Tests for ResourceLockService lock lifecycle behavior."""

from datetime import datetime, timedelta
from http import HTTPStatus
from uuid import uuid4

import pytest

from api.exceptions.business_exception import BusinessException
from api.models.resource_lock import ResourceLock
from api.services.resource_lock_service import ResourceLockService
from api.utils.datetime import utc_now


RESOURCE_TYPE = ResourceLockService.RESOURCE_TYPE_ENGAGEMENT_SECTION
SECTION_KEY = ResourceLockService.SECTION_AUTHORING_SUMMARY


def _create_lock_row(
    *,
    lock_scope: str,
    owner_user_sub: str,
    owner_session_id: str,
    resource_id: int = 1,
    section_key: str = SECTION_KEY,
    language_id: int = 1,
    acquired_delta_seconds: int = 0,
    expires_delta_seconds: int = 120,
) -> ResourceLock:
    """Persist a lock row for direct state setup in lifecycle tests."""
    now = utc_now()
    acquired_at = now + timedelta(seconds=acquired_delta_seconds)
    expires_at = now + timedelta(seconds=expires_delta_seconds)
    lock = ResourceLock(
        lock_scope=lock_scope,
        resource_type=RESOURCE_TYPE,
        resource_id=resource_id,
        section_key=section_key,
        language_id=language_id,
        owner_user_sub=owner_user_sub,
        owner_display_name='Tester',
        owner_session_id=owner_session_id,
        lock_token=str(uuid4()),
        acquired_at=acquired_at,
        heartbeat_at=acquired_at,
        expires_at=expires_at,
        released_at=None,
        release_reason=None,
    )
    lock.save()
    return lock


def test_acquire_lock_success(session):  # pylint:disable=unused-argument
    """Assert lock acquire creates an active lock row with expected scope."""
    owner_session_id = str(uuid4())

    response = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=101,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='user-1',
        owner_session_id=owner_session_id,
        owner_display_name='User One',
        ttl_seconds=120,
    )

    assert response.get('resource_type') == RESOURCE_TYPE
    assert response.get('resource_id') == 101
    assert response.get('section_key') == SECTION_KEY
    assert response.get('language_id') == 1
    assert response.get('is_mine') is True

    lock = ResourceLock.find_by_token(response.get('lock_token'))
    assert lock is not None
    assert lock.released_at is None
    assert lock.release_reason is None


def test_acquire_lock_reacquires_same_session(session):  # pylint:disable=unused-argument
    """Assert reacquiring by same owner/session reuses active lock token."""
    owner_session_id = str(uuid4())

    first = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=102,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='user-1',
        owner_session_id=owner_session_id,
        ttl_seconds=90,
    )
    second = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=102,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='user-1',
        owner_session_id=owner_session_id,
        ttl_seconds=180,
    )

    assert second.get('lock_token') == first.get('lock_token')
    assert datetime.fromisoformat(
        second['expires_at']) > datetime.fromisoformat(first['expires_at'])


def test_acquire_lock_conflict_different_owner(session):  # pylint:disable=unused-argument
    """Assert active lock blocks acquire by a different owner/session."""
    owner_session_id = str(uuid4())
    ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=103,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='user-1',
        owner_session_id=owner_session_id,
    )

    with pytest.raises(BusinessException) as excinfo:
        ResourceLockService.acquire_lock(
            resource_type=RESOURCE_TYPE,
            resource_id=103,
            section_key=SECTION_KEY,
            language_id=1,
            owner_user_sub='user-2',
            owner_session_id=str(uuid4()),
        )

    assert excinfo.value.status_code == HTTPStatus.LOCKED
    assert excinfo.value.error.get('code') == 'lock_conflict'


def test_acquire_lock_takes_over_expired_lock(session):  # pylint:disable=unused-argument
    """Assert acquire marks expired lock as taken over and creates a new lock."""
    scope = ResourceLockService.build_scope_key(
        RESOURCE_TYPE,
        104,
        SECTION_KEY,
        1,
    )
    expired_lock = _create_lock_row(
        lock_scope=scope,
        owner_user_sub='user-1',
        owner_session_id=str(uuid4()),
        resource_id=104,
        acquired_delta_seconds=-120,
        expires_delta_seconds=-60,
    )

    response = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=104,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='user-2',
        owner_session_id=str(uuid4()),
    )

    refreshed_expired = ResourceLock.find_by_id(expired_lock.id)
    assert refreshed_expired.released_at is not None
    assert refreshed_expired.release_reason == 'expired_takeover'
    assert response.get('lock_token') != str(expired_lock.lock_token)


def test_refresh_lock_success(session):  # pylint:disable=unused-argument
    """Assert refresh extends expiry for active owner/session lock."""
    owner_session_id = str(uuid4())
    acquired = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=105,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='user-1',
        owner_session_id=owner_session_id,
        ttl_seconds=90,
    )

    refreshed = ResourceLockService.refresh_lock(
        lock_token=acquired['lock_token'],
        owner_user_sub='user-1',
        owner_session_id=owner_session_id,
        ttl_seconds=180,
    )

    assert refreshed.get('lock_token') == acquired.get('lock_token')
    assert datetime.fromisoformat(
        refreshed['expires_at']) > datetime.fromisoformat(acquired['expires_at'])


def test_refresh_lock_expired_marks_released(session):  # pylint:disable=unused-argument
    """Assert refresh on expired lock fails and records expired takeover reason."""
    scope = ResourceLockService.build_scope_key(
        RESOURCE_TYPE,
        106,
        SECTION_KEY,
        1,
    )
    lock = _create_lock_row(
        lock_scope=scope,
        owner_user_sub='user-1',
        owner_session_id=str(uuid4()),
        resource_id=106,
        acquired_delta_seconds=-120,
        expires_delta_seconds=-10,
    )

    with pytest.raises(BusinessException) as excinfo:
        ResourceLockService.refresh_lock(
            lock_token=str(lock.lock_token),
            owner_user_sub='user-1',
            owner_session_id=str(lock.owner_session_id),
        )

    assert excinfo.value.status_code == HTTPStatus.CONFLICT
    assert excinfo.value.error.get('code') == 'lock_expired'

    lock_db = ResourceLock.find_by_id(lock.id)
    assert lock_db.released_at is not None
    assert lock_db.release_reason == 'expired_takeover'


def test_release_lock_owner_success(session):  # pylint:disable=unused-argument
    """Assert lock owner can release an active lock."""
    owner_session_id = str(uuid4())
    acquired = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=107,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='user-1',
        owner_session_id=owner_session_id,
    )

    released = ResourceLockService.release_lock(
        lock_token=acquired['lock_token'],
        owner_user_sub='user-1',
        release_reason='explicit',
    )

    assert released.get('released') is True
    assert released.get('released_at') is not None

    lock = ResourceLock.find_by_token(acquired['lock_token'])
    assert lock.released_at is not None
    assert lock.release_reason == 'explicit'


def test_release_lock_non_owner_requires_force_takeover(session):  # pylint:disable=unused-argument
    """Assert non-owner cannot release without force_takeover permission."""
    acquired = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=108,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='owner-user',
        owner_session_id=str(uuid4()),
    )

    with pytest.raises(BusinessException) as excinfo:
        ResourceLockService.release_lock(
            lock_token=acquired['lock_token'],
            owner_user_sub='other-user',
            release_reason='force_takeover',
            allow_force_takeover=False,
        )

    assert excinfo.value.status_code == HTTPStatus.LOCKED
    assert excinfo.value.error.get('code') == 'lock_not_owner'


def test_release_lock_force_takeover(session):  # pylint:disable=unused-argument
    """Assert force takeover release is allowed when explicitly enabled."""
    acquired = ResourceLockService.acquire_lock(
        resource_type=RESOURCE_TYPE,
        resource_id=109,
        section_key=SECTION_KEY,
        language_id=1,
        owner_user_sub='owner-user',
        owner_session_id=str(uuid4()),
    )

    released = ResourceLockService.release_lock(
        lock_token=acquired['lock_token'],
        owner_user_sub='other-user',
        release_reason='force_takeover',
        allow_force_takeover=True,
    )

    assert released.get('released') is True
    lock = ResourceLock.find_by_token(acquired['lock_token'])
    assert lock.release_reason == 'force_takeover'
