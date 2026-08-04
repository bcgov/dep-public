# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for resource lock API endpoints."""

# pylint: disable=unused-argument

import json
from http import HTTPStatus
from unittest.mock import patch

from api.exceptions.business_exception import BusinessException
from api.services.resource_lock_service import ResourceLockService
from api.utils.enums import ContentType
from tests.utilities.factory_utils import factory_auth_header


def test_acquire_lock_post_success(client, jwt, session, setup_admin_user_and_claims):
    """Assert acquire POST returns service response and passes expected args."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {
        'resource_type': ResourceLockService.RESOURCE_TYPE_ENGAGEMENT_SECTION,
        'resource_id': 123,
        'section_key': ResourceLockService.SECTION_AUTHORING_SUMMARY,
        'language_id': None,
        'owner_session_id': 'session-1',
        'owner_display_name': 'Tester',
        'ttl_seconds': 60,
    }
    expected = {
        'lock_token': 'token-1',
        'is_locked_by_current_session': True,
    }

    with patch.object(ResourceLockService, 'acquire_lock', return_value=expected) as acquire_mock:
        rv = client.post(
            '/api/locks/acquire',
            data=json.dumps(payload),
            headers=headers,
            content_type=ContentType.JSON.value,
        )

    assert rv.status_code == HTTPStatus.OK
    assert rv.get_json() == expected
    acquire_mock.assert_called_once_with(
        resource_type=payload['resource_type'],
        resource_id=payload['resource_id'],
        section_key=payload['section_key'],
        language_id=payload['language_id'],
        owner_user_sub=claims['sub'],
        owner_session_id=payload['owner_session_id'],
        owner_display_name=payload['owner_display_name'],
        ttl_seconds=payload['ttl_seconds'],
    )


def test_refresh_lock_post_success(client, jwt, session, setup_admin_user_and_claims):
    """Assert refresh POST returns service response and passes expected args."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {
        'lock_token': 'token-1',
        'owner_session_id': 'session-1',
        'ttl_seconds': 120,
    }
    expected = {
        'lock_token': payload['lock_token'],
        'is_locked_by_current_session': True,
    }

    with patch.object(ResourceLockService, 'refresh_lock', return_value=expected) as refresh_mock:
        rv = client.post(
            '/api/locks/refresh',
            data=json.dumps(payload),
            headers=headers,
            content_type=ContentType.JSON.value,
        )

    assert rv.status_code == HTTPStatus.OK
    assert rv.get_json() == expected
    refresh_mock.assert_called_once_with(
        lock_token=payload['lock_token'],
        owner_user_sub=claims['sub'],
        owner_session_id=payload['owner_session_id'],
        ttl_seconds=payload['ttl_seconds'],
    )


def test_release_lock_post_success_default_reason(client, jwt, session, setup_admin_user_and_claims):
    """Assert release POST defaults release_reason to explicit for non-super-admin."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {
        'lock_token': 'token-1',
    }
    expected = {
        'lock_token': payload['lock_token'],
        'is_locked': False,
    }

    with patch('api.resources.resource_lock.authorization.check_auth', return_value=False):
        with patch.object(ResourceLockService, 'release_lock', return_value=expected) as release_mock:
            rv = client.post(
                '/api/locks/release',
                data=json.dumps(payload),
                headers=headers,
                content_type=ContentType.JSON.value,
            )

    assert rv.status_code == HTTPStatus.OK
    assert rv.get_json() == expected
    release_mock.assert_called_once_with(
        lock_token=payload['lock_token'],
        owner_user_sub=claims['sub'],
        release_reason='explicit',
        allow_force_takeover=False,
    )


def test_release_lock_post_force_takeover_forbidden(
    client,
    jwt,
    session,
    setup_admin_user_and_claims,
):
    """Assert force_takeover release requires super-admin role."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {
        'lock_token': 'token-1',
        'release_reason': 'force_takeover',
    }

    with patch('api.resources.resource_lock.authorization.check_auth', return_value=False):
        with patch.object(ResourceLockService, 'release_lock') as release_mock:
            rv = client.post(
                '/api/locks/release',
                data=json.dumps(payload),
                headers=headers,
                content_type=ContentType.JSON.value,
            )

    assert rv.status_code == HTTPStatus.FORBIDDEN
    assert rv.get_json() == {
        'code': 'forbidden',
        'message': 'force_takeover release requires super admin privileges',
    }
    release_mock.assert_not_called()


def test_acquire_lock_post_business_exception(client, jwt, session, setup_admin_user_and_claims):
    """Assert acquire POST returns BusinessException payload/status."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {
        'resource_type': ResourceLockService.RESOURCE_TYPE_ENGAGEMENT_SECTION,
        'resource_id': 123,
        'section_key': ResourceLockService.SECTION_AUTHORING_SUMMARY,
    }

    with patch.object(
        ResourceLockService,
        'acquire_lock',
        side_effect=BusinessException(
            error={'code': 'lock_conflict', 'message': 'already locked'},
            status_code=HTTPStatus.CONFLICT,
        ),
    ):
        rv = client.post(
            '/api/locks/acquire',
            data=json.dumps(payload),
            headers=headers,
            content_type=ContentType.JSON.value,
        )

    assert rv.status_code == HTTPStatus.CONFLICT
    assert rv.get_json() == {
        'code': 'lock_conflict',
        'message': 'already locked',
    }


def test_refresh_lock_post_business_exception(client, jwt, session, setup_admin_user_and_claims):
    """Assert refresh POST returns BusinessException payload/status."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {
        'lock_token': 'token-1',
        'owner_session_id': 'session-1',
    }

    with patch.object(
        ResourceLockService,
        'refresh_lock',
        side_effect=BusinessException(
            error={'code': 'lock_expired', 'message': 'lock has expired'},
            status_code=HTTPStatus.CONFLICT,
        ),
    ):
        rv = client.post(
            '/api/locks/refresh',
            data=json.dumps(payload),
            headers=headers,
            content_type=ContentType.JSON.value,
        )

    assert rv.status_code == HTTPStatus.CONFLICT
    assert rv.get_json() == {
        'code': 'lock_expired',
        'message': 'lock has expired',
    }


def test_release_lock_post_business_exception(client, jwt, session, setup_admin_user_and_claims):
    """Assert release POST returns BusinessException payload/status."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    payload = {
        'lock_token': 'token-1',
    }

    with patch('api.resources.resource_lock.authorization.check_auth', return_value=False):
        with patch.object(
            ResourceLockService,
            'release_lock',
            side_effect=BusinessException(
                error={'code': 'not_owner', 'message': 'not lock owner'},
                status_code=HTTPStatus.FORBIDDEN,
            ),
        ):
            rv = client.post(
                '/api/locks/release',
                data=json.dumps(payload),
                headers=headers,
                content_type=ContentType.JSON.value,
            )

    assert rv.status_code == HTTPStatus.FORBIDDEN
    assert rv.get_json() == {
        'code': 'not_owner',
        'message': 'not lock owner',
    }
