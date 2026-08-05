# Copyright © 2026 Province of British Columbia
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

"""Unit tests for translation lock validation decorators."""

# pylint: disable=unused-argument

from http import HTTPStatus
from unittest.mock import patch

from flask import Flask, g

from api.exceptions.business_exception import BusinessException
from api.resources.lock_validation_decorators import (
    require_engagement_content_translation_lock, require_widget_translation_lock, require_widget_translation_lock_by_id)
from api.services.resource_lock_service import ResourceLockService


def test_require_engagement_content_translation_lock_success():
    """Assert decorator validates lock and forwards request payload/user context."""
    app = Flask(__name__)
    payload = {'details_tabs': [{'id': 1}], 'widgets': []}

    @require_engagement_content_translation_lock()
    def handler(engagement_id, language_id):
        return {
            'payload': g.engagement_content_translation_payload,
            'user_id': g.lock_validation_user_id,
            'engagement_id': engagement_id,
            'language_id': language_id,
        }, HTTPStatus.OK

    with app.test_request_context(
        '/resource',
        method='PUT',
        json=payload,
        headers={ResourceLockService.LOCK_HEADER_NAME: 'lock-token-1'},
    ):
        with patch('api.resources.lock_validation_decorators.TokenInfo.get_id', return_value='user-1'):
            with patch.object(
                ResourceLockService,
                'validate_engagement_content_translation_lock',
            ) as validate_mock:
                response, status = handler(engagement_id=10, language_id=49)

    assert status == HTTPStatus.OK
    assert response['payload'] == payload
    assert response['user_id'] == 'user-1'
    assert response['engagement_id'] == 10
    assert response['language_id'] == 49
    validate_mock.assert_called_once_with(
        engagement_id=10,
        language_id=49,
        payload=payload,
        lock_token='lock-token-1',
        owner_user_sub='user-1',
    )


def test_require_engagement_content_translation_lock_business_exception():
    """Assert decorator wraps lock errors with message envelope by default."""
    app = Flask(__name__)

    @require_engagement_content_translation_lock()
    def handler(engagement_id, language_id):
        return {'ok': True}, HTTPStatus.OK

    with app.test_request_context(
        '/resource',
        method='PUT',
        json={'widgets': []},
        headers={ResourceLockService.LOCK_HEADER_NAME: 'lock-token-1'},
    ):
        with patch('api.resources.lock_validation_decorators.TokenInfo.get_id', return_value='user-1'):
            with patch.object(
                ResourceLockService,
                'validate_engagement_content_translation_lock',
                side_effect=BusinessException(
                    error={'code': 'lock_conflict', 'message': 'locked'},
                    status_code=HTTPStatus.CONFLICT,
                ),
            ):
                response, status = handler(engagement_id=10, language_id=49)

    assert status == HTTPStatus.CONFLICT
    assert response == {'message': {
        'code': 'lock_conflict', 'message': 'locked'}}


def test_require_widget_translation_lock_success():
    """Assert decorator validates widget lock using language_id from payload."""
    app = Flask(__name__)

    @require_widget_translation_lock()
    def handler(widget_id):
        return {
            'widget_id': widget_id,
            'user_id': g.lock_validation_user_id,
            'language_id': g.lock_validation_language_id,
        }, HTTPStatus.OK

    with app.test_request_context(
        '/resource',
        method='POST',
        json={'language_id': '49'},
        headers={ResourceLockService.LOCK_HEADER_NAME: 'lock-token-1'},
    ):
        with patch('api.resources.lock_validation_decorators.TokenInfo.get_id', return_value='user-1'):
            with patch.object(ResourceLockService, 'validate_widget_translation_lock') as validate_mock:
                response, status = handler(widget_id=33)

    assert status == HTTPStatus.OK
    assert response['widget_id'] == 33
    assert response['user_id'] == 'user-1'
    assert response['language_id'] == 49
    validate_mock.assert_called_once_with(
        widget_id=33,
        language_id=49,
        lock_token='lock-token-1',
        owner_user_sub='user-1',
    )


