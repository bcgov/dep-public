"""Widget schema class."""
from marshmallow import post_dump

from api.models.widget_documents import WidgetDocuments as WidgetDocumentModel
from api.services.object_storage_service import ObjectStorageService

from .base_schema import BaseSchema


class WidgetDocumentsSchema(BaseSchema):
    """Widget Documents schema."""

    _object_storage = ObjectStorageService()

    class Meta(BaseSchema.Meta):  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        model = WidgetDocumentModel
        include_fk = True
        fields = ('id', 'title', 'type', 'parent_document_id', 'url', 'sort_index', 'is_uploaded')

    @post_dump(pass_collection=True)
    def _attach_document_url(self, data, many, **kwargs):
        if not many:
            if data.get('is_uploaded') and data.get('url'):
                data['url'] = self._object_storage.get_url(data.get('url'))
            return data

        for item in data:
            if item.get('is_uploaded') and item.get('url'):
                item['url'] = self._object_storage.get_url(item.get('url'))

        return data
