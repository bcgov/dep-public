"""Service for widget Document management."""
from http import HTTPStatus

from api.exceptions.business_exception import BusinessException
from api.models.db import db
from api.models.widget import Widget as WidgetModel
from api.models.widget_documents import WidgetDocuments as WidgetDocumentsModel
from api.schemas.widget_documents import WidgetDocumentsSchema
from api.services.engagement_file_service import EngagementFileService
from api.services.object_storage_service import ObjectStorageService
from api.utils.enums import WidgetDocumentType


class WidgetDocumentService:
    """Widget Documents management service."""

    _object_storage = ObjectStorageService()

    @staticmethod
    def get_documents_by_widget_id(widget_id):
        """Get documents by widget id."""
        docs = WidgetDocumentsModel.get_all_by_widget_id(widget_id)
        docs = [doc for doc in docs if doc.parent_document_id is None]
        if not docs:
            return []

        return WidgetDocumentsSchema().dump(docs, many=True)

    @staticmethod
    def create_document(widget_id, doc_details):
        """Create documents for the widget."""
        if parent_id := doc_details.get('parent_document_id', None):
            WidgetDocumentService._validate_parent_type(parent_id)

        doc = WidgetDocumentService._create_document_from_dict(
            doc_details, parent_id, widget_id)
        doc.save()
        return doc

    @staticmethod
    def _create_document_from_dict(doc_details, parent_id, widget_id):
        doc: WidgetDocumentsModel = WidgetDocumentsModel()
        file_id = doc_details.get('file_id')
        is_uploaded = bool(file_id) or doc_details.get('is_uploaded', False)
        doc_url = doc_details.get('url')
        # Legacy uploads stored the object storage key directly on url; new uploads
        # are linked via file_id and resolve their URL through the UploadedFile relation.
        if is_uploaded and not file_id:
            doc_url = WidgetDocumentService._object_storage.get_object_key(
                doc_url)

        doc.type = doc_details.get('type')
        doc.is_uploaded = is_uploaded
        doc.title = doc_details.get('title')
        doc.parent_document_id = parent_id
        doc.file_id = file_id
        doc.url = None if file_id else doc_url
        doc.widget_id = widget_id
        sort_index = WidgetDocumentService._find_highest_sort_index(widget_id)
        doc.sort_index = sort_index + 1
        return doc

    @staticmethod
    def _find_highest_sort_index(widget_id):
        # find the highest sort order of the engagement
        sort_index = 0
        docs = WidgetDocumentsModel.get_all_by_widget_id(widget_id)
        if docs:
            # Find the largest in the existing widgest
            sort_index = max(doc.sort_index for doc in docs) or 0
        return sort_index

    @staticmethod
    def _validate_parent_type(parent_id):
        parent: WidgetDocumentsModel = WidgetDocumentsModel.find_by_id(
            parent_id)
        if parent is None:
            raise BusinessException(
                error='Parent Folder doesnt exist.',
                status_code=HTTPStatus.BAD_REQUEST)
        if parent.type == WidgetDocumentType.FILE.value:
            raise BusinessException(
                error='Cant nest inside file',
                status_code=HTTPStatus.BAD_REQUEST)

    @staticmethod
    def edit_document(widget_id, document_id, data: dict):
        """Update document from a document widget."""
        document = WidgetDocumentsModel.find_by_id(document_id)
        if not document:
            raise BusinessException(
                error='Document to update was not found.',
                status_code=HTTPStatus.BAD_REQUEST)
        replacement_file_id = data.get('file_id')
        should_retire_file = replacement_file_id and document.file_id and \
            str(replacement_file_id) != str(document.file_id)
        if should_retire_file:
            widget = WidgetModel.find_by_id(document.widget_id)
            if widget:
                EngagementFileService(db.session).retire_file(
                    widget.engagement_id,
                    document.file_id,
                    document.widget_id,
                )
        update_data = {
            **data,
            'url': data.get('url', document.url) if not document.is_uploaded else document.url,
        }
        updated_document = WidgetDocumentsModel.edit_widget_document(
            widget_id, document_id, update_data)
        return updated_document

    @staticmethod
    def delete_document(widget_id, document_id):
        """Remove document from a document widget."""
        delete_document = WidgetDocumentsModel.remove_widget_document(
            widget_id, document_id)
        if not delete_document:
            raise BusinessException(
                error='Document to remove was not found.',
                status_code=HTTPStatus.BAD_REQUEST)
        return delete_document

    @staticmethod
    def sort_documents(widget_id, documents: list, user_id=None):
        """Sort widgets."""
        WidgetDocumentService._validate_document_ids(widget_id, documents)

        document_sort_mappings = [{
            'id': document.get('id'),
            'sort_index': index + 1,
            'updated_by': user_id
        } for index, document in enumerate(documents)]

        WidgetDocumentsModel.update_documents(document_sort_mappings)

    @staticmethod
    def _validate_document_ids(widget_id, documents):
        """Validate if documents ids belong to the widget."""
        widget_documents = WidgetDocumentsModel.get_all_by_widget_id(widget_id)
        document_ids = [document.id for document in widget_documents]
        input_document_ids = [document_item.get(
            'id') for document_item in documents]
        if len(set(input_document_ids) - set(document_ids)) > 0:
            raise BusinessException(
                error='Invalid widgets.',
                status_code=HTTPStatus.BAD_REQUEST)
