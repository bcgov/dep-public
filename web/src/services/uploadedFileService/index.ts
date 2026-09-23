import http from 'apiManager/httpRequestHandler';
import { replaceAllInURL } from 'helper';
import axios, { AxiosRequestConfig } from 'axios';
import API from 'apiManager/endpoints';
import { ObjectStorageFileDetails, ObjectStorageHeaderDetails, PublicObjectStorageUploadRequest } from './types';
import { downloadFile } from 'utils';
import { UploadedFile } from 'models/uploadedFile';

const getStorageAuthHeaders = async (data: ObjectStorageFileDetails) => {
    return await http.PostRequest<ObjectStorageHeaderDetails[]>(API.UploadedFile.OSS_HEADER, [data]);
};

export const downloadObject = async (file: ObjectStorageFileDetails) => {
    const response = await getStorageAuthHeaders(file);
    if (!response.data) {
        throw new Error('Error occurred while fetching a document from object storage');
    }
    const headerDetails = response.data[0];
    const blobResponse = await http.OSSGetRequest<Blob>(headerDetails.filepath, {
        amzDate: headerDetails.amzdate,
        authHeader: headerDetails.authheader,
    });
    const fallbackFileName = file.filename.split('/').pop() || 'download';
    downloadFile(blobResponse, fallbackFileName);
};

const doUploadFileRequest = async (headerDetails: ObjectStorageHeaderDetails, file: File) => {
    return await http.OSSPutRequest(headerDetails.filepath, file, {
        amzDate: headerDetails.amzdate,
        authHeader: headerDetails.authheader,
    });
};

const finalizeUpload = async (fileId: string) => {
    return await http.PostRequest<UploadedFile>(API.UploadedFile.OSS_FINALIZE.replace('file_id', fileId));
};

export const uploadFile = async (file: File, fileDetails: ObjectStorageFileDetails) => {
    const fileDetailsResponse = await getStorageAuthHeaders(fileDetails);
    if (!fileDetailsResponse.data) {
        throw new Error('Error occurred while fetching a document from object storage');
    }
    await doUploadFileRequest(fileDetailsResponse.data[0], file);
    const finalizedFile = await finalizeUpload(fileDetailsResponse.data[0].uniquefilename.split('.')[0] || '');
    return finalizedFile.data;
};

export const patchUploadedFile = async (fileId: string, data: Record<string, unknown>) => {
    const url = replaceAllInURL({ URL: API.UploadedFile.PATCH, params: { file_id: fileId.toString() } });
    return http.PatchRequest(url, data);
};

export const deleteUploadedFile = async (fileId: string) => {
    const url = replaceAllInURL({ URL: API.UploadedFile.DELETE, params: { file_id: fileId.toString() } });
    return http.DeleteRequest(url);
};

const getPublicUploadDetails = async (data: PublicObjectStorageUploadRequest) => {
    return await axios.post<ObjectStorageHeaderDetails>(API.UploadedFile.PUBLIC, data);
};

export const uploadPublicFile = async (file: File, verificationToken: string, config?: AxiosRequestConfig) => {
    const fileDetailsResponse = await getPublicUploadDetails({
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        size: file.size,
        verification_token: verificationToken,
    });
    if (!fileDetailsResponse.data) {
        throw new Error('Error occurred while fetching document upload details from object storage');
    }

    const headerDetails: ObjectStorageHeaderDetails = fileDetailsResponse.data;
    await axios.put(headerDetails.filepath, file, {
        ...config,
        headers: {
            ...config?.headers,
            'Content-Type': headerDetails.content_type ?? file.type,
            'X-Amz-Date': headerDetails.amzdate,
            Authorization: headerDetails.authheader,
        },
    });
    return fileDetailsResponse.data;
};

const getPublicDownloadDetails = async (fileId: string, verificationToken: string) => {
    return await axios.get<ObjectStorageHeaderDetails>(API.UploadedFile.PUBLIC, {
        params: {
            file_id: fileId,
        },
        headers: {
            'Verification-Token': verificationToken,
        },
    });
};

export const downloadPublicFile = async (fileId: string, verificationToken: string) => {
    const response = await getPublicDownloadDetails(fileId, verificationToken);
    if (!response.data) {
        throw new Error('Error occurred while fetching document download details from object storage');
    }

    const blobResponse = await axios.get<Blob>(response.data.filepath, {
        headers: {
            'X-Amz-Date': response.data.amzdate,
            Authorization: response.data.authheader,
        },
        responseType: 'blob',
    });

    const fallbackFileName = fileId.split('/').pop() || 'download';
    downloadFile(blobResponse, fallbackFileName);
};

export const deletePublicFile = async (fileId: string, verificationToken: string) => {
    const response = await axios.delete(API.UploadedFile.PUBLIC, {
        params: {
            file_id: fileId,
        },
        headers: {
            'Verification-Token': verificationToken,
        },
    });
    if (response.status !== 204) {
        throw new Error(
            `Error occurred while deleting document from object storage: ${response.status} – ${response.statusText}`,
        );
    }
};
