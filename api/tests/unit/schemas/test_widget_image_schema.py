"""Unit tests for WidgetImageSchema._attach_image_url post_dump hook."""
from unittest.mock import MagicMock

from api.schemas.widget_image import WidgetImageSchema


FULL_URL = 'https://objects.example.com/dep-public-files/uploads/banner.png'


def _schema_with_mock_storage(url_return_value=FULL_URL):
    """Return a WidgetImageSchema whose _object_storage.get_url is a mock."""
    schema = WidgetImageSchema()
    schema._object_storage = MagicMock()
    schema._object_storage.get_url.side_effect = lambda key: url_return_value if key else ''
    return schema


def test_attach_image_url_single_object_bare_key():
    """Assert bare key is expanded to full URL for a single object."""
    schema = _schema_with_mock_storage()

    data = {'id': 1, 'widget_id': 2, 'engagement_id': 3, 'image_url': 'uploads/banner.png'}
    result = schema._attach_image_url(data, many=False)

    schema._object_storage.get_url.assert_called_once_with('uploads/banner.png')
    assert result['image_url'] == FULL_URL


def test_attach_image_url_collection():
    """Assert every item in a collection gets its URL transformed."""
    schema = _schema_with_mock_storage()

    data = [
        {'id': 1, 'image_url': 'uploads/img1.png'},
        {'id': 2, 'image_url': 'uploads/img2.png'},
    ]
    result = schema._attach_image_url(data, many=True)

    assert schema._object_storage.get_url.call_count == 2
    assert result[0]['image_url'] == FULL_URL
    assert result[1]['image_url'] == FULL_URL


def test_attach_image_url_single_object_null_url_is_unchanged():
    """Assert a null image_url is not passed to get_url and is left as-is."""
    schema = _schema_with_mock_storage()

    data = {'id': 1, 'image_url': None}
    result = schema._attach_image_url(data, many=False)

    schema._object_storage.get_url.assert_not_called()
    assert result['image_url'] is None


def test_attach_image_url_single_object_empty_url_is_unchanged():
    """Assert an empty string image_url is not passed to get_url."""
    schema = _schema_with_mock_storage()

    data = {'id': 1, 'image_url': ''}
    result = schema._attach_image_url(data, many=False)

    schema._object_storage.get_url.assert_not_called()
    assert result['image_url'] == ''


def test_attach_image_url_full_url_input_is_idempotent():
    """Assert a stored full URL is re-normalized to the same URL (idempotent)."""
    schema = _schema_with_mock_storage(url_return_value=FULL_URL)

    data = {'id': 1, 'image_url': FULL_URL}
    result = schema._attach_image_url(data, many=False)

    schema._object_storage.get_url.assert_called_once_with(FULL_URL)
    assert result['image_url'] == FULL_URL


def test_attach_image_url_collection_with_null_entry():
    """Assert collection items with null image_url are skipped without error."""
    schema = _schema_with_mock_storage()

    data = [
        {'id': 1, 'image_url': 'uploads/img1.png'},
        {'id': 2, 'image_url': None},
    ]
    result = schema._attach_image_url(data, many=True)

    schema._object_storage.get_url.assert_called_once_with('uploads/img1.png')
    assert result[0]['image_url'] == FULL_URL
    assert result[1]['image_url'] is None
