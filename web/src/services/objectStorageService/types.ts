export interface ObjectStorageHeaderDetails {
    filename: string;
    filepath: string;
    authheader: string;
    amzdate: string;
    uniquefilename: string;
    content_type?: string;
    size?: number;
}

export interface ObjectStorageFileDetails {
    filename: string;
}

export interface PublicObjectStorageUploadRequest {
    filename: string;
    content_type: string;
    size: number;
    verification_token: string;
}
