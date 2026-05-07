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
"""Tests for the Widget service.

Test suite to ensure that the Widget service routines are working as expected.
"""

from faker import Faker

from api.constants.widget import WidgetType
from api.schemas.widget_item import WidgetItemSchema
from api.services.widget_service import WidgetService
from tests.utilities.factory_scenarios import TestJwtClaims, TestUserInfo, TestWidgetInfo, TestWidgetItemInfo
from tests.utilities.factory_utils import (
    factory_engagement_model, factory_staff_user_model, factory_user_group_membership_model, factory_widget_item_model,
    factory_widget_model, patch_token_info, set_global_tenant)


fake = Faker()
date_format = '%Y-%m-%d'


def test_create_widget(session, monkeypatch):  # pylint:disable=unused-argument
    """Assert that a widget can be created."""
    engagement = factory_engagement_model()

    widget_to_create = {
        'engagement_id': engagement.id,
        'widget_type_id': WidgetType.WHO_IS_LISTENING.value,
        'location': 1,
    }
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    widget_record = WidgetService().create_widget(widget_to_create, engagement.id)

    # Assert that was created
    assert widget_record.get('engagement_id') == widget_to_create.get('engagement_id')
    assert widget_record.get('widget_type_id') == widget_to_create.get('widget_type_id')


def test_create_widget_items(session):  # pylint:disable=unused-argument
    """Assert that widget items can be created in bulk."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    user_id = TestUserInfo.user['id']

    widget_item_to_create_1 = {
        'widget_id': widget.id,
        'widget_data_id': fake.pyint()
    }

    widget_item_to_create_2 = {
        'widget_id': widget.id,
        'widget_data_id': fake.pyint()
    }

    widget_item_records = WidgetService()\
        .create_widget_items_bulk(
            [widget_item_to_create_1, widget_item_to_create_2],
            user_id)

    # Assert that was created
    assert len(widget_item_records) == 2
    assert widget_item_records[0].get('widget_id') == widget_item_to_create_1.get('widget_id')
    assert widget_item_records[0].get('widget_data_id') == widget_item_to_create_1.get('widget_data_id')
    assert widget_item_records[1].get('widget_id') == widget_item_to_create_2.get('widget_id')
    assert widget_item_records[1].get('widget_data_id') == widget_item_to_create_2.get('widget_data_id')


def test_delete_removed_widget_items(session):  # pylint:disable=unused-argument
    """Assert that widget items can be created in bulk."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    widget_item = factory_widget_item_model({
        **TestWidgetItemInfo.widget_item1,
        'widget_id': widget.id
    })

    widget_items_remaining = []
    widget_items_in_db = [widget_item]
    widget_items_deleted = WidgetService()\
        .delete_removed_widget_items(
            widget_items_remaining,
            widget_items_in_db
    )

    # Assert that the saved widget item was deleted
    assert len(widget_items_deleted) == 1


def test_create_added_widget_items(session):  # pylint:disable=unused-argument
    """Assert that widget items can be created in bulk."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    user_id = TestUserInfo.user['id']

    widget_items_to_be_added = [{
        'widget_id': widget.id,
        'widget_data_id': TestWidgetItemInfo.widget_item1['widget_data_id']
    }]
    widget_items_in_db = []
    widget_items_added = WidgetService()\
        .create_added_widget_items(
            widget_items_to_be_added,
            widget_items_in_db,
            user_id
    )

    # Assert that was created
    assert len(widget_items_added) == 1


def test_update_widget_items_sorting(session):  # pylint:disable=unused-argument
    """Assert that widget items can be created in bulk."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    user_id = TestUserInfo.user['id']

    widget_item_1 = factory_widget_item_model({
        **TestWidgetItemInfo.widget_item1,
        'widget_id': widget.id,
        'sort_index': 1
    })
    widget_item_2 = factory_widget_item_model({
        **TestWidgetItemInfo.widget_item2,
        'widget_id': widget.id,
        'sort_index': 2
    })

    widget_items_resorted = WidgetItemSchema(many=True).dump([widget_item_2, widget_item_1])
    WidgetService().update_widget_items_sorting(
        widget_items_resorted,
        widget.id,
        user_id
    )

    widget_items = WidgetService.get_widget_items_by_widget_id(widget.id)

    widget_item_1_db = next((
        widget_item for widget_item in widget_items
        if widget_item.get('id') == widget_item_1.id
    ), None)

    widget_item_2_db = next((
        widget_item for widget_item in widget_items
        if widget_item.get('id') == widget_item_2.id
    ), None)

    # Assert that widget items were resorted
    assert len(widget_items) == 2
    assert widget_item_1_db.get('sort_index') == 2
    assert widget_item_2_db.get('sort_index') == 1
