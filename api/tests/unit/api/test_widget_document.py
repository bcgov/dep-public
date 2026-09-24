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

"""Tests to verify the Widget API end-point.

Test-Suite to ensure that the Widget endpoint is working as expected.
"""
import json
from http import HTTPStatus
from unittest.mock import patch

import pytest
from faker import Faker

from api.exceptions.business_exception import BusinessException
from api.services.widget_documents_service import WidgetDocumentService
from api.utils.enums import ContentType, WidgetDocumentType
from tests.utilities.factory_scenarios import TestJwtClaims, TestWidgetDocumentInfo, TestWidgetInfo
from tests.utilities.factory_utils import (
    factory_auth_header, factory_document_model, factory_engagement_model, factory_widget_model)


fake = Faker()


@pytest.mark.parametrize('document_info', [TestWidgetDocumentInfo.document1, TestWidgetDocumentInfo.document2])
def test_create_documents(client, jwt, session, document_info):  # pylint:disable=unused-argument
    """Assert that widget items can be POSTed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    data = {
        **document_info,
        'widget_id': widget.id,
    }

    rv = client.post(
        f'/api/widgets/{widget.id}/documents',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK

    with patch.object(WidgetDocumentService, 'create_document',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR)):
        rv = client.post(
            f'/api/widgets/{widget.id}/documents',
            data=json.dumps(data),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_get_document(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that widget items can be POSTed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    document = factory_document_model({
        **TestWidgetDocumentInfo.document1,
        'widget_id': widget.id,
    })

    rv = client.get(
        f'/api/widgets/{widget.id}/documents',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK
    assert rv.json[0].get('id') == document.id

    with patch.object(WidgetDocumentService, 'get_documents_by_widget_id', side_effect=ValueError('Test error')):
        rv = client.get(
            f'/api/widgets/{widget.id}/documents',
            headers=headers,
            content_type=ContentType.JSON.value
        )

    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_assert_tree_structure_invalid(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that widget items can be POSTed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    file_doc = factory_document_model({
        **TestWidgetDocumentInfo.document2,
        'widget_id': widget.id
    })

    folder = {**TestWidgetDocumentInfo.document1,
              'widget_id': widget.id, 'parent_document_id': file_doc.id}

    rv = client.post(
        f'/api/widgets/{widget.id}/documents',
        data=json.dumps(folder),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    # TODO once we remove action result , this should be HTTP 400
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_assert_tree_structure(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that widget items can be POSTed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    folder = factory_document_model({
        **TestWidgetDocumentInfo.document1,
        'widget_id': widget.id,
    })
    document_file = dict(TestWidgetDocumentInfo.document2)
    document_file['parent_document_id'] = folder.id
    document_file['widget_id'] = widget.id
    file_doc = factory_document_model(document_file)

    rv = client.get(
        f'/api/widgets/{widget.id}/documents',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK
    expected_folder_element = rv.json[0]
    assert expected_folder_element.get('id') == folder.id
    assert expected_folder_element.get('title') == folder.title
    assert expected_folder_element.get(
        'type') == WidgetDocumentType.FOLDER.value
    expected_file_element = expected_folder_element.get('children')[0]
    assert expected_file_element.get('id') == file_doc.id
    assert expected_file_element.get('title') == file_doc.title
    assert expected_file_element.get('type') == WidgetDocumentType.FILE.value


def test_patch_documents(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that a document can be PATCHed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    TestWidgetDocumentInfo.document1['widget_id'] = widget.id
    document = factory_document_model(TestWidgetDocumentInfo.document1)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    document_edits = {
        'title': fake.word(),
        'url': None,
    }

    rv = client.patch(f'/api/widgets/{widget.id}/documents/{document.id}',
                      data=json.dumps(document_edits),
                      headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK

    rv = client.get(
        f'/api/widgets/{widget.id}/documents',
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.json[0].get('title') == document_edits.get('title')

    with patch.object(WidgetDocumentService, 'edit_document',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR)):
        rv = client.patch(f'/api/widgets/{widget.id}/documents/{document.id}',
                          data=json.dumps(document_edits),
                          headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_delete_documents(client, jwt, session):  # pylint:disable=unused-argument
    """Assert that a document can be PATCHed."""
    engagement = factory_engagement_model()
    TestWidgetInfo.widget1['engagement_id'] = engagement.id
    widget = factory_widget_model(TestWidgetInfo.widget1)
    TestWidgetDocumentInfo.document1['widget_id'] = widget.id
    document = factory_document_model(TestWidgetDocumentInfo.document1)
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.no_role)

    rv = client.delete(f'/api/widgets/{widget.id}/documents/{document.id}',
                       headers=headers, content_type=ContentType.JSON.value)

    assert rv.status_code == HTTPStatus.OK

    document = factory_document_model(TestWidgetDocumentInfo.document1)
    with patch.object(WidgetDocumentService, 'delete_document', side_effect=ValueError('Test error')):
        rv = client.delete(f'/api/widgets/{widget.id}/documents/{document.id}',
                           headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_sort_folders(client, jwt, session):
    """Test sorting of folders."""
    engagement = factory_engagement_model()
    widget = factory_widget_model({'engagement_id': engagement.id})
    folder1 = factory_document_model({
        'widget_id': widget.id,
        'title': 'Folder 1',
        'type': 'folder'
    })

    folder2 = factory_document_model({
        'widget_id': widget.id,
        'title': 'Folder 2',
        'type': 'folder'
    })

    folder3 = factory_document_model({
        'widget_id': widget.id,
        'title': 'Folder 3',
        'type': 'folder'
    })

    headers = factory_auth_header(
        jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    # Retrieve the initial order of folders within the widget
    rv = client.get(f'/api/widgets/{widget.id}/documents',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    initial_order = [doc['id']
                     for doc in rv.json if doc.get('type') == 'folder']

    # Define the desired order of folders
    desired_order = [folder2.id, folder3.id, folder1.id]

    # Create the reorder dictionary
    reorder_dict = [{'id': folder_id} for folder_id in desired_order]

    # Perform the folder sorting
    rv = client.patch(f'/api/widgets/{widget.id}/documents/order', data=json.dumps({
        'documents': reorder_dict}),
        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    # Retrieve the updated order of folders within the widget
    rv = client.get(f'/api/widgets/{widget.id}/documents',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    updated_order = [doc['id']
                     for doc in rv.json if doc.get('type') == 'folder']

    # Assert that the order of folders has changed according to the desired order
    assert updated_order == desired_order

    # Perform additional assertions as needed
    # ...

    # Reset the order of folders to the initial order
    reset_reorder_dict = [{'id': folder_id} for folder_id in initial_order]
    rv = client.patch(f'/api/widgets/{widget.id}/documents/order', data=json.dumps({
        'documents': reset_reorder_dict}),
        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    # Verify that the order of folders has been reset
    rv = client.get(f'/api/widgets/{widget.id}/documents',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    reset_order = [doc['id'] for doc in rv.json if doc.get('type') == 'folder']
    assert reset_order == initial_order

    with patch.object(WidgetDocumentService, 'sort_documents',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR)):
        rv = client.patch(f'/api/widgets/{widget.id}/documents/order', data=json.dumps({
            'documents': reset_reorder_dict}),
            headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_sort_files(client, jwt, session):
    """Test sorting of documents within a folder."""
    engagement = factory_engagement_model()
    widget = factory_widget_model({'engagement_id': engagement.id})
    folder = factory_document_model(
        {'widget_id': widget.id, 'title': 'Folder', 'type': 'folder'})
    file1 = factory_document_model({
        'widget_id': widget.id,
        'title': 'Document 1',
        'parent_document_id': folder.id,
        'type': 'file'
    })

    file2 = factory_document_model({
        'widget_id': widget.id,
        'title': 'Document 2',
        'parent_document_id': folder.id,
        'type': 'file'
    })

    file3 = factory_document_model({
        'widget_id': widget.id,
        'title': 'Document 3',
        'parent_document_id': folder.id,
        'type': 'file'
    })

    headers = factory_auth_header(
        jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    # Retrieve the initial order of documents within the folder
    rv = client.get(f'/api/widgets/{widget.id}/documents',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    retreived_folder = rv.json[0]
    initial_order = [
        doc['id']
        for doc in retreived_folder.get('children')
        if doc.get('parent_document_id') == folder.id
    ]

    # Define the desired order of documents
    desired_order = [file2.id, file3.id, file1.id]

    # Create the reorder dictionary
    reorder_dict = [{'id': doc_id} for doc_id in desired_order]

    # Perform the document sorting
    rv = client.patch(f'/api/widgets/{widget.id}/documents/order', data=json.dumps({
        'documents': reorder_dict}),
        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    # Retrieve the updated order of documents within the folder
    rv = client.get(f'/api/widgets/{widget.id}/documents',
                    headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK
    retreived_folder = rv.json[0]
    updated_order = [
        doc['id']
        for doc in retreived_folder.get('children')
        if doc.get('parent_document_id') == folder.id
    ]

    # Assert that the order of documents has changed according to the desired order
    assert updated_order == desired_order

    # Perform additional assertions as needed
    # ...

    # Reset the order of documents to the initial order
    reset_reorder_dict = [{'id': doc_id} for doc_id in initial_order]
    rv = client.patch(f'/api/widgets/{widget.id}/documents/order', data=json.dumps({
        'documents': reset_reorder_dict}),
        headers=headers, content_type=ContentType.JSON.value)
    assert rv.status_code == HTTPStatus.OK

    # Verify that the order of documents has been reset
    rv = client.get(f'/api/widgets/{widget.id}/documents',
                    headers=headers, content_type=ContentType.JSON.value)
    retreived_folder = rv.json[0]
    assert rv.status_code == HTTPStatus.OK
    reset_order = [doc['id'] for doc in retreived_folder.get(
        'children') if doc.get('type') == 'file']
    assert reset_order == initial_order
