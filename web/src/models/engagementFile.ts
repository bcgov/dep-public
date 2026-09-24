import type { UploadedFile } from './uploadedFile';
import type { Widget } from './widget';

export interface EngagementFile {
    id: number;
    engagement_id: number;
    widget_id?: number;
    widget?: Widget;
    location?: string;
    removed_by?: string;
    removed_at?: string;
    uploaded_file: UploadedFile;
}
