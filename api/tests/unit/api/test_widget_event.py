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

"""Tests to verify the Widget Event API end-point.

Test-Suite to ensure that the Widget Event API endpoint is working as expected.
"""
import json

from http import HTTPStatus
from faker import Faker
from unittest.mock import patch

from api.utils.enums import ContentType
from api.constants.event_types import EventTypes
from api.exceptions.business_exception import BusinessException
from api.services.widget_events_service import WidgetEventsService
from tests.utilities.factory_scenarios import TestEventInfo, TestJwtClaims, TestWidgetInfo
from tests.utilities.factory_utils import factory_auth_header, factory_engagement_model, factory_widget_model


fake = Faker()


def test_create_events(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that widget events can be POSTed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    event_info = TestEventInfo.event_meetup
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    data = {
        **event_info,
        'widget_id': widget.id,
    }

    rv = client.post(
        f'/api/widgets/{widget.id}/events',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value
    assert rv.json.get('title') == event_info.get('title')
    response_event_items = rv.json.get('event_items')
    assert len(response_event_items) == 1
    assert response_event_items[0].get('description') == event_info.get('items')[0].get('description')

    with patch.object(WidgetEventsService, 'create_event',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.BAD_REQUEST)):
        rv = client.post(
            f'/api/widgets/{widget.id}/events',
            data=json.dumps(data),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.BAD_REQUEST


def test_widget_events_sort(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that a widget events can be sorted."""
    engagement = factory_engagement_model()
    event_widget_info_1 = TestWidgetInfo.widget1
    event_widget_info_1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    event_info = TestEventInfo.event_openhouse
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)
    data = {
        **event_info,
        'widget_id': widget.id,
    }
    rv = client.post(
        f'/api/widgets/{widget.id}/events',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value

    event_info = TestEventInfo.event_virtual
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)
    data = {
        **event_info,
        'widget_id': widget.id,
    }
    rv = client.post(
        f'/api/widgets/{widget.id}/events',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value

    rv = client.get(
        f'/api/widgets/{widget.id}/events',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value
    assert len(rv.json) == 2, 'Two Widget Events Should exist.'
    widget_events = rv.json
    open_house_event = _find_widget_events(widget_events, EventTypes.OPENHOUSE)
    assert open_house_event.get('sort_index') == 1

    virtual_event = _find_widget_events(widget_events, EventTypes.VIRTUAL)
    assert virtual_event.get('sort_index') == 2

    # Do reorder

    reorder_dict = [
        {
            'id': virtual_event.get('id'),
        },
        {
            'id': open_house_event.get('id'),
        }
    ]
    rv = client.patch(
        f'/api/widgets/{widget.id}/events/sort_index',
        data=json.dumps(reorder_dict),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value

    rv = client.get(
        f'/api/widgets/{widget.id}/events',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    widget_events = rv.json
    open_house_event = _find_widget_events(widget_events, EventTypes.OPENHOUSE)
    assert open_house_event.get('sort_index') == 2

    virtual_event = _find_widget_events(widget_events, EventTypes.VIRTUAL)
    assert virtual_event.get('sort_index') == 1

    with patch.object(WidgetEventsService, 'save_widget_events_bulk',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.BAD_REQUEST)):
        rv = client.patch(
            f'/api/widgets/{widget.id}/events/sort_index',
            data=json.dumps(reorder_dict),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.BAD_REQUEST


def _find_widget_events(widget_events, widget_event_type):
    _widget_event_type = next(x for x in widget_events if x.get('type') == widget_event_type.name)
    return _widget_event_type


def test_delete_events(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that widget events can be deleted."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    event_info = TestEventInfo.event_meetup
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    data = {
        **event_info,
        'widget_id': widget.id,
    }

    rv = client.post(
        f'/api/widgets/{widget.id}/events',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value

    event_id = rv.json.get('id')
    rv = client.delete(
        f'/api/widgets/{widget.id}/events/{event_id}',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value

    with patch.object(WidgetEventsService, 'delete_event',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.BAD_REQUEST)):
        rv = client.delete(
            f'/api/widgets/{widget.id}/events/{event_id}',
            data=json.dumps(data),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.BAD_REQUEST


def test_patch_events(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that widget events can be PATCHed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    event_info = TestEventInfo.event_meetup
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    data = {
        **event_info,
        'widget_id': widget.id,
    }

    rv = client.post(
        f'/api/widgets/{widget.id}/events',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value
    response_event_items = rv.json.get('event_items')
    item_id = response_event_items[0].get('id')
    event_id = rv.json.get('id')

    event_edits = {
        'description': fake.text(max_nb_chars=20),
        'start_date': fake.date()
    }

    rv = client.patch(
        f'/api/widgets/{widget.id}/events/{event_id}/item/{item_id}',
        data=json.dumps(event_edits),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value

    rv = client.get(
        f'/api/widgets/{widget.id}/events',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK.value
    event_items = rv.json[0].get('event_items', [])
    description_value = event_items[0].get('description')
    assert description_value == event_edits.get('description')

    with patch.object(WidgetEventsService, 'update_event_item',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.BAD_REQUEST)):
        rv = client.patch(
            f'/api/widgets/{widget.id}/events/{event_id}/item/{item_id}',
            data=json.dumps(event_edits),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.BAD_REQUEST
