"""API resources for widget image translations."""

from flask_restx import Namespace, Resource
from api.services.widget_image_translation_service import WidgetImageTranslationService
from api.schemas.widget_image_translation import WidgetImageTranslationSchema

api = Namespace('widget-image-translation', description='Widget Image Translation operations')
schema = WidgetImageTranslationSchema()


@api.route('/')
class WidgetImageTranslationResource(Resource):
    """Resource for creating widget image translations."""

    def post(self):
        """Create a widget image translation record."""
        data = api.payload
        translation = WidgetImageTranslationService.create_translation(data)
        return schema.dump(translation), 201


@api.route('/<int:widget_image_id>/<int:language_id>')
class WidgetImageTranslationByIdResource(Resource):
    """Resource for managing widget image translations by identifiers."""

    def get(self, widget_image_id, language_id):
        """Fetch a widget image translation by image widget and language."""
        translation = WidgetImageTranslationService.get_by_image_and_language(widget_image_id, language_id)
        return schema.dump(translation) if translation else {}, 200

    def put(self, widget_image_id, language_id):
        """Update an existing widget image translation."""
        data = api.payload
        translation = WidgetImageTranslationService.get_by_image_and_language(widget_image_id, language_id)
        if translation:
            WidgetImageTranslationService.update_translation(translation.id, data)
            return schema.dump(translation), 200
        return {}, 404

    def delete(self, widget_image_id, language_id):
        """Delete a widget image translation if it exists."""
        translation = WidgetImageTranslationService.get_by_image_and_language(widget_image_id, language_id)
        if translation:
            WidgetImageTranslationService.delete_translation(translation.id)
            return {}, 204
        return {}, 404
