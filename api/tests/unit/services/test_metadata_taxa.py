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

"""Tests for the metadata taxon service."""

import pytest
from faker import Faker
from marshmallow import ValidationError

from api.models.engagement_metadata import MetadataTaxon
from api.services.engagement_metadata_service import EngagementMetadataService
from api.services.metadata_taxon_service import MetadataTaxonService
from tests.utilities.factory_scenarios import TestEngagementInfo, TestEngagementMetadataTaxonInfo
from tests.utilities.factory_utils import (
    factory_engagement_model, factory_metadata_taxon_model, factory_taxon_requirements)


fake = Faker()
engagement_metadata_service = EngagementMetadataService()


def test_create_taxon(session):
    """Assert that taxa can be created and retrieved by id."""
    tenant, _ = factory_taxon_requirements()
    taxon_service = MetadataTaxonService()
    taxon = taxon_service.create(tenant.id,
                                 TestEngagementMetadataTaxonInfo.taxon1)
    assert taxon.get('id') is not None
    taxon_existing = taxon_service.get_by_id(taxon['id'])
    assert taxon_existing is not None
    assert taxon['name'] == taxon_existing['name']


def test_insert_taxon(session):
    """Assert that created taxa are positioned correctly by inserting 2 taxa."""
    tenant, _ = factory_taxon_requirements()
    taxon_service = MetadataTaxonService()
    taxon1 = taxon_service.create(tenant.id,
                                  TestEngagementMetadataTaxonInfo.taxon1)
    assert taxon1.get('id') is not None
    taxon2 = taxon_service.create(tenant.id,
                                  TestEngagementMetadataTaxonInfo.taxon3)
    assert taxon2.get('id') is not None
    taxon2_existing = taxon_service.get_by_id(taxon2['id'])
    assert taxon2_existing is not None
    assert taxon2['name'] == taxon2_existing['name']
    taxon1_existing = taxon_service.get_by_id(taxon1['id'])
    assert taxon1_existing is not None
    assert taxon1['name'] == taxon1_existing['name']
    assert taxon1['position'] == 1
    assert taxon2['position'] == 2


def test_get_by_tenant(session):
    """Assert that all taxa for a tenant can be retrieved."""
    tenant, _ = factory_taxon_requirements()
    taxon_service = MetadataTaxonService()
    # Create multiple taxa for the tenant
    taxon1 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.taxon1)
    taxon2 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.taxon2)
    # Retrieve taxa for tenant and assert
    tenant_taxa = taxon_service.get_by_tenant(tenant.id)
    assert taxon1 in tenant_taxa and taxon2 in tenant_taxa


def test_get_by_id(session):
    """Assert that taxa can be retrieved by id."""
    tenant, _ = factory_taxon_requirements()
    taxon_service = MetadataTaxonService()
    taxon = factory_metadata_taxon_model(tenant.id)
    assert taxon.id is not None
    taxon_existing = taxon_service.get_by_id(taxon.id)
    assert taxon_existing is not None
    assert taxon.name == taxon_existing['name']


def test_update_taxon(session):
    """Assert that taxa can be updated."""
    taxon_service = MetadataTaxonService()
    tenant, _ = factory_taxon_requirements()
    taxon = taxon_service.create(tenant.id,
                                 TestEngagementMetadataTaxonInfo.taxon1)
    assert taxon.get('id') is not None
    taxon_existing = taxon_service.get_by_id(taxon['id'])
    assert taxon_existing is not None
    assert taxon['name'] == taxon_existing['name']
    taxon['name'] = 'Updated Taxon'
    taxon_updated = taxon_service.update(taxon['id'], taxon)
    assert taxon_updated['name'] == 'Updated Taxon'


@pytest.mark.parametrize('field,value', [
    ('name', 'Updated required taxon'),
    ('data_type', 'long_text'),
])
def test_update_required_taxon_rejects_name_and_data_type_changes(session, field, value):
    """Assert that required taxa cannot change their name or data type."""
    tenant, _ = factory_taxon_requirements()
    taxon = factory_metadata_taxon_model(tenant.id)
    taxon.is_required = True
    session.commit()

    with pytest.raises(ValidationError):
        MetadataTaxonService.update(taxon.id, {field: value})


@pytest.mark.parametrize('field,value', [
    ('name', 'Updated regular taxon'),
    ('data_type', 'long_text'),
])
def test_update_regular_taxon_allows_name_and_data_type_changes(session, field, value):
    """Assert that regular taxa can change their name and data type."""
    tenant, _ = factory_taxon_requirements()
    taxon = factory_metadata_taxon_model(tenant.id)

    updated_taxon = MetadataTaxonService.update(taxon.id, {field: value})

    assert updated_taxon[field] == value


def test_modify_presets(session):
    """Assert that taxon preset values can be updated."""
    taxon_service = MetadataTaxonService()
    tenant, _ = factory_taxon_requirements()
    taxon = taxon_service.create(tenant.id,
                                 TestEngagementMetadataTaxonInfo.taxon1)
    assert taxon.get('id') is not None
    assert taxon['preset_values'] == []
    taxon_existing = taxon_service.get_by_id(taxon['id'])
    assert taxon_existing is not None
    assert taxon['preset_values'] == taxon_existing['preset_values']
    taxon['preset_values'] = ['foo', 'bar', 'baz']
    taxon_updated = taxon_service.update(
        taxon['id'], {'preset_values': ['foo', 'bar', 'baz']})
    assert taxon_updated['preset_values'] == ['foo', 'bar', 'baz']
    taxon['preset_values'] = ['foo', 'baz']
    taxon_updated = taxon_service.update(
        taxon['id'], {'preset_values': ['foo', 'baz']})
    assert taxon_updated['preset_values'] == ['foo', 'baz']


