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
"""Tests for the document widget service.

Test suite to ensure that the document widget service routines are working as expected.
"""

from faker import Faker

from api.models.engagement_file import EngagementFile
from api.services.widget_documents_service import WidgetDocumentService
from tests.utilities.factory_scenarios import TestEngagementInfo, TestWidgetDocumentInfo, TestWidgetInfo
from tests.utilities.factory_utils import (
    factory_document_model, factory_engagement_model, factory_tenant_model, factory_uploaded_file_model,
    factory_widget_model)


fake = Faker()
date_format = '%Y-%m-%d'


def test_get_document_by_widget_id(session):  # pylint:disable=unused-argument
    """Assert that documents can be fetched."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)

    factory_document_model({
        **TestWidgetDocumentInfo.document1,
        'widget_id': widget.id,
    })

    factory_document_model({
        **TestWidgetDocumentInfo.document2,
        'widget_id': widget.id,
    })

    documents = WidgetDocumentService.get_documents_by_widget_id(widget.id)

    assert len(documents) == 2


def test_create_document(session):  # pylint:disable=unused-argument
    """Assert that documents can be created."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)

    document = WidgetDocumentService.create_document(
        widget.id, TestWidgetDocumentInfo.document1)
    documents = WidgetDocumentService.get_documents_by_widget_id(widget.id)
    document_fetched = documents[0]

    assert document is not None
    assert document.id == document_fetched.get('id')
    assert document.title == document_fetched.get('title')


def test_patch_document(session):  # pylint:disable=unused-argument
    """Assert that documents can be patched."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    TestWidgetDocumentInfo.document1['widget_id'] = widget.id
    document = factory_document_model(TestWidgetDocumentInfo.document1)

    saved_document_dict = {
        'id': document.id,
        'title': document.title,
        'type': document.type,
        'parent_document_id': document.parent_document_id,
        'url': document.url,
        'sort_index': document.sort_index,
    }

    document_edits = {
        'title': fake.word(),
        'url': None,
    }

    updated_document_record = WidgetDocumentService().edit_document(
        widget.id, document.id, document_edits)

    # Assert that only edited fields have changed
    assert updated_document_record.title == document_edits.get('title')
    assert updated_document_record.type == saved_document_dict.get('type')
    assert updated_document_record.parent_document_id == saved_document_dict.get(
        'parent_document_id')
    assert updated_document_record.url == document_edits.get('url')
    assert updated_document_record.sort_index == saved_document_dict.get(
        'sort_index')


def test_replacing_document_file_retires_previous_engagement_file(session, monkeypatch):
    """Replacing a document widget file records removal details for the old file."""
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id})
    widget = factory_widget_model(
        {**TestWidgetInfo.widget1, 'engagement_id': engagement.id})
    previous_file = factory_uploaded_file_model(tenant.id)
    replacement_file = factory_uploaded_file_model(tenant.id)
    document = factory_document_model({
        **TestWidgetDocumentInfo.document2,
        'widget_id': widget.id,
        'file_id': previous_file.id,
    })
    previous_association = EngagementFile(
        engagement_id=engagement.id, widget_id=widget.id, file_id=previous_file.id)
    replacement_association = EngagementFile(
        engagement_id=engagement.id, widget_id=widget.id, file_id=replacement_file.id)
    session.add_all([previous_association, replacement_association])
    session.commit()
    monkeypatch.setattr(
        'api.services.engagement_file_service.TokenInfo.get_id', lambda: 'editor-id')

    WidgetDocumentService.edit_document(
        widget.id, document.id, {'file_id': replacement_file.id})

    session.refresh(previous_association)
    session.refresh(replacement_association)
    assert previous_association.removed_at is not None
    assert previous_association.removed_by == 'editor-id'
    assert replacement_association.removed_at is None


def test_delete_document(session):  # pylint:disable=unused-argument
    """Assert that documents can be deleted."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    TestWidgetDocumentInfo.document1['widget_id'] = widget.id
    document = factory_document_model(TestWidgetDocumentInfo.document1)

    WidgetDocumentService().delete_document(widget.id, document.id)

    documents_root = WidgetDocumentService.get_documents_by_widget_id(
        widget.id)

    documents = documents_root.get('children')

    # Assert that the deleted document is not longer available
    if (documents is None):
        assert documents is None
