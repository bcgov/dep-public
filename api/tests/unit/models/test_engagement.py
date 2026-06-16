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
import pytest

from api.constants.engagement_status import Status
from api.models import db
from api.models.engagement_metadata import EngagementMetadata
from api.models.engagement import Engagement as EngagementModel
from api.models.engagement_scope_options import EngagementScopeOptions
from api.models.pagination_options import PaginationOptions
from tests.utilities.factory_utils import factory_engagement_model, factory_metadata_taxon_model
from tests.utilities.factory_scenarios import TestEngagementInfo


fake = Faker()


def test_engagement(session):
    """Assert that an engagement can be created and fetched."""
    eng = factory_engagement_model()
    assert eng.id is not None
    eng_existing = EngagementModel.find_by_id(eng.id)
    assert eng.name == eng_existing.name


def test_get_engagements_paginated_name_search(session):
    """Assert that an engagement can be created and fetched."""
    eng = factory_engagement_model()
    for _ in range(0, 10):
        factory_engagement_model()

    external_user_id = 123
    pagination_options = PaginationOptions(
        page=None,
        size=None,
        sort_key='name',
        sort_order=''
    )
    scope_options = EngagementScopeOptions(
        restricted=False,
        include_assigned=False,
        engagement_status_ids=None
    )
    search_options = {
        'search_text': eng.name,
        'created_from_date': None,
        'created_to_date': None,
        'published_from_date': None,
        'published_to_date': None,
    }

    # verify name search
    result, count = EngagementModel.get_engagements_paginated(
        external_user_id,
        pagination_options,
        scope_options,
        search_options
    )
    assert eng.name == result[0].name
    assert count == 1  # Name search brings up only search result


def test_get_engagements_paginated_status_search(session):
    """Assert that an engagement can be created and fetched."""
    for _ in range(0, 11):
        factory_engagement_model()

    external_user_id = 123
    pagination_options = PaginationOptions(
        page=None,
        size=None,
        sort_key='name',
        sort_order=''
    )
    scope_options = EngagementScopeOptions(
        restricted=False,
        include_assigned=False,
        engagement_status_ids=None
    )
    search_options = {
        'search_text': '',
        'created_from_date': None,
        'created_to_date': None,
        'published_from_date': None,
        'published_to_date': None,
    }

    # status search
    factory_engagement_model(status=Status.Closed.value)
    factory_engagement_model(status=Status.Closed.value)
    result, count = EngagementModel.get_engagements_paginated(
        external_user_id,
        pagination_options,
        scope_options,
        {
            **search_options,
            'engagement_status': [Status.Closed.value],
        }
    )
    assert count == 2

    result, count = EngagementModel.get_engagements_paginated(
        external_user_id,
        pagination_options,
        scope_options,
        {
            **search_options,
            'engagement_status': [Status.Published.value],
        }
    )
    assert count == 11
    assert len(result) == 11

    result, count = EngagementModel.get_engagements_paginated(
        external_user_id,
        pagination_options,
        scope_options,
        {
            **search_options,
            'engagement_status': [Status.Published.value, Status.Closed.value],
        }
    )
    assert count == 13
    assert len(result) == 13

    # pass in pagination options and do the count
    pagination_options = PaginationOptions(
        page=1,
        size=2,
        sort_key='name',
        sort_order=''
    )

    result, count = EngagementModel.get_engagements_paginated(
        external_user_id,
        pagination_options,
        scope_options,
        {
            **search_options,
            'engagement_status': [Status.Published.value, Status.Closed.value],
        }
    )
    assert count == 13
    assert len(result) == 2


