"""Service helpers for widget image translation CRUD operations."""

from api.models.widget_image_translation import WidgetImageTranslation


class WidgetImageTranslationService:
    """Service layer for widget image translations."""

    @staticmethod
    def get_by_image_and_language(widget_image_id, language_id):
        """Return an image translation by image widget ID and language ID."""
        return WidgetImageTranslation.query.filter_by(
            widget_image_id=widget_image_id,
            language_id=language_id,
        ).first()

    @staticmethod
    def create_translation(data):
        """Create and persist an image translation."""
        translation = WidgetImageTranslation(**data)
        translation.save()
        return translation

    @staticmethod
    def update_translation(translation_id, data):
        """Update an image translation by its ID."""
        translation = WidgetImageTranslation.query.get(translation_id)
        if translation:
            for key, value in data.items():
                setattr(translation, key, value)
            translation.save()
        return translation

    @staticmethod
    def delete_translation(translation_id):
        """Delete an image translation by its ID."""
        translation = WidgetImageTranslation.query.get(translation_id)
        if translation:
            translation.delete()
        return translation
