"""Unit tests for object storage service URL construction."""
from unittest.mock import patch

from api.services.object_storage_service import ObjectStorageService


TEST_S3_CONFIG = {
    'ACCESS_KEY_ID': 'test-access-key',
    'SECRET_ACCESS_KEY': 'test-secret-key',
    'HOST': 'objects.example.com',
    'REGION': 'ca-central-1',
    'SERVICE': 's3',
    'BUCKET': 'met-public-files',
}


class _FakeAWSAuth:
    """Minimal auth object used by ObjectStorageService in URL tests."""

    def __init__(self, **kwargs):
        self.aws_host = kwargs.get('aws_host')
        self.aws_access_key = kwargs.get('aws_access_key')
        self.aws_secret_access_key = kwargs.get('aws_secret_access_key')


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_url_builds_full_url_from_host_bucket_and_key(mock_config, _mock_auth):
    """Assert host + bucket + key are used to construct the object URL."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    result = service.get_url('folder/test-image.png')

    assert result == 'https://objects.example.com/met-public-files/folder/test-image.png'


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_url_normalizes_leading_slash_key(mock_config, _mock_auth):
    """Assert leading slash keys are normalized before URL construction."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    result = service.get_url('/folder/test-image.png')

    assert result == 'https://objects.example.com/met-public-files/folder/test-image.png'


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_url_normalizes_full_url_to_key_then_rebuilds(mock_config, _mock_auth):
    """Assert previously stored full URLs are normalized to object key."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    result = service.get_url('https://objects.example.com/met-public-files/folder/test-image.png')

    assert result == 'https://objects.example.com/met-public-files/folder/test-image.png'


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_url_returns_empty_when_host_missing(mock_config, _mock_auth):
    """Assert URL construction fails safely when host is missing."""
    mock_config.return_value.S3_CONFIG = {**TEST_S3_CONFIG, 'HOST': None}

    service = ObjectStorageService()

    assert service.get_url('folder/test-image.png') == ''


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_url_returns_empty_when_bucket_missing(mock_config, _mock_auth):
    """Assert URL construction fails safely when bucket is missing."""
    mock_config.return_value.S3_CONFIG = {**TEST_S3_CONFIG, 'BUCKET': None}

    service = ObjectStorageService()

    assert service.get_url('folder/test-image.png') == ''


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_url_returns_empty_when_filename_missing(mock_config, _mock_auth):
    """Assert URL construction fails safely when filename/key is missing."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    assert service.get_url('') == ''
    assert service.get_url(None) == ''


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_object_key_returns_bare_key_for_relative_path(mock_config, _mock_auth):
    """Assert object key extraction keeps relative keys unchanged."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    assert service.get_object_key('folder/test-image.png') == 'folder/test-image.png'


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_object_key_strips_leading_slash(mock_config, _mock_auth):
    """Assert object key extraction strips a leading slash from stored paths."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    assert service.get_object_key('/folder/test-image.png') == 'folder/test-image.png'


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_object_key_extracts_key_from_full_bucket_url(mock_config, _mock_auth):
    """Assert object key extraction removes host and bucket from full URLs."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    result = service.get_object_key('https://objects.example.com/met-public-files/folder/test-image.png')

    assert result == 'folder/test-image.png'


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_object_key_returns_path_for_non_bucket_full_url(mock_config, _mock_auth):
    """Assert full URLs not matching current bucket keep their path content."""
    mock_config.return_value.S3_CONFIG = TEST_S3_CONFIG

    service = ObjectStorageService()

    result = service.get_object_key('https://cdn.example.com/other-bucket/folder/test-image.png')

    assert result == 'other-bucket/folder/test-image.png'


@patch('api.services.object_storage_service.AWSRequestsAuth', side_effect=_FakeAWSAuth)
@patch('api.services.object_storage_service.Config')
def test_get_auth_headers_returns_configuration_issue_when_missing_credentials(mock_config, _mock_auth):
    """Assert auth header generation fails with a clear configuration error."""
    mock_config.return_value.S3_CONFIG = {**TEST_S3_CONFIG, 'ACCESS_KEY_ID': None}

    service = ObjectStorageService()

    result, status = service.get_auth_headers([{'filename': 'doc.pdf'}])

    assert status == 500
    assert result.get('status') == 'Configuration Issue'
