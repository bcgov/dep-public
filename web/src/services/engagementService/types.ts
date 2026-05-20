import { Engagement } from 'models/engagement';
import { EngagementStatusBlock } from 'models/engagementStatusBlock';
import { SuggestedEngagement } from 'models/suggestedEngagement';
import { Survey } from 'models/survey';

export interface EngagementState {
    allEngagements: Engagement[];
}

export interface PostEngagementRequest {
    name: string;
    start_date: string;
    end_date: string;
    description: string;
    rich_description: string;
    description_title: string;
    banner_filename?: string;
    status_block?: EngagementStatusBlock[];
    is_internal?: boolean;
    languages?: string[];
}

export interface PutEngagementRequest {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    description: string;
    rich_description: string;
    description_title: string;
    banner_filename?: string;
    status_block?: EngagementStatusBlock[];
    sponsor_name?: string;
}

export interface PatchEngagementRequest {
    id: number;
    name?: string;
    start_date?: string;
    end_date?: string;
    status_id?: number;
    scheduled_date?: string;
    description?: string;
    rich_description?: string;
    description_title?: string;
    banner_filename?: string;
    status_block?: EngagementStatusBlock[];
    is_internal?: boolean;
    sponsor_name?: string;
    feedback_heading?: string;
    feedback_body?: string;
    surveys?: Survey[];
    selected_survey_id?: number;
    more_engagements_heading?: string;
    suggested_engagements?: Partial<SuggestedEngagement>[];
    subscribe_section_heading?: string;
    subscribe_section_description?: string;
    subscribe_consent_message?: string;
    consent_message?: string;
    languages?: string[];
}