def test_delete_taxon(session):
    """Assert that taxa can be deleted."""
    taxon_service = MetadataTaxonService()
    tenant, _ = factory_taxon_requirements()
    taxon = factory_metadata_taxon_model(tenant.id)
    assert taxon.id is not None
    taxon_service.delete(taxon.id)
    taxon_existing = taxon_service.get_by_id(taxon.id)
    assert taxon_existing is None


def test_delete_required_taxon_is_rejected(session):
    """Assert that a required taxon cannot be deleted."""
    tenant, _ = factory_taxon_requirements()
    taxon = factory_metadata_taxon_model(tenant.id)
    taxon.is_required = True
    session.commit()

    with pytest.raises(ValueError, match='Cannot delete required taxon'):
        MetadataTaxonService.delete(taxon.id)

    assert MetadataTaxonService.get_by_id(taxon.id) is not None


def test_reorder_tenant(session):
    """Assert that taxa can be reordered within a tenant."""
    tenant, _ = factory_taxon_requirements()
    taxon_service = MetadataTaxonService()
    # Create multiple taxa
    taxon1 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.taxon2)
    taxon2 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.taxon1)
    assert taxon1['position'] == 1 and taxon2['position'] == 2
    # Reorder taxa
    new_order = [taxon2['id'], taxon1['id']]
    updated_taxa = taxon_service.reorder_tenant(tenant.id, new_order)
    # Assert new order
    assert updated_taxa[0]['id'] == taxon2['id'] and updated_taxa[0]['position'] == 1
    assert updated_taxa[1]['id'] == taxon1['id'] and updated_taxa[1]['position'] == 2


def test_auto_order_tenant(session):
    """Assert that taxa positions are automatically ordered correctly."""
    tenant, _ = factory_taxon_requirements()
    taxon_service = MetadataTaxonService()
    # Create multiple taxa
    for i in range(10):
        gap_position = fake.random_int(min=2, max=9)
        taxon = factory_metadata_taxon_model(tenant.id)
        position = fake.random_int(min=1, max=9)
        # hacky way to guarantee at least 1 duplicate position, and a random gap
        # the idea is to generate invalid data for the auto_order_tenant function to fix
        if position == gap_position:
            position = 10
        taxon.position = position
    tenant_taxa = taxon_service.auto_order_tenant(tenant.id)
    # Assert new order
    for i in range(10):
        # Every number appears once
        assert tenant_taxa[i]['position'] == i + 1


def test_get_filters(session):
    """Assert that taxon filters are correctly retrieved."""
    tenant, _ = factory_taxon_requirements()
    taxon_service = MetadataTaxonService()
    engagement = factory_engagement_model({**TestEngagementInfo.engagement1,
                                           'tenant_id': tenant.id})
    # Create multiple taxa...
    # Unfilterable taxon - this should not appear in the filters
    taxon1 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.taxon1)
    # Includes freeform values, filter type is 'chips_all'
    taxon2 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.filterable_taxon1)
    # Does not include freeform values, filter type is 'chips_all'
    taxon3 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.filterable_taxon2)
    # Does not include freeform values, filter type is 'chips_any'
    taxon4 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.filterable_taxon3)
    # Includes freeform values, filter type is 'chips_any'
    taxon5 = taxon_service.create(
        tenant.id, TestEngagementMetadataTaxonInfo.filterable_taxon4)
    # en.wikipedia.org/wiki/Metasyntactic_variable
    # Create metadata for engagements - these should only appear in the filters
    # if include_freeform is set on the taxon
    engagement_metadata_service.create(engagement.id, taxon1['id'], 'foo')
    engagement_metadata_service.create(engagement.id, taxon2['id'], 'bar')
    engagement_metadata_service.create(engagement.id, taxon3['id'], 'baz')
    engagement_metadata_service.create(engagement.id, taxon4['id'], 'qux')
    engagement_metadata_service.create(engagement.id, taxon5['id'], 'quux')
    # Preset values - these should appear on filterable taxa no matter what
    MetadataTaxon.query.get(taxon2['id']).preset_values = ['grault']
    MetadataTaxon.query.get(taxon3['id']).preset_values = ['garply']
    MetadataTaxon.query.get(taxon4['id']).preset_values = ['waldo']
    MetadataTaxon.query.get(taxon5['id']).preset_values = ['fred']
    # Get filters
    filters = taxon_service.get_filter_options(tenant.id)
    assert len(filters) == 4  # out of 5, only 4 should be filterable
    assert filters[0]['taxon_id'] == taxon2['id']
    assert filters[0]['name'] == taxon2['name']
    assert filters[0]['filter_type'] == taxon2['filter_type']
    assert len(filters[0]['values']) == 2
    assert 'grault' in filters[0]['values']
    assert 'bar' in filters[0]['values']

    assert filters[1]['taxon_id'] == taxon3['id']
    assert filters[1]['name'] == taxon3['name']
    assert filters[1]['filter_type'] == taxon3['filter_type']
    assert filters[1]['values'] == ['garply']

    assert filters[2]['taxon_id'] == taxon4['id']
    assert filters[2]['name'] == taxon4['name']
    assert filters[2]['filter_type'] == taxon4['filter_type']
    assert filters[2]['values'] == ['waldo']

    assert filters[3]['taxon_id'] == taxon5['id']
    assert filters[3]['name'] == taxon5['name']
    assert filters[3]['filter_type'] == taxon5['filter_type']
    assert len(filters[3]['values']) == 2
    assert 'fred' in filters[3]['values']
    assert 'quux' in filters[3]['values']
