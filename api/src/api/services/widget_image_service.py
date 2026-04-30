"""Service for Widget Image management."""

from api.constants.membership_type import MembershipType
from api.models.widget_image import WidgetImage as WidgetImageModel
from api.services import authorization
from api.services.object_storage_service import ObjectStorageService
from api.utils.roles import Role


class WidgetImageService:
    """Widget image management service."""

    _object_storage = ObjectStorageService()

    @staticmethod
    def get_image(widget_id):
        """Get image by widget id."""
        widget_image = WidgetImageModel.get_image(widget_id)
        return widget_image

    @staticmethod
    def create_image(widget_id, image_details: dict):
        """Create image for the widget."""
        image_data = dict(image_details)
        eng_id = image_data.get('engagement_id')
        authorization.check_auth(
            one_of_roles=(MembershipType.TEAM_MEMBER.name, Role.EDIT_ENGAGEMENT.value),
            engagement_id=eng_id,
        )

        widget_image = WidgetImageService._create_image_model(widget_id, image_data)
        widget_image.commit()
        return widget_image

    @staticmethod
    def update_image(widget_id, image_widget_id, image_data):
        """Update image widget."""
        widget_image: WidgetImageModel = WidgetImageModel.find_by_id(image_widget_id)
        authorization.check_auth(
            one_of_roles=(MembershipType.TEAM_MEMBER.name, Role.EDIT_ENGAGEMENT.value),
            engagement_id=widget_image.engagement_id,
        )

        if not widget_image:
            raise KeyError('image widget not found')

        if widget_image.widget_id != widget_id:
            raise ValueError('Invalid widgets and image')

        updated_image_data = dict(image_data)
        if 'image_url' in updated_image_data:
            updated_image_data['image_url'] = WidgetImageService._object_storage.get_object_key(
                updated_image_data.get('image_url')
            )

        return WidgetImageModel.update_image(widget_id, updated_image_data)

    @staticmethod
    def _create_image_model(widget_id, image_data: dict):
        image_model: WidgetImageModel = WidgetImageModel()
        image_model.widget_id = widget_id
        image_model.engagement_id = image_data.get('engagement_id')
        image_model.image_url = WidgetImageService._object_storage.get_object_key(image_data.get('image_url'))
        image_model.description = image_data.get('description')
        image_model.alt_text = image_data.get('alt_text')
        image_model.flush()
        return image_model
