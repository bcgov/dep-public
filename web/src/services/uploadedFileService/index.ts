import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL } from 'helper';

export const patchUploadedFile = async (fileId: string, data: Record<string, unknown>) => {
    const url = replaceAllInURL({ URL: Endpoints.Document.PATCH, params: { file_id: fileId.toString() } });
    return http.PatchRequest(url, data);
};

export const deleteUploadedFile = async (fileId: string) => {
    const url = replaceAllInURL({ URL: Endpoints.Document.DELETE, params: { file_id: fileId.toString() } });
    return http.DeleteRequest(url);
};
