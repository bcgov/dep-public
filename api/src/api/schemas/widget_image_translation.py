"""Schema for widget image translations."""

from marshmallow import EXCLUDE, fields

from .base_schema import BaseSchema


class WidgetImageTranslationSchema(BaseSchema):
    """Serialization schema for widget image translation records."""

    class Meta(BaseSchema.Meta):
        """Schema options for widget image translations."""

        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    widget_image_id = fields.Int(required=True)
    language_id = fields.Int(required=True)
    alt_text = fields.Str()
    description = fields.Str()
