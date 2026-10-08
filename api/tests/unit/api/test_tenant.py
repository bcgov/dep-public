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

"""Tests to verify the tenant API end-point.

Test-Suite to ensure that the tenant endpoint is working as expected.
"""
import json
from http import HTTPStatus
from unittest.mock import patch

import pytest

from api.models.tenant import Tenant
from api.services.metadata_taxon_service import MetadataTaxonService
from api.services.tenant_service import TenantService
from api.utils.enums import ContentType
from tests.utilities.factory_scenarios import TestJwtClaims, TestTenantInfo
from tests.utilities.factory_utils import factory_auth_header, factory_tenant_model


def test_get_tenant(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that a tenant can be fetched."""
    claims = TestJwtClaims.public_user_role

    tenant_data = TestTenantInfo.tenant1
    factory_tenant_model(tenant_data)
    tenant_short_name = tenant_data['short_name']

    headers = factory_auth_header(jwt=jwt, claims=claims)
    rv = client.get(f'/api/tenants/{tenant_short_name}', headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK.value
    assert rv.json.get('name') == tenant_data['name']

    with patch.object(TenantService, 'get', side_effect=ValueError('Test error')):
        rv = client.get(f'/api/tenants/{tenant_short_name}',
                        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


@pytest.mark.parametrize('tenant_info', [TestTenantInfo.tenant1])
def test_create_tenant(client, jwt, session, tenant_info, setup_super_admin_user_and_claims):
    """Assert that a tenant can be POSTed."""
    _, claims = setup_super_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    # remove header image url from tenant_info
    tenant_info.pop('hero_image_url')
    rv = client.post('/api/tenants/', data=json.dumps(tenant_info),
                     headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.CREATED
    assert rv.json.get('short_name') == tenant_info.get('short_name')
    assert rv.json.get('name') == tenant_info.get('name')
    assert rv.json.get('contact_name') == tenant_info.get('contact_name')
    assert rv.json.get('contact_email') == tenant_info.get('contact_email')
    assert rv.json.get('title') == tenant_info.get('title')
    tenant = Tenant.query.filter_by(short_name=tenant_info['short_name']).one()
    taxa = MetadataTaxonService.get_by_tenant(tenant.id)
    assert {taxon['name']: taxon['data_type'] for taxon in taxa} == {
        'Region': 'geo_area',
        'Category': 'text',
    }
    assert all(taxon['is_required'] for taxon in taxa)


@pytest.mark.parametrize('tenant_info', [TestTenantInfo.tenant1])
def test_get_tenants(client, jwt, session, tenant_info, setup_super_admin_user_and_claims):
    """Assert that tenants can be fetched."""
    _, claims = setup_super_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    factory_tenant_model(tenant_info)

    rv = client.get('/api/tenants/', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert len(rv.json) > 1
    tenant_short_names = [tenant.get('short_name') for tenant in rv.json]
    # Check if the tenant with short_name exists in the response
    assert tenant_info.get('short_name') in tenant_short_names


@pytest.mark.parametrize('tenant_info', [TestTenantInfo.tenant1])
def test_patch_tenant(client, jwt, session, tenant_info, setup_super_admin_user_and_claims):
    """Assert that a tenant can be PATCHed."""
    _, claims = setup_super_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant = factory_tenant_model(tenant_info)

    rv = client.get(f'/api/tenants/{tenant.short_name}', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('short_name') == tenant_info.get('short_name')

    tenant_edits = {
        'name': 'Example Inc',
        'title': 'Example Title',
    }

    rv = client.patch(f'/api/tenants/{tenant.short_name}', data=json.dumps(tenant_edits),
                      headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    rv = client.get(f'/api/tenants/{tenant.short_name}', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('name') == tenant_edits.get('name')


@pytest.mark.parametrize('tenant_info', [TestTenantInfo.tenant1])
def test_delete_tenant(client, jwt, session, tenant_info, setup_super_admin_user_and_claims):
    """Assert that a tenant can be deleted."""
    _, claims = setup_super_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant = factory_tenant_model(tenant_info)

    rv = client.delete(f'/api/tenants/{tenant.short_name}', headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
