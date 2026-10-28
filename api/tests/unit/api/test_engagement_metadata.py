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

"""Tests for the Engagement Metadata endpoints."""

import json
from http import HTTPStatus
from faker import Faker
from api.utils.enums import ContentType
from api.services.engagement_metadata_service import EngagementMetadataService
from api.services.metadata_taxon_service import MetadataTaxonService
from tests.utilities.factory_scenarios import TestEngagementMetadataInfo, TestJwtClaims, TestTenantInfo
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_metadata_model, factory_metadata_requirements, factory_metadata_taxon_model,
    factory_tenant_model)


fake = Faker()

engagement_metadata_service = EngagementMetadataService()
metadata_taxon_service = MetadataTaxonService()


def test_get_engagement_metadata(client, jwt, session):
    """Test that metadata can be retrieved by engagement id."""
    taxon, engagement, _, headers = factory_metadata_requirements(jwt)
    assert engagement and engagement.id is not None
    assert taxon and taxon.id is not None
    metadata = factory_engagement_metadata_model({
        'engagement_id': engagement.id,
        'taxon_id': taxon.id,
        'value': fake.sentence(),
    })
    existing_metadata = engagement_metadata_service.get_by_engagement(
        engagement.id)
    assert existing_metadata is not None
    response = client.get(f'/api/engagements/{engagement.id}/metadata',
                          headers=headers, content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.OK
    metadata_list = response.json
    assert len(metadata_list) == 1
    assert metadata_list[0]['id'] == metadata.id
    assert metadata_list[0]['engagement_id'] == metadata.engagement_id


def test_add_engagement_metadata(client, jwt, session):
    """Test that metadata can be added to an engagement."""
    taxon, engagement, _, headers = factory_metadata_requirements(jwt)
    data = {
        'taxon_id': taxon.id,
        'value': fake.sentence(),
    }
    response = client.post(f'/api/engagements/{engagement.id}/metadata',
                           headers=headers,
                           data=json.dumps(data),
                           content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.CREATED
    assert response.json.get('id') is not None
    assert response.json.get('value') == data['value']
    assert response.json.get('engagement_id') == engagement.id


def test_add_engagement_metadata_invalid_engagement(client, jwt, session):
    """Test that metadata cannot be added to an invalid engagement."""
    taxon, engagement, _, headers = factory_metadata_requirements(jwt)
    data = {'taxon_id': taxon.id, 'value': fake.sentence()}
    response = client.post(f'/api/engagements/{engagement.id + 1}/metadata',
                           headers=headers,
                           data=json.dumps(data),
                           content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.NOT_FOUND, (f'Wrong response code; '
                                                          f'HTTP {response.status_code} -> {response.text}')


def test_add_engagement_metadata_invalid_tenant(client, jwt, session):
    """Test that metadata cannot be added to an engagement in another tenant."""
    _, engagement, tenant, headers = factory_metadata_requirements(jwt)
    # create a second tenant to test with
    tenant2 = factory_tenant_model(TestTenantInfo.tenant2)
    assert tenant2.id != tenant.id
    taxon = factory_metadata_taxon_model(tenant2.id)
    data = {'taxon_id': taxon.id, 'value': fake.sentence()}
    response = client.post(f'/api/engagements/{engagement.id}/metadata',
                           headers=headers,
                           data=json.dumps(data),
                           content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.BAD_REQUEST, (f'Wrong response code; '
                                                            f'HTTP {response.status_code} -> {response.text}')


def test_add_engagement_metadata_invalid_user(client, jwt, session):
    """Test that metadata cannot be added by an unauthorized user."""
    taxon, engagement, _, _ = factory_metadata_requirements(jwt)
    headers = factory_auth_header(jwt, claims=TestJwtClaims.no_role)
    metadata_info = TestEngagementMetadataInfo.metadata1
    metadata_info['taxon_id'] = taxon.id
    response = client.post(f'/api/engagements/{engagement.id}/metadata',
                           headers=headers,
                           data=json.dumps(metadata_info),
                           content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.FORBIDDEN


def test_update_engagement_metadata(client, jwt, session):
    """Test that metadata values can be updated."""
    taxon, engagement, _, headers = factory_metadata_requirements(jwt)
    metadata = factory_engagement_metadata_model({
        'taxon_id': taxon.id,
        'engagement_id': engagement.id,
        'value': 'old value'
    })
    response = client.patch(f'/api/engagements/{engagement.id}/metadata/{metadata.id}',
                            headers=headers,
                            data=json.dumps({'value': 'new value'}),
                            content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.OK, (f'Wrong response code; '
                                                   f'HTTP {response.status_code} -> {response.text}')
    assert response.json is not None
    assert response.json.get('id') == metadata.id
    assert response.json.get('engagement_id') == engagement.id
    assert response.json.get('value') == 'new value'

    # Test if Metadata does not belong to the engagement
    engagement_id = fake.pyint()
    response = client.get(f'/api/engagements/{engagement_id}/metadata/{metadata.id}',
                          headers=headers,
                          content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.BAD_REQUEST


def test_bulk_update_engagement_metadata(client, jwt, session):
    """Test that metadata values can be updated in bulk."""
    taxon, engagement, _, headers = factory_metadata_requirements(jwt)

    existing_metadata = [
        factory_engagement_metadata_model({
            'engagement_id': engagement.id,
            'taxon_id': taxon.id,
            'value': f'old value {i}',
            'position': i + 1,
        })
        for i in range(4)
    ]

    response = client.patch(
        f'/api/engagements/{engagement.id}/metadata',
        headers=headers,
        data=json.dumps({
            'taxon_id': taxon.id,
            'values': [
                {
                    'id': existing_metadata[i].id,
                    'value': f'new value {i}',
                    'position': i + 1,
                }
                for i in range(3)
            ],
        }),
        content_type=ContentType.JSON.value,
    )

    assert response.status_code == HTTPStatus.OK, (
        f'Wrong response code; HTTP {response.status_code} -> {response.text}'
    )
    assert response.json is not None
    assert len(response.json) == 3

    updated_metadata = EngagementMetadataService().get_by_engagement(
        engagement.id,
        taxon_id=taxon.id,
    )

    response = client.patch(
        f'/api/engagements/{engagement.id}/metadata',
        headers=headers,
        data=json.dumps({
            'taxon_id': taxon.id,
            'values': [
                {
                    'id': updated_metadata[i]['id'],
                    'value': f'newer value {i}',
                    'position': i + 1,
                }
                for i in range(3)
            ] + [
                {
                    'value': f'newer value {i}',
                    'position': i + 1,
                }
                for i in range(3, 5)
            ],
        }),
        content_type=ContentType.JSON.value,
    )

    assert response.status_code == HTTPStatus.OK, (
        f'Wrong response code; HTTP {response.status_code} -> {response.text}'
    )
    assert response.json is not None
    assert len(response.json) == 5

    assert all(
        meta['value'] == f'newer value {i}'
        for i, meta in enumerate(response.json)
    )

    assert len(
        EngagementMetadataService().get_by_engagement(
            engagement.id,
            taxon_id=taxon.id,
        )
    ) == 5


def test_delete_engagement_metadata(client, jwt, session):
    """Test that metadata can be deleted."""
    taxon, engagement, _, headers = factory_metadata_requirements(jwt)
    metadata = factory_engagement_metadata_model({
        'engagement_id': engagement.id,
        'taxon_id': taxon.id,
        'value': fake.sentence(),
    })
    response = client.delete(f'/api/engagements/{engagement.id}/metadata/{metadata.id}',
                             headers=headers,
                             content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.NO_CONTENT, (f'Wrong response code; '
                                                           f'HTTP {response.status_code} -> {response.text}')


def test_get_engagement_metadata_by_id(client, jwt, session):
    """Test that metadata can be fetched by id."""
    taxon, engagement, _, headers = factory_metadata_requirements(jwt)
    metadata = factory_engagement_metadata_model({
        'engagement_id': engagement.id,
        'taxon_id': taxon.id,
        'value': fake.sentence(),
    })
    response = client.get(f'/api/engagements/{engagement.id}/metadata/{metadata.id}',
                          headers=headers,
                          content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.OK, (f'Wrong response code; '
                                                   f'HTTP {response.status_code} -> {response.text}')

    # Test if Metadata does not belong to the engagement
    engagement_id = fake.pyint()
    response = client.get(f'/api/engagements/{engagement_id}/metadata/{metadata.id}',
                          headers=headers,
                          content_type=ContentType.JSON.value)
    assert response.status_code == HTTPStatus.BAD_REQUEST
