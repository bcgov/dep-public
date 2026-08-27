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

"""Tests to verify the Engagement settings API end-point.

Test-Suite to ensure that the Engagement settings API endpoint
is working as expected.
"""
import json
from http import HTTPStatus
from unittest.mock import patch

import pytest
from faker import Faker
from marshmallow import ValidationError

from api.constants.engagement_status import Status
from api.services.engagement_settings_service import EngagementSettingsService
from api.utils.enums import ContentType
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_model, factory_engagement_setting_model)


fake = Faker()


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_get_engagement_settings(client, jwt, session, side_effect, expected_status,
                                 setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that engagement settings can be fetched."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    engagement_settings = factory_engagement_setting_model(engagement.id)

    headers = factory_auth_header(jwt=jwt, claims=claims)

    rv = client.get(
        f'/api/engagementsettings/{engagement.id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK
    response_data = rv.json
    assert response_data.get('send_report') == engagement_settings.send_report

    with patch.object(EngagementSettingsService, 'get', side_effect=side_effect):
        rv = client.get(
            f'/api/engagementsettings/{engagement.id}',
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == expected_status


def test_get_engagement_settings_for_draft_engagement(client, jwt, session,
                                                      setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that a draft engagement setting can not be fetched without authorization."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model(status=Status.Draft)
    factory_engagement_setting_model(engagement.id)

    headers = factory_auth_header(jwt=jwt, claims=claims)

    rv = client.get(
        f'/api/engagementsettings/{engagement.id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK, 'User with proper role is able to fetch the data.'

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.public_user_role)

    rv = client.get(
        f'/api/engagementsettings/{engagement.id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.FORBIDDEN, \
        'User without role should not be able to fetch draft engagement settings.'


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
def test_patch_engagement_settings(client, jwt, session, side_effect, expected_status,
                                   setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that engagement settings can be PATCHed."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model(status=Status.Draft)
    factory_engagement_setting_model(engagement.id)

    headers = factory_auth_header(jwt=jwt, claims=claims)

    rv = client.get(
        f'/api/engagementsettings/{engagement.id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK

    patch_data = {
        'send_report': True,
        'engagement_id': engagement.id
    }

    rv = client.patch(
        '/api/engagementsettings/',
        data=json.dumps(patch_data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK
    response_data = rv.json
    assert response_data.get('send_report') == patch_data.get('send_report')

    with patch.object(EngagementSettingsService, 'update_settings', side_effect=side_effect):
        rv = client.patch(
            '/api/engagementsettings/',
            data=json.dumps(patch_data),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == expected_status

    with patch.object(EngagementSettingsService, 'update_settings', side_effect=ValidationError('Test error')):
        rv = client.patch(
            '/api/engagementsettings/',
            data=json.dumps(patch_data),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
