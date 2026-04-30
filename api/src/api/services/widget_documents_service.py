"""Service for widget Document management."""
from http import HTTPStatus

from anytree import AnyNode
from anytree.exporter import DictExporter
from anytree.search import find_by_attr

from api.exceptions.business_exception import BusinessException
from api.models.widget_documents import WidgetDocuments as WidgetDocumentsModel
from api.services.object_storage_service import ObjectStorageService
from api.utils.enums import WidgetDocumentType


class WidgetDocumentService:
    """Widget Documents management service."""

    _object_storage = ObjectStorageService()

    @staticmethod
    def get_documents_by_widget_id(widget_id):
        """Get documents by widget id."""
        docs = WidgetDocumentsModel.get_all_by_widget_id(widget_id)
        if not docs:
            return {}
        # create all folders structure
        root = AnyNode()
        WidgetDocumentService._attach_folder_nodes(docs, root)
        WidgetDocumentService._attach_file_nodes(docs, root)

        exporter = DictExporter()
        return exporter.export(root)

    @staticmethod
    def _attach_file_nodes(docs, root):
        files = list(filter(lambda doc: doc.type == WidgetDocumentType.FILE.value, docs))
        for file in files:
            props = WidgetDocumentService._fetch_props(file)
            parent_node = root
            if parent_id := file.parent_document_id:
                parent_node = find_by_attr(root, parent_id, name='id')
            AnyNode(**props, parent=parent_node)

    @staticmethod
    def _attach_folder_nodes(docs, root):
        folders = list(filter(lambda doc: doc.type == WidgetDocumentType.FOLDER.value, docs))
        for folder in folders:
            props = WidgetDocumentService._fetch_props(folder)
            AnyNode(**props, parent=root)

    @staticmethod
    def _fetch_props(doc):
        document_url = doc.url
        if doc.is_uploaded:
            document_url = WidgetDocumentService._object_storage.get_url(doc.url)

        props = {
            'id': doc.id,
            'type': doc.type,
            'title': doc.title,
            'sort_index': doc.sort_index,
            'url': document_url,
            'parent_document_id': doc.parent_document_id,
            'is_uploaded': doc.is_uploaded,
        }
        # remove null
        return dict(props.items())

    @staticmethod
    def create_document(widget_id, doc_details):
        """Create documents for the widget."""
        if parent_id := doc_details.get('parent_document_id', None):
            WidgetDocumentService._validate_parent_type(parent_id)

        doc = WidgetDocumentService._create_document_from_dict(doc_details, parent_id, widget_id)
        doc.save()
        return doc

    @staticmethod
    def _create_document_from_dict(doc_details, parent_id, widget_id):
        doc: WidgetDocumentsModel = WidgetDocumentsModel()
        is_uploaded = doc_details.get('is_uploaded')
        doc_url = doc_details.get('url')
        if is_uploaded:
            doc_url = WidgetDocumentService._object_storage.get_object_key(doc_url)

        doc.type = doc_details.get('type')
        doc.is_uploaded = is_uploaded
        doc.title = doc_details.get('title')
        doc.parent_document_id = parent_id
        doc.url = doc_url
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
        parent: WidgetDocumentsModel = WidgetDocumentsModel.find_by_id(parent_id)
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
        update_data = {
            **data,
            'url': data.get('url', document.url) if not document.is_uploaded else document.url,
        }
        updated_document = WidgetDocumentsModel.edit_widget_document(widget_id, document_id, update_data)
        return updated_document

    @staticmethod
    def delete_document(widget_id, document_id):
        """Remove document from a document widget."""
        delete_document = WidgetDocumentsModel.remove_widget_document(widget_id, document_id)
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
        input_document_ids = [document_item.get('id') for document_item in documents]
        if len(set(input_document_ids) - set(document_ids)) > 0:
            raise BusinessException(
                error='Invalid widgets.',
                status_code=HTTPStatus.BAD_REQUEST)
