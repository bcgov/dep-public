"""Tests for UploadedFile schema serialization."""

from unittest.mock import patch

from api.schemas.uploaded_file import UploadedFileSchema
from tests.utilities.factory_utils import factory_staff_user_model, factory_uploaded_file_model


def test_schema_generates_file_url(session):
    """Uploaded file schema generates a URL for the file."""
    uploaded_file = factory_uploaded_file_model(1)

    with patch('api.schemas.uploaded_file.ObjectStorageService') as mock_storage:
        mock_storage.return_value.get_url.return_value = (
            'https://example.com/file.pdf'
        )

        result = UploadedFileSchema().dump(uploaded_file)

    assert result['url'] == 'https://example.com/file.pdf'


def test_schema_serializes_uploader_name(session):
    """Uploaded file schema serializes the uploader's full name."""
    user = factory_staff_user_model()

    uploaded_file = factory_uploaded_file_model(
        1,
        created_by=user.username,
    )

    result = UploadedFileSchema().dump(uploaded_file)

    expected_name = f'{user.first_name} {user.last_name}'

    assert result['uploader_name'] == expected_name
