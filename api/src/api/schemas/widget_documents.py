"""Widget schema class."""

from api.models.widget_documents import WidgetDocuments as WidgetDocumentModel

from .base_schema import BaseSchema


class WidgetDocumentsSchema(BaseSchema):
    """Widget Documents schema."""

    class Meta(BaseSchema.Meta):  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        model = WidgetDocumentModel
        include_fk = True
        fields = ('id', 'title', 'type', 'parent_document_id', 'url', 'sort_index', 'is_uploaded')
