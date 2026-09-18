import http from 'apiManager/httpRequestHandler';
import { DocumentItem, DocumentType } from 'models/document';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL, replaceUrl } from 'helper';
import { WidgetLocation } from 'models/widget';

export const fetchDocuments = async (widget_id: number): Promise<DocumentItem[]> => {
    const url = replaceUrl(Endpoints.Documents.GET_LIST, 'widget_id', String(widget_id));
    const responseData = await http.GetRequest<DocumentItem[]>(url);
    return responseData.data ?? [];
};

interface PostDocumentRequest {
    title?: string;
    widget_id?: number;
    parent_document_id?: number | null;
    url?: string;
    file_id?: string;
    type: DocumentType;
    is_uploaded?: boolean;
    location: WidgetLocation | null;
}
export const postDocument = async (widget_id: number, data: PostDocumentRequest): Promise<DocumentItem> => {
    const url = replaceUrl(Endpoints.Documents.CREATE, 'widget_id', String(widget_id));
    const response = await http.PostRequest<DocumentItem>(url, data);
    if (!response.data || response.status !== 200) throw new Error('Failed to create document');
    return response.data;
};

export const deleteDocument = async (widget_id: number, document_id: number): Promise<DocumentItem> => {
    const url = replaceAllInURL({
        URL: Endpoints.Documents.DELETE,
        params: {
            document_id: String(document_id),
            widget_id: String(widget_id),
        },
    });
    const response = await http.DeleteRequest<DocumentItem>(url);
    if (!response.data || response.status !== 200) throw new Error('Failed to delete document');

    return response.data;
};

export interface PatchDocumentRequest {
    title?: string;
    url?: string;
    parent_document_id?: number | null;
}

export const patchDocument = async (
    widget_id: number,
    document_id: number,
    data: PatchDocumentRequest,
): Promise<DocumentItem> => {
    const url = replaceAllInURL({
        URL: Endpoints.Documents.UPDATE,
        params: {
            document_id: String(document_id),
            widget_id: String(widget_id),
        },
    });
    const response = await http.PatchRequest<DocumentItem>(url, data);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to update document');
};

export interface SortDocumentRequest {
    parent_document_id?: number;
    documents: DocumentItem[];
}
export const sortDocuments = async (widget_id: number, data: SortDocumentRequest): Promise<DocumentItem> => {
    const url = replaceUrl(Endpoints.Documents.ORDER, 'widget_id', String(widget_id));
    const response = await http.PatchRequest<DocumentItem>(url, data);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to update document order');
};
