"""Service for ContactTranslation management."""

from http import HTTPStatus

from sqlalchemy.exc import SQLAlchemyError

from api.exceptions.business_exception import BusinessException
from api.models.contact_translation import ContactTranslation as ContactTranslationModel


class ContactTranslationService:
    """ContactTranslation management service."""

    @staticmethod
    def get_by_id(translation_id: int):
        """Get contact translation by ID."""
        return ContactTranslationModel.find_by_id(translation_id)

    @staticmethod
    def get_contact_translation(contact_id=None, language_id=None):
        """Get contact translation by contact ID and language ID."""
        return ContactTranslationModel.get_by_contact_and_language(
            contact_id, language_id
        )

    @staticmethod
    def create_contact_translation(data: dict):
        """Insert a new ContactTranslation."""
        try:
            return ContactTranslationModel.create_contact_translation(data)
        except SQLAlchemyError as e:
            raise BusinessException(
                str(e), HTTPStatus.INTERNAL_SERVER_ERROR
            ) from e

    @staticmethod
    def update_contact_translation(translation_id: int, data: dict):
        """Update an existing ContactTranslation."""
        try:
            contact_translation = ContactTranslationModel.find_by_id(
                translation_id
            )
            if not contact_translation:
                raise BusinessException(
                    'ContactTranslation not found', HTTPStatus.NOT_FOUND
                )

            for key, value in data.items():
                if key != 'id':
                    setattr(contact_translation, key, value)
            contact_translation.save()
            return contact_translation
        except SQLAlchemyError as e:
            raise BusinessException(
                str(e), HTTPStatus.INTERNAL_SERVER_ERROR
            ) from e

    @staticmethod
    def delete_contact_translation(translation_id: int):
        """Delete a ContactTranslation."""
        try:
            contact_translation = ContactTranslationModel.find_by_id(
                translation_id
            )
            if not contact_translation:
                raise BusinessException(
                    'ContactTranslation not found', HTTPStatus.NOT_FOUND
                )
            contact_translation.delete()
            return True
        except SQLAlchemyError as e:
            raise BusinessException(
                str(e), HTTPStatus.INTERNAL_SERVER_ERROR
            ) from e
