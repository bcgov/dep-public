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
"""Test suite for the Engagement Metadata service."""

from faker import Faker

from api.services.engagement_metadata_service import EngagementMetadataService
from tests.utilities.factory_scenarios import TestEngagementMetadataInfo
from tests.utilities.factory_utils import factory_engagement_metadata_model, factory_metadata_requirements

fake = Faker()
engagement_metadata_service = EngagementMetadataService()

TAXON_ID_INCORRECT_MSG = 'Taxon ID is incorrect'
ENGAGEMENT_ID_INCORRECT_MSG = 'Engagement ID is incorrect or missing'


def test_get_engagement_metadata(session):
    """Assert that engagement metadata can be retrieved by engagement id."""
    taxon, engagement, _, _ = factory_metadata_requirements()
    assert engagement.id is not None
    assert taxon.id is not None
    eng_meta: dict = engagement_metadata_service.create(
        taxon_id=taxon.id, engagement_id=engagement.id,
        value=TestEngagementMetadataInfo.metadata1['value']
    )
    existing_metadata = engagement_metadata_service.get_by_engagement(
        engagement.id)
    assert any(meta['id'] == eng_meta['id'] for meta in existing_metadata)


def test_get_engagement_metadata_by_id(session):
    """Assert that engagement metadata can be retrieved by id."""
    taxon, engagement, _, _ = factory_metadata_requirements()
    assert engagement.id is not None
    assert taxon.id is not None
    eng_meta: dict = engagement_metadata_service.create(
        taxon_id=taxon.id, engagement_id=engagement.id,
        value=TestEngagementMetadataInfo.metadata1['value']
    )
    existing_metadata = engagement_metadata_service.get(eng_meta['id'])
    assert existing_metadata.get(
        'id') == eng_meta['id'], ENGAGEMENT_ID_INCORRECT_MSG
    assert existing_metadata.get(
        'taxon_id') == taxon.id, TAXON_ID_INCORRECT_MSG


def test_create_engagement_metadata(session):
    """Assert that engagement metadata can be created."""
    taxon, engagement, _, _ = factory_metadata_requirements()
    assert taxon.id is not None, 'Taxon ID is missing'
    assert engagement.id is not None, 'Engagement ID is missing'
    eng_meta: dict = engagement_metadata_service.create(
        engagement_id=engagement.id, taxon_id=taxon.id,
        value=TestEngagementMetadataInfo.metadata1['value'],
    )
    assert eng_meta.get('id') is not None, ENGAGEMENT_ID_INCORRECT_MSG
    assert eng_meta.get('taxon_id') == taxon.id, TAXON_ID_INCORRECT_MSG
    existing_metadata = engagement_metadata_service.get(eng_meta['id'])
    assert existing_metadata.get(
        'id') == eng_meta['id'], ENGAGEMENT_ID_INCORRECT_MSG
    assert existing_metadata.get(
        'taxon_id') == taxon.id, TAXON_ID_INCORRECT_MSG


def test_update_engagement_metadata(session):
    """Assert that engagement metadata can be updated."""
    new_value = 'new value'
    old_value = 'old value'
    taxon, engagement, _, _ = factory_metadata_requirements()
    assert engagement.id is not None
    assert taxon.id is not None
    eng_meta = factory_engagement_metadata_model({
        'engagement_id': engagement.id,
        'taxon_id': taxon.id,
        'value': old_value
    })
    existing_metadata = engagement_metadata_service.get_by_engagement(
        engagement.id)
    assert existing_metadata
    metadata_updated = engagement_metadata_service.update(
        eng_meta.id, new_value)
    assert metadata_updated['value'] == new_value
    existing_metadata2 = engagement_metadata_service.get_by_engagement(
        engagement.id)
    assert any(meta['value'] == new_value for meta in existing_metadata2)


def test_bulk_update_engagement_metadata(session):
    """Assert that engagement metadata can be updated in bulk."""
    taxon, engagement, _, _ = factory_metadata_requirements()

    created_metadata = [
        factory_engagement_metadata_model({
            'engagement_id': engagement.id,
            'taxon_id': taxon.id,
            'value': f'old value {i}',
            'position': i + 1,
        })
        for i in range(4)
    ]

    existing_metadata = engagement_metadata_service.get_by_engagement(
        engagement.id
    )

    # The initial data is created with 4 metadata entries
    assert len(existing_metadata) == 4

    new_values = [
        {
            'id': created_metadata[i].id,
            'value': f'new value {i}',
            'position': i + 1,
        }
        for i in range(3)
    ]

    metadata_updated = engagement_metadata_service.update_by_taxon(
        engagement.id,
        taxon.id,
        new_values,
    )

    # and that the values were updated
    assert len(metadata_updated) == 3

    for i, meta in enumerate(metadata_updated):
        assert meta['value'] == f'new value {i}'

    new_values_2 = [
        {
            'id': metadata_updated[i]['id'],
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
    ]

    metadata_updated_2 = engagement_metadata_service.update_by_taxon(
        engagement.id,
        taxon.id,
        new_values_2,
    )

    # and the values should be updated again
    assert len(metadata_updated_2) == 5

    for i, meta in enumerate(metadata_updated_2):
        assert meta['value'] == f'newer value {i}', (
            f'{meta}, newer value {i}'
        )


def test_delete_engagement_metadata(session):
    """Assert that engagement metadata can be deleted."""
    taxon, engagement, _, _ = factory_metadata_requirements()
    eng_meta = factory_engagement_metadata_model({
        'engagement_id': engagement.id,
        'taxon_id': taxon.id,
    })
    existing_metadata = engagement_metadata_service.get_by_engagement(
        engagement.id)
    assert any(em['id'] == eng_meta.id for em in existing_metadata)
    engagement_metadata_service.delete(eng_meta.id)
    existing_metadata = engagement_metadata_service.get_by_engagement(
        engagement.id)
    assert not any(em['id'] == eng_meta.id for em in existing_metadata)
