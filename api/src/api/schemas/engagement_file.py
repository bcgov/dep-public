"""Engagement-file association schema class."""

from marshmallow import fields

from api.models.db import db
from api.models.engagement_file import EngagementFile
from api.services.engagement_file_service import EngagementFileService

from .base_schema import BaseSchema


class LocationField(fields.Field[str | None]):
    """Custom field for handling the location of an engagement file."""

    def _serialize(self, _, __, obj, **kwargs):
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

    def deserialize(self, value, attr=None, data=None, **kwargs):
        """Bypass the base Field's None short-circuit so a null value reaches `_deserialize`."""
        return self._deserialize(value, attr, data, **kwargs)

    def _deserialize(self, value, _, data, **kwargs):
        """
        Deserialization is largely unsupported for the location field.

        However, by setting the Location field to None, it should allow dissociation
        of the file from its current location.
        """
        if value not in (None, 'null'):
            raise ValueError(
                f'Setting a new location is not supported: value={value}')
        # The instance is bound to the schema for the duration of load(), letting us
        # unlink without requiring engagement_id/file_id in the request body.
        instance = self.root.instance
        if instance is None:
            raise ValueError(
                'An existing engagement file instance is required to unlink.')
        EngagementFileService(db.session).unlink_file(instance)


class EngagementFileSchema(BaseSchema):
    """Schema for the EngagementFile model."""

    class Meta(BaseSchema.Meta):
        """
        Meta class for the EngagementFile schema.

        Specifies the model, foreign key inclusion, relationships, and fields for serialization.
        """

        model = EngagementFile
        load_instance = True
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
        dump_only = ('id', 'removed_at', 'removed_by',
                     'engagement_id', 'widget_id', 'file_id')

    location = LocationField(dump_default='')
    uploaded_file = fields.Nested('UploadedFileSchema', dump_only=True)
    widget = fields.Nested('WidgetSchema', dump_only=True,
                           only=('id', 'title', 'widget_type_id', 'location'))
