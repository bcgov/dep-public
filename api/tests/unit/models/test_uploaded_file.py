"""Tests for the UploadedFile model."""

from tests.utilities.factory_utils import factory_staff_user_model, factory_uploaded_file_model


def test_uploaded_file_returns_uploader_name(session):
    """Uploaded file returns the uploader's full name."""
    user = factory_staff_user_model(
        username='uploaded-file-test@idir',
    )

    uploaded_file = factory_uploaded_file_model(
        1,
        created_by='uploaded-file-test@idir',
    )

    expected_name = f'{user.first_name} {user.last_name}'

    assert uploaded_file.uploader_name == expected_name


def test_uploaded_file_returns_none_when_no_uploader(session):
    """Uploaded file returns None when uploader is unavailable."""
    uploaded_file = factory_uploaded_file_model(
        1,
        created_by='missing-user@idir',
    )

    assert uploaded_file.uploader_name is None
