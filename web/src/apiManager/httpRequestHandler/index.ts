import axios, { AxiosRequestConfig } from 'axios';
import UserService from 'services/userService';

const GetRequest = <T>(url: string, params = {}, headers = {}, responseType?: string) => {
    const defaultHeaders = {
        'Content-type': 'application/json',
        Authorization: `Bearer ${UserService.getToken()}`,
        'tenant-id': `${sessionStorage.getItem('tenantId')}`,
    };

    const finalHeaders = {
        ...defaultHeaders,
        ...headers,
    };

    const requestOptions: AxiosRequestConfig = {
        params: params,
        headers: finalHeaders,
    };

    // Conditionally add responseType to requestOptions if provided
    if (responseType) {
        requestOptions.responseType = responseType as AxiosRequestConfig['responseType'];
    }

    return axios.get<T>(url, requestOptions);
};

const PostRequest = <T>(url: string, data = {}, params = {}, headers = {}) => {
    return axios.post<T>(url, data, {
        params,
        headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${UserService.getToken()}`,
            'tenant-id': `${sessionStorage.getItem('tenantId')}`,
            ...headers,
        },
    });
};

const PutRequest = <T>(url: string, data = {}, params = {}, headers = {}) => {
    return axios.put<T>(url, data, {
        params,
        headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${UserService.getToken()}`,
            'tenant-id': `${sessionStorage.getItem('tenantId')}`,
            ...headers,
        },
    });
};

const PatchRequest = <T>(url: string, data = {}, headers = {}) => {
    return axios.patch<T>(url, data, {
        headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${UserService.getToken()}`,
            'tenant-id': `${sessionStorage.getItem('tenantId')}`,
            ...headers,
        },
    });
};

const DeleteRequest = <T>(url: string, params = {}, headers = {}) => {
    return axios.delete<T>(url, {
        params: params,
        headers: {
            'Content-type': 'application/json',
            Authorization: `Bearer ${UserService.getToken()}`,
            'tenant-id': `${sessionStorage.getItem('tenantId')}`,
            ...headers,
        },
    });
};

interface OSSRequestOptions {
    amzDate: string;
    authHeader: string;
}
export const OSSGetRequest = <T>(url: string, requestOptions: OSSRequestOptions) => {
    return axios.get<T>(url, {
        headers: {
            'X-Amz-Date': requestOptions.amzDate,
            Authorization: requestOptions.authHeader,
            'tenant-id': `${sessionStorage.getItem('tenantId')}`,
        },
        responseType: 'blob',
    });
};

export const OSSPutRequest = <T>(url: string, data: File, requestOptions: OSSRequestOptions) => {
    return axios.put<T>(url, data, {
        headers: {
            'X-Amz-Date': requestOptions.amzDate,
            Authorization: requestOptions.authHeader,
            'tenant-id': `${sessionStorage.getItem('tenantId')}`,
        },
    });
};
export default {
    GetRequest,
    PostRequest,
    PutRequest,
    PatchRequest,
    DeleteRequest,
    OSSGetRequest,
    OSSPutRequest,
};