def test_require_widget_translation_lock_requires_language_id():
    """Assert decorator rejects missing/invalid language_id."""
    app = Flask(__name__)

    @require_widget_translation_lock()
    def handler(widget_id):
        return {'widget_id': widget_id}, HTTPStatus.OK

    with app.test_request_context('/resource', method='POST', json={}, headers={}):
        response, status = handler(widget_id=33)

    assert status == HTTPStatus.BAD_REQUEST
    assert response == 'language_id is required'


def test_require_widget_translation_lock_business_exception():
    """Assert decorator returns raw business error payload for widget create lock errors."""
    app = Flask(__name__)

    @require_widget_translation_lock()
    def handler(widget_id):
        return {'widget_id': widget_id}, HTTPStatus.OK

    with app.test_request_context(
        '/resource',
        method='POST',
        json={'language_id': 49},
        headers={ResourceLockService.LOCK_HEADER_NAME: 'lock-token-1'},
    ):
        with patch('api.resources.lock_validation_decorators.TokenInfo.get_id', return_value='user-1'):
            with patch.object(
                ResourceLockService,
                'validate_widget_translation_lock',
                side_effect=BusinessException(
                    error={'code': 'lock_conflict', 'message': 'locked'},
                    status_code=HTTPStatus.CONFLICT,
                ),
            ):
                response, status = handler(widget_id=33)

    assert status == HTTPStatus.CONFLICT
    assert response == {'code': 'lock_conflict', 'message': 'locked'}


def test_require_widget_translation_lock_by_id_success():
    """Assert decorator validates lock for update/delete operations by translation id."""
    app = Flask(__name__)

    @require_widget_translation_lock_by_id()
    def handler(widget_id, widget_translation_id):
        return {
            'widget_id': widget_id,
            'widget_translation_id': widget_translation_id,
            'user_id': g.lock_validation_user_id,
        }, HTTPStatus.OK

    with app.test_request_context(
        '/resource',
        method='PATCH',
        headers={ResourceLockService.LOCK_HEADER_NAME: 'lock-token-1'},
    ):
        with patch('api.resources.lock_validation_decorators.TokenInfo.get_id', return_value='user-1'):
            with patch.object(ResourceLockService, 'validate_widget_translation_lock_by_id') as validate_mock:
                response, status = handler(
                    widget_id=33, widget_translation_id=77)

    assert status == HTTPStatus.OK
    assert response['widget_id'] == 33
    assert response['widget_translation_id'] == 77
    assert response['user_id'] == 'user-1'
    validate_mock.assert_called_once_with(
        widget_id=33,
        widget_translation_id=77,
        lock_token='lock-token-1',
        owner_user_sub='user-1',
    )


def test_require_widget_translation_lock_by_id_business_exception():
    """Assert decorator returns raw business error payload for update/delete lock errors."""
    app = Flask(__name__)

    @require_widget_translation_lock_by_id()
    def handler(widget_id, widget_translation_id):
        return {'widget_id': widget_id, 'widget_translation_id': widget_translation_id}, HTTPStatus.OK

    with app.test_request_context(
        '/resource',
        method='DELETE',
        headers={ResourceLockService.LOCK_HEADER_NAME: 'lock-token-1'},
    ):
        with patch('api.resources.lock_validation_decorators.TokenInfo.get_id', return_value='user-1'):
            with patch.object(
                ResourceLockService,
                'validate_widget_translation_lock_by_id',
                side_effect=BusinessException(
                    error={'code': 'forbidden', 'message': 'not lock owner'},
                    status_code=HTTPStatus.FORBIDDEN,
                ),
            ):
                response, status = handler(
                    widget_id=33, widget_translation_id=77)

    assert status == HTTPStatus.FORBIDDEN
    assert response == {'code': 'forbidden', 'message': 'not lock owner'}
