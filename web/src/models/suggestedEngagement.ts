import { UploadedFile } from './uploadedFile';

export interface SuggestedEngagement {
    id?: number;
    engagement_id: number;
    suggested_engagement_id: number;
    sort_index: number;
}

export interface SuggestedEngagementWithAttachment extends SuggestedEngagement {
    engagement: SuggestedEngagementAttachment;
}

interface SuggestedEngagementAttachment {
    id: number;
    name: string;
    description: string;
    rich_description: string;
    description_title: string;
    start_date: string;
    end_date: string;
    submission_status: number;
    banner_file_id?: string;
    banner_file?: UploadedFile;
    tenant_id: number;
    is_internal: boolean;
    consent_message: string;
    sponsor_name: string;
    slug: string;
}
