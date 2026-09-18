import { UploadedFile } from './uploadedFile';

export interface ImageWidget {
    id: number;
    widget_id: number;
    engagement_id: number;
    file_id: string;
    file: UploadedFile;
    alt_text: string;
    description: string;
}
