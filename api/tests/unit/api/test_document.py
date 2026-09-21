"""Tests for document upload authorization resources."""
import json
from http import HTTPStatus
from unittest.mock import MagicMock, patch

from api.models.engagement_file import EngagementFile
from api.resources.document import _get_public_upload_scope
from tests.utilities.factory_scenarios import TestEngagementInfo
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_model, factory_tenant_model, factory_uploaded_file_model)


def test_rename_document(client, jwt, session, setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Assert that PATCH can modify the uploaded file."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant = factory_tenant_model()
    uploaded_file = factory_uploaded_file_model(
        tenant.id, filename='original.pdf')

    rv = client.patch(
        f'/api/document/{uploaded_file.id}',
        data=json.dumps({'filename': 'renamed.pdf'}),
        headers=headers,
        content_type='application/json',
    )

    assert rv.status_code == HTTPStatus.OK
    assert rv.json['filename'] == 'renamed.pdf'


def test_delete_document_soft_deletes_and_hides_from_files_list(
    client, jwt, session, setup_admin_user_and_claims
):  # pylint:disable=unused-argument
    """Assert that DELETE marks the file deleted and removes it from the engagement files list."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    uploaded_file = factory_uploaded_file_model(
        tenant.id, filename='to-delete.pdf')
    session.add(EngagementFile(
        engagement_id=engagement.id, file_id=uploaded_file.id))
    session.commit()

    rv = client.delete(f'/api/document/{uploaded_file.id}', headers=headers)

    assert rv.status_code == HTTPStatus.NO_CONTENT
    session.refresh(uploaded_file)
    assert uploaded_file.deleted_at is not None
    assert uploaded_file.deleted_by is not None

    rv = client.get(
        f'/api/engagements/{engagement.id}/files', headers=headers)
    assert rv.status_code == HTTPStatus.OK
    assert rv.json == []


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
