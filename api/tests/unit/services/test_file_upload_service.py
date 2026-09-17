"""Tests for persistence and finalization of managed file uploads."""
from datetime import UTC, datetime
from http import HTTPStatus
from unittest.mock import MagicMock, patch

import pytest

from api.exceptions.business_exception import BusinessException
from api.models.uploaded_file import UploadedFileStatus
from api.services.file_upload_service import FileUploadService


FILE_ID = 'd4b02ea8-3684-48c7-923d-79a45d2182d4'


def _service_with_storage():
    """Return a file upload service with object storage isolated from tests."""
    service = FileUploadService(MagicMock())
    service.object_storage = MagicMock()
    service.object_storage.s3_auth = MagicMock()
    service.object_storage.s3_auth.aws_host = 'objects.example.com'
    service.object_storage.s3_bucket = 'files'
    return service


def test_prepare_file_upload_creates_pending_uploaded_file():
    """Preparing an upload persists the DB record before the S3 PUT occurs."""
    service = _service_with_storage()
    service.object_storage.get_auth_headers.return_value = [
        {'filepath': f'uploads/{FILE_ID}.pdf', 'uniquefilename': f'{FILE_ID}.pdf'}
    ]
    service.object_storage.get_object_key.return_value = f'uploads/{FILE_ID}.pdf'

    auth_headers, uploaded_file = service.prepare_file_upload(
        7, 'document.pdf')

    assert auth_headers['uniquefilename'] == f'{FILE_ID}.pdf'
    assert str(uploaded_file.id) == FILE_ID
    assert uploaded_file.tenant_id == 7
    assert uploaded_file.path == f'uploads/{FILE_ID}.pdf'
    assert uploaded_file.mimetype == 'application/pdf'
    assert uploaded_file.status == UploadedFileStatus.PENDING
    assert uploaded_file.size == 0


def test_prepare_file_upload_creates_engagement_association():
    """An engagement-scoped upload creates an association for the Files tab."""
    service = _service_with_storage()
    service.object_storage.get_auth_headers.return_value = [
        {'filepath': f'uploads/{FILE_ID}.webp',
            'uniquefilename': f'{FILE_ID}.webp'}
    ]
    service.object_storage.get_object_key.return_value = f'uploads/{FILE_ID}.webp'
    engagement = MagicMock(id=19, tenant_id=7)
    service.db_session.query.return_value.get.return_value = engagement

    _, uploaded_file = service.prepare_file_upload(
        7, 'image.webp', content_type='image/webp', engagement_id=19, widget_id=23
    )

    association = next(
        item for item in service.db_session.add.call_args_list if item.args[0].__class__.__name__ == 'EngagementFile'
    ).args[0]
    assert uploaded_file.mimetype == 'image/webp'
    assert association.engagement_id == 19
    assert association.widget_id == 23
    assert association.file_id == uploaded_file.id


def test_prepare_file_upload_rejects_engagement_from_another_tenant():
    """An upload may not create a file association across tenants."""
    service = _service_with_storage()
    service.object_storage.get_auth_headers.return_value = [
        {'filepath': f'uploads/{FILE_ID}.pdf', 'uniquefilename': f'{FILE_ID}.pdf'}
    ]
    service.object_storage.get_object_key.return_value = f'uploads/{FILE_ID}.pdf'
    service.db_session.query.return_value.get.return_value = MagicMock(
        tenant_id=8)

    with pytest.raises(BusinessException) as error:
        service.prepare_file_upload(7, 'document.pdf', engagement_id=19)

    assert error.value.status_code == HTTPStatus.NOT_FOUND


@patch('api.services.file_upload_service.requests.head')
def test_finalize_file_upload_marks_uploaded_and_preserves_declared_mimetype(mock_head):
    """Finalization uses the persisted MIME type and records S3 metadata."""
    service = _service_with_storage()
    file_record = MagicMock(mimetype='application/pdf',
                            filename='document.pdf')
    service.get_file_upload = MagicMock(return_value=file_record)
    service.object_storage.get_object_key.return_value = 'uploads/file-id.pdf'
    mock_head.return_value = MagicMock(
        status_code=200,
        headers={
            'Last-Modified': 'Wed, 17 Sep 2026 12:30:00 GMT',
            'Content-Type': 'application/octet-stream',
            'Content-Length': '2048',
        },
    )

    result, status_code = service.finalize_file_upload('file-id')

    assert result is file_record
    assert status_code == HTTPStatus.OK
    assert file_record.status == UploadedFileStatus.UPLOADED
    assert file_record.mimetype == 'application/pdf'
    assert file_record.size == 2048
    assert file_record.uploaded_at == datetime(2026, 9, 17, 12, 30, tzinfo=UTC)


@patch('api.services.file_upload_service.requests.head')
def test_finalize_file_upload_marks_failed_when_object_is_missing(mock_head):
    """Finalization records failure when object storage cannot find the file."""
    service = _service_with_storage()
    file_record = MagicMock(path='uploads/file-id.pdf')
    service.get_file_upload = MagicMock(return_value=file_record)
    service.object_storage.get_object_key.return_value = 'uploads/file-id.pdf'
    mock_head.return_value = MagicMock(status_code=404)

    result, status_code = service.finalize_file_upload('file-id')

    assert result is file_record
    assert status_code == HTTPStatus.NOT_FOUND
    assert file_record.status == UploadedFileStatus.FAILED
