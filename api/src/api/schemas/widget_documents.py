"""Widget document schema class."""

from marshmallow import fields

from api.models.widget_documents import WidgetDocuments as WidgetDocumentModel
from api.schemas.uploaded_file import UploadedFileSchema
from api.services.object_storage_service import ObjectStorageService

from .base_schema import BaseSchema


class WidgetDocumentsSchema(BaseSchema):
    """Widget Documents schema."""

    _object_storage = ObjectStorageService()

    class Meta(BaseSchema.Meta):  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        model = WidgetDocumentModel
        include_fk = True
        include_relationships = True
        fields = (
            'id',
            'title',
            'type',
            'parent_document_id',
            'children',
            'url',
            'file_id',
            'file',
            'sort_index',
            'is_uploaded'
        )

    children = fields.Nested('WidgetDocumentsSchema', many=True)
    file = fields.Nested(UploadedFileSchema, exclude=('status', 'uploaded_at'))
    url = fields.Method('get_document_url', data_key='url')

    def get_document_url(self, obj):
        """Generate a URL for the document file based on its file path or uploaded status."""
        if not obj:
            raise ValueError('Invalid object.')
        if hasattr(obj, 'file') and obj.file:
            return self._object_storage.get_url(obj.file.path)
        if obj.is_uploaded and obj.url:
            return self._object_storage.get_url(obj.url)
        return obj.url
