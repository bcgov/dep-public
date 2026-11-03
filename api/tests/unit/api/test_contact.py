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

"""Tests to verify the Contact API end-point.

Test-Suite to ensure that the Contact endpoint is working as expected.
"""
import json
from http import HTTPStatus

from faker import Faker
from marshmallow import ValidationError
from unittest.mock import patch
import pytest

from api.services.contact_service import ContactService
from api.utils.enums import ContentType
from tests.utilities.factory_scenarios import TestContactInfo, TestJwtClaims
from tests.utilities.factory_utils import factory_auth_header


fake = Faker()


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
@pytest.mark.parametrize('contact_info', [TestContactInfo.contact1])
def test_create_contact(client, jwt, session, contact_info, side_effect,
                        expected_status):  # pylint:disable=unused-argument
    """Assert that a contact can be POSTed."""
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)
    rv = client.post('/api/contacts/', data=json.dumps(contact_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('name') == contact_info.get('name')
    assert rv.json.get('title') == contact_info.get('title')
    assert rv.json.get('phone_number') == contact_info.get('phone_number')
    assert rv.json.get('email') == contact_info.get('email')
    assert rv.json.get('address') == contact_info.get('address')
    assert rv.json.get('bio') == contact_info.get('bio')

    with patch.object(ContactService, 'create_contact', side_effect=side_effect):
        rv = client.post('/api/contacts/', data=json.dumps(contact_info),
                         headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status

    with patch.object(ContactService, 'create_contact', side_effect=ValidationError('Test error')):
        rv = client.post('/api/contacts/', data=json.dumps(contact_info),
                         headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
@pytest.mark.parametrize('contact_info', [TestContactInfo.contact1])
def test_get_contact(client, jwt, session, contact_info, side_effect,
                     expected_status):  # pylint:disable=unused-argument
    """Assert that a contact can be fetched."""
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)
    rv = client.post('/api/contacts/', data=json.dumps(contact_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    rv = client.get('/api/contacts/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json[0].get('name') == contact_info.get('name')

    with patch.object(ContactService, 'get_contacts', side_effect=side_effect):
        rv = client.get('/api/contacts/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
@pytest.mark.parametrize('contact_info', [TestContactInfo.contact1])
def test_patch_contact(client, jwt, session, contact_info, side_effect,
                       expected_status):  # pylint:disable=unused-argument
    """Assert that a contact can be PATCHed."""
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)
    rv = client.post('/api/contacts/', data=json.dumps(contact_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    rv = client.get('/api/contacts/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json[0].get('name') == contact_info.get('name')

    contact_edits = {
        'id': rv.json[0].get('id'),
        'name': fake.name(),
        'title': fake.job()[:50],
    }

    rv = client.patch('/api/contacts/', data=json.dumps(contact_edits),
                      headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK

    rv = client.get('/api/contacts/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json[0].get('name') == contact_edits.get('name')

    with patch.object(ContactService, 'update_contact', side_effect=side_effect):
        rv = client.patch('/api/contacts/', data=json.dumps(contact_edits),
                          headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status

    with patch.object(ContactService, 'update_contact', side_effect=ValidationError('Test error')):
        rv = client.patch('/api/contacts/', data=json.dumps(contact_edits),
                          headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


@pytest.mark.parametrize('side_effect, expected_status', [
    (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
])
@pytest.mark.parametrize('contact_info', [TestContactInfo.contact1])
def test_get_contact_by_id(client, jwt, session, contact_info, side_effect,
                           expected_status):  # pylint:disable=unused-argument
    """Assert that a contact can be POSTed."""
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)
    rv = client.post('/api/contacts/', data=json.dumps(contact_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    contact_id = rv.json.get('id')
    name = rv.json.get('name')

    rv = client.get(f'/api/contacts/{contact_id}', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('name') == name

    with patch.object(ContactService, 'get_contact_by_id', side_effect=side_effect):
        rv = client.get(f'/api/contacts/{contact_id}', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == expected_status
