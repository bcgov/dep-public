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
    s3sourceuri?: string;
    content_type?: string;
    engagement_id?: number;
    widget_id?: number;
}

export interface PublicObjectStorageUploadRequest {
    filename: string;
    content_type: string;
    size: number;
    verification_token: string;
}
