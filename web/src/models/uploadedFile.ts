export type EngagementFileStatus = 'uploaded' | 'processing' | 'failed';

export interface UploadedFile {
    id: string;
    name: string;
    url: string;
    path: string;
    filename: string;
    mimetype: string;
    size: number;
    unique_filename: string;
    status?: EngagementFileStatus;
    uploaded_at?: string;
}
