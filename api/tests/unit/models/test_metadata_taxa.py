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
"""Tests for the Org model.

Test suite to ensure that the Engagement model routines are working as expected.
"""

from faker import Faker

from api.models.engagement_metadata import MetadataTaxon
from tests.utilities.factory_scenarios import TestEngagementMetadataTaxonInfo
from tests.utilities.factory_utils import factory_metadata_taxon_model, factory_tenant_model

fake = Faker()


def test_create_metadata_taxon(session):
    """Assert that a new metadata taxon can be created and retrieved."""
    taxon = factory_metadata_taxon_model()
    taxon.save()
    assert taxon.id is not None
    taxon_existing = MetadataTaxon.find_by_id(taxon.id)
    assert taxon.name == taxon_existing.name


def test_delete_taxon(session):
    """Assert that a taxon can be deleted."""
    tenant = factory_tenant_model()
    test_info = TestEngagementMetadataTaxonInfo
    taxon1 = factory_metadata_taxon_model(tenant.id, test_info.taxon1)
    taxon2 = factory_metadata_taxon_model(tenant.id, test_info.taxon2)
    taxon3 = factory_metadata_taxon_model(tenant.id, test_info.taxon3)
    assert taxon1.id is not None, 'Taxon 1 ID is missing'
    assert taxon2.id is not None, 'Taxon 2 ID is missing'
    assert taxon3.id is not None, 'Taxon 3 ID is missing'
    # Check initial order
    check_taxon_order(session, [taxon1, taxon2, taxon3], [1, 2, 3])
    taxon2.delete()
    check_taxon_order(session, [taxon1, taxon3], [1, 2])
    taxon1.delete()
    assert taxon3.position == 1, 'Taxon 3 should be in the only position'
    taxon3.delete()
    assert MetadataTaxon.query.get(
        taxon1.id) is None, 'The taxon should not exist'


def check_taxon_order(session, taxa, expected_order):
    """Assert the order of taxa using a helper function."""
    actual_order = [taxon.position for taxon in taxa]
    assert actual_order == expected_order, f'Taxon order is incorrect ({actual_order} != {expected_order})'


def test_move_taxon_to_position(session):
    """Assert that a taxon can be moved to a new position."""
    tenant = factory_tenant_model()
    test_info = TestEngagementMetadataTaxonInfo
    taxon1 = factory_metadata_taxon_model(tenant.id, test_info.taxon1)
    taxon2 = factory_metadata_taxon_model(tenant.id, test_info.taxon2)
    taxon3 = factory_metadata_taxon_model(tenant.id, test_info.taxon3)
    test_taxa = [taxon1, taxon2, taxon3]
    session.add_all(test_taxa)
    session.commit()
    assert all([taxon.id is not None for taxon in test_taxa]
               ), 'Taxon ID is missing'
    # Check initial order
    check_taxon_order(session, test_taxa, [1, 2, 3])
    taxon1.move_to_position(3)
    # Check that the array of positions reflects the order we expect
    check_taxon_order(session, test_taxa, [3, 1, 2])
    taxon2.move_to_position(3)
    check_taxon_order(session, test_taxa, [2, 3, 1])
    taxon1.move_to_position(1)
    check_taxon_order(session, test_taxa, [1, 3, 2])
    taxon2.move_to_position(2)
    check_taxon_order(session, test_taxa, [1, 2, 3])


def test_metadata_taxon_presets(session):
    """Assert that metadata taxon preset values can be edited."""
    taxon = factory_metadata_taxon_model()
    taxon.save()

    assert taxon.id is not None
    assert taxon.preset_values == []

    taxon.preset_values = [
        {
            'value': 'foo',
            'position': 1,
        },
        {
            'value': 'bar',
            'position': 2,
        },
        {
            'value': 'baz',
            'position': 3,
        },
    ]

    taxon_existing = MetadataTaxon.find_by_id(taxon.id)

    assert len(taxon_existing.preset_values) == 3
    assert taxon_existing.preset_values[0]['value'] == 'foo'
    assert taxon_existing.preset_values[1]['value'] == 'bar'
    assert taxon_existing.preset_values[2]['value'] == 'baz'

    foo_id = taxon_existing.preset_values[0]['id']
    baz_id = taxon_existing.preset_values[2]['id']

    taxon.preset_values = [
        {
            'id': foo_id,
            'value': 'foo',
            'position': 1,
        },
        {
            'id': baz_id,
            'value': 'baz',
            'position': 2,
        },
    ]

    taxon_existing = MetadataTaxon.find_by_id(taxon.id)

    assert len(taxon_existing.preset_values) == 2
    assert taxon_existing.preset_values[0]['value'] == 'foo'
    assert taxon_existing.preset_values[1]['value'] == 'baz'
