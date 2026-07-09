import axios, { AxiosRequestConfig } from 'axios';
import http from 'apiManager/httpRequestHandler';
import API from 'apiManager/endpoints';
import { ObjectStorageFileDetails, ObjectStorageHeaderDetails, PublicObjectStorageUploadRequest } from './types';
import { downloadFile } from 'utils';

const getOSSHeaderDetails = async (data: ObjectStorageFileDetails) => {
    return await http.PostRequest<ObjectStorageHeaderDetails[]>(API.Document.OSS_HEADER, [data]);
};

const getObject = async (headerDetails: ObjectStorageHeaderDetails) => {
    return await http.OSSGetRequest(headerDetails.filepath, {
        amzDate: headerDetails.amzdate,
        authHeader: headerDetails.authheader,
    });
};

export const downloadObject = async (file: ObjectStorageFileDetails) => {
    const response = await getOSSHeaderDetails(file);
    if (!response.data) {
        throw new Error('Error occurred while fetching a document from object storage');
    }
    return await getObject(response.data[0]);
};

const doSaveObjectRequest = async (headerDetails: ObjectStorageHeaderDetails, file: File) => {
    return await http.OSSPutRequest(headerDetails.filepath, file, {
        amzDate: headerDetails.amzdate,
        authHeader: headerDetails.authheader,
    });
};

export const saveObject = async (file: File, fileDetails: ObjectStorageFileDetails) => {
    const fileDetailsResponse = await getOSSHeaderDetails(fileDetails);
    if (!fileDetailsResponse.data) {
        throw new Error('Error occurred while fetching a document from object storage');
    }
    await doSaveObjectRequest(fileDetailsResponse.data[0], file);
    return fileDetailsResponse.data[0];
};

const getPublicUploadDetails = async (data: PublicObjectStorageUploadRequest) => {
    return await axios.post<ObjectStorageHeaderDetails>(API.Document.PUBLIC, data);
};

const uploadPublicObject = async (
    headerDetails: ObjectStorageHeaderDetails,
    file: File,
    config?: AxiosRequestConfig,
) => {
    return await axios.put(headerDetails.filepath, file, {
        ...config,
        headers: {
            ...config?.headers,
            'Content-Type': headerDetails.content_type ?? file.type,
            'X-Amz-Date': headerDetails.amzdate,
            Authorization: headerDetails.authheader,
        },
    });
};

export const savePublicObject = async (file: File, verificationToken: string, config?: AxiosRequestConfig) => {
    const fileDetailsResponse = await getPublicUploadDetails({
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        size: file.size,
        verification_token: verificationToken,
    });
    if (!fileDetailsResponse.data) {
        throw new Error('Error occurred while fetching document upload details from object storage');
    }

    await uploadPublicObject(fileDetailsResponse.data, file, config);
    return fileDetailsResponse.data;
};

const getPublicDownloadDetails = async (fileId: string, verificationToken: string) => {
    return await axios.get<ObjectStorageHeaderDetails>(API.Document.PUBLIC, {
        params: {
            file_id: fileId,
        },
        headers: {
            'Verification-Token': verificationToken,
        },
    });
};

export const downloadPublicObject = async (fileId: string, verificationToken: string) => {
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

export const deletePublicObject = async (fileId: string, verificationToken: string) => {
    const response = await axios.delete(API.Document.PUBLIC, {
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
