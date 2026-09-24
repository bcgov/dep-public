"""Unit tests for WidgetImageSchema.get_image_url method field."""
from unittest.mock import MagicMock

import pytest

from api.schemas.widget_image import WidgetImageSchema


FULL_URL = 'https://objects.example.com/dep-public-files/uploads/banner.png'


def _schema_with_mock_storage(url_return_value=FULL_URL):
    """Return a WidgetImageSchema whose _object_storage.get_url is a mock."""
    schema = WidgetImageSchema()
    schema._object_storage = MagicMock()
    schema._object_storage.get_url.side_effect = lambda path: url_return_value if path else ''
    return schema


def _widget_image(path='uploads/banner.png'):
    """Return a mock WidgetImage-like object with a nested UploadedFile.path."""
    obj = MagicMock()
    obj.file.path = path
    return obj


def test_get_image_url_resolves_from_file_path():
    """Assert the file's storage path is expanded to a full URL."""
    schema = _schema_with_mock_storage()
    obj = _widget_image('uploads/banner.png')

    result = schema.get_image_url(obj)

    schema._object_storage.get_url.assert_called_once_with(
        'uploads/banner.png')
    assert result == FULL_URL


def test_get_image_url_for_each_object_in_a_collection():
    """Assert every object in a collection independently resolves its own URL."""
    schema = _schema_with_mock_storage()
    images = [_widget_image('uploads/img1.png'),
              _widget_image('uploads/img2.png')]

    results = [schema.get_image_url(image) for image in images]

    assert schema._object_storage.get_url.call_count == 2
    assert results == [FULL_URL, FULL_URL]


def test_get_image_url_raises_when_object_is_none():
    """Assert a missing object raises instead of silently returning nothing."""
    schema = _schema_with_mock_storage()

    with pytest.raises(ValueError):
        schema.get_image_url(None)

    schema._object_storage.get_url.assert_not_called()


def test_get_image_url_raises_when_file_is_missing():
    """Assert an object without an attached UploadedFile raises."""
    schema = _schema_with_mock_storage()
    obj = MagicMock()
    obj.file = None

    with pytest.raises(ValueError):
        schema.get_image_url(obj)

    schema._object_storage.get_url.assert_not_called()


def test_get_image_url_full_url_input_is_idempotent():
    """Assert a stored full URL path is re-normalized to the same URL (idempotent)."""
    schema = _schema_with_mock_storage(url_return_value=FULL_URL)
    obj = _widget_image(FULL_URL)

    result = schema.get_image_url(obj)

    schema._object_storage.get_url.assert_called_once_with(FULL_URL)
    assert result == FULL_URL
