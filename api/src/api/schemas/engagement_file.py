"""Engagement-file association schema class."""
from typing import Literal

from marshmallow import fields

from api.models.engagement_file import EngagementFile

from .base_schema import BaseSchema


class EngagementFileSchema(BaseSchema):
    """Schema for the EngagementFile model."""

    class Meta(BaseSchema.Meta):
        """
        Meta class for the EngagementFile schema.

        Specifies the model, foreign key inclusion, relationships, and fields for serialization.
        """

        model = EngagementFile
        include_fk = True
        include_relationships = True
        fields = (
            'id',
            'engagement_id',
            'file_id',
            'removed_at',
            'location',
            'removed_by',
            'uploaded_file',
            'widget_id',
            'widget'
        )
        dump_only = ('id', 'removed_at', 'removed_by')

    location = fields.Method('get_location', dump_only=True)
    uploaded_file = fields.Nested('UploadedFileSchema', dump_only=True)
    widget = fields.Nested('WidgetSchema', dump_only=True,
                           only=('id', 'title', 'widget_type_id', 'location'))

    def get_location(self, obj) -> Literal['widget', 'banner'] | None:
        """
        Create a location key based on where a file's foreign-key references exist.

        This helps associate the file with the correct location in the engagement context.
        """
        if obj.engagement_id:
            file = obj.uploaded_file
            if any(usage.id == obj.engagement_id for usage in file.banner_usages):
                return 'banner'
        image_widgets = obj.uploaded_file.image_widgets
        if image_widgets:
            if obj.widget_id and any(usage.widget_id == obj.widget_id for usage in image_widgets):
                return 'widget'
        document_widgets = obj.uploaded_file.document_widgets
        if document_widgets:
            if obj.widget_id and any(usage.widget_id == obj.widget_id for usage in document_widgets):
                return 'widget'
        return None
