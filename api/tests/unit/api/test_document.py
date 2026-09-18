"""Tests for document upload authorization resources."""
from http import HTTPStatus
from unittest.mock import MagicMock, patch

from api.resources.document import _get_public_upload_scope


def test_get_public_upload_scope_rejects_missing_survey(monkeypatch):
    """A verification record without a survey cannot authorize a file upload."""
    monkeypatch.setattr(
        'api.resources.document.EmailVerificationService.get_active',
        lambda *_: {'id': 4, 'survey_id': None},
    )

    try:
        _get_public_upload_scope('verification-token')
        assert False, 'Expected a missing survey to be rejected'
    except ValueError as error:
        assert str(error) == 'Survey not found.'


def test_public_upload_authorization_returns_signed_upload(client, monkeypatch):
    """A valid public upload returns signed PUT details scoped to the survey."""
    survey = MagicMock(id=12, tenant_id=7)
    verification = {'id': 44}
    monkeypatch.setattr(
        'api.resources.document._get_public_upload_scope',
        lambda _: (verification, survey, MagicMock()),
    )
    storage = MagicMock()
    storage.build_public_upload_key.return_value = (
        'tenant_7/survey_12/verification_44/file-id.pdf',
        'file-id.pdf',
    )
    storage.get_signed_upload_details.return_value = {
        'filepath': 'https://objects.example.com/files/file-id.pdf',
        'authheader': 'signed',
        'amzdate': '20260917T120000Z',
    }
    monkeypatch.setattr(
        'api.resources.document.ObjectStorageService', lambda: storage)

    response = client.post(
        '/api/document/public',
        json={
            'filename': 'document.pdf',
            'content_type': 'application/pdf',
            'size': 2048,
            'verification_token': 'verification-token',
        },
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json['uniquefilename'] == 'file-id.pdf'
    assert response.json['content_type'] == 'application/pdf'
    storage.get_signed_upload_details.assert_called_once_with(
        object_key='tenant_7/survey_12/verification_44/file-id.pdf',
        content_type='application/pdf',
    )


def test_public_download_rejects_file_outside_verified_scope(client, monkeypatch):
    """A token cannot request a signed URL for another verification's upload."""
    survey = MagicMock(id=12, tenant_id=7)
    monkeypatch.setattr(
        'api.resources.document._get_public_upload_scope',
        lambda _: ({'id': 44}, survey, MagicMock()),
    )
    storage = MagicMock()
    storage.get_object_key.return_value = 'tenant_7/survey_12/verification_9/other.pdf'
    storage.build_public_upload_prefix.return_value = 'tenant_7/survey_12/verification_44/'
    monkeypatch.setattr(
        'api.resources.document.ObjectStorageService', lambda: storage)

    response = client.get(
        '/api/document/public?file_id=other.pdf',
        headers={'Verification-Token': 'verification-token'},
    )

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json == {'message': 'Invalid file requested.'}


def test_public_delete_removes_verified_file(client, monkeypatch):
    """A file in the token's verified prefix can be deleted."""
    survey = MagicMock(id=12, tenant_id=7)
    monkeypatch.setattr(
        'api.resources.document._get_public_upload_scope',
        lambda _: ({'id': 44}, survey, MagicMock()),
    )
    storage = MagicMock()
    storage.get_object_key.return_value = 'tenant_7/survey_12/verification_44/file-id.pdf'
    storage.build_public_upload_prefix.return_value = 'tenant_7/survey_12/verification_44/'
    monkeypatch.setattr(
        'api.resources.document.ObjectStorageService', lambda: storage)

    response = client.delete(
        '/api/document/public?file_id=file-id.pdf',
        headers={'Verification-Token': 'verification-token'},
    )

    assert response.status_code == HTTPStatus.NO_CONTENT
    storage.delete_file.assert_called_once_with(
        'tenant_7/survey_12/verification_44/file-id.pdf')


@patch('api.resources.document.FileUploadService')
def test_finalize_missing_file_returns_not_found(mock_service, client):
    """Finalization maps a missing UploadedFile to a 404 response."""
    mock_service.return_value.finalize_file_upload.side_effect = ValueError(
        'file not found')

    response = client.post('/api/document/missing-file/finalize')

    assert response.status_code == HTTPStatus.NOT_FOUND