def test_get_engagements_metadata_match_all(session):
    """Assert that engagements can be looked up by metadata (match all)."""
    engagements = [factory_engagement_model({
        **TestEngagementInfo.engagement1,
        'tenant_id': 1,
        'slug': f"{TestEngagementInfo.engagement1['slug']}-{i}"
    }) for i in range(0, 10)]
    taxon = factory_metadata_taxon_model(1, {
        'name': 'Category',
        'description': 'Category description',
        'data_type': 'text',
        'position': 1,
        'freeform': False,
        'filter_type': 'chips_all',
    })

    # Use deterministic "noise" so we don't collide with the search values
    for eng in engagements:
        eng.metadata.append(EngagementMetadata(
            taxon_id=taxon.id, value='noise'))

    # give alternating engagements the value we will search for
    needle = 'test_metadata_search'
    for i in range(0, len(engagements), 2):
        engagements[i].metadata.append(EngagementMetadata(
            taxon_id=taxon.id, value=needle))

    session.flush()

    external_user_id = 123
    pagination_options = PaginationOptions(
        page=None, size=None, sort_key='name', sort_order='')
    scope_options = EngagementScopeOptions(restricted=False)
    search_options = {
        'metadata': [{
            'taxon_id': taxon.id,
            'filter_type': 'chips_all',
            'values': [needle]
        }]
    }

    def refresh_engagements():
        return EngagementModel.get_engagements_paginated(
            external_user_id,
            pagination_options,
            scope_options,
            search_options
        )
    # search for metadata
    _, count = refresh_engagements()
    assert count == 5

    engagements[1].metadata.append(EngagementMetadata(
        taxon_id=taxon.id, value=needle))
    session.flush()
    _, count = refresh_engagements()
    assert count == 6

    second = 'test2'
    search_options['metadata'][0]['values'] = [needle, second]
    _, count = refresh_engagements()
    # This should find *all* matching values, so the inclusion of a non-matching
    # value "test2" should reduce the result to 0
    assert count == 0

    engagements[0].metadata.append(EngagementMetadata(
        taxon_id=taxon.id, value=second))
    session.flush()
    _, count = refresh_engagements()

    # There should now be a single engagement with both "test" and "test2"
    assert count == 1


def test_get_engagements_metadata_match_any(session):
    """Assert that engagements can be looked up by metadata (match any)."""
    engagements = [factory_engagement_model({
        **TestEngagementInfo.engagement1,
        'tenant_id': 1,
        'slug': f"{TestEngagementInfo.engagement1['slug']}-{i}"
    }) for i in range(0, 10)]
    taxon = factory_metadata_taxon_model(1, {
        'name': 'Category',
        'description': 'Category description',
        'data_type': 'text',
        'position': 1,
        'freeform': False,
        'filter_type': 'chips_any',
    })
    # give every engagement some random metadata
    for eng in engagements:
        eng.metadata.append(EngagementMetadata(
            taxon_id=taxon.id, value=fake.word()))
    # give every *other* engagement a value we will search for
    for eng in range(0, len(engagements), 2):
        engagements[eng].metadata.append(EngagementMetadata(
            taxon_id=taxon.id, value='test'))

    external_user_id = 123
    pagination_options = PaginationOptions(
        page=None,
        size=None,
        sort_key='name',
        sort_order=''
    )
    scope_options = EngagementScopeOptions(
        restricted=False,
        include_assigned=False,
        engagement_status_ids=None
    )
    search_options = {
        'metadata': [
            {
                'taxon_id': taxon.id,
                'filter_type': 'chips_any',
                'values': ['test']
            }
        ]
    }

    def refresh_engagements():
        return EngagementModel.get_engagements_paginated(
            external_user_id,
            pagination_options,
            scope_options,
            search_options
        )
    # search for metadata
    _, count = refresh_engagements()
    assert count == 5

    engagements[1].metadata.append(EngagementMetadata(
        taxon_id=taxon.id, value='test'))
    _, count = refresh_engagements()
    assert count == 6

    search_options['metadata'][0]['values'] = ['test', 'test2']
    _, count = refresh_engagements()
    # This should find *any* matching value, so the inclusion of a non-matching
    # value "test2" should not change the result
    assert count == 6


def test_delete_engagement_success(session):
    """Assert that delete removes the engagement and returns the deleted instance."""
    engagement = factory_engagement_model()
    db.session.add(engagement)
    db.session.commit()
    engagement_id = engagement.id

    found = EngagementModel.find_by_id(engagement_id)
    assert found is not None

    deleted = EngagementModel.delete_engagement(engagement_id)

    assert deleted is not None
    assert deleted.id == engagement_id

    assert EngagementModel.find_by_id(engagement_id) is None


def test_delete_engagement_not_found_raises(session):
    """Assert that delete_engagement raises ValueError if the engagement does not exist."""
    non_existent_id = 999999

    with pytest.raises(ValueError) as excinfo:
        EngagementModel.delete_engagement(non_existent_id)

    assert str(excinfo.value) == 'Engagement not found.'
