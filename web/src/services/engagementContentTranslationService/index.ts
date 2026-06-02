import Endpoints from 'apiManager/endpoints';
import http from 'apiManager/httpRequestHandler';
import { replaceUrl } from 'helper';
import { getLanguages } from 'services/languageService';

export interface EngagementDetailsTabTranslation {
    id?: number;
    language_id?: number;
    engagement_details_tab_id: number;
    label?: string;
    slug?: string;
    heading?: string;
    body?: string;
}

export interface WidgetTranslation {
    id?: number;
    language_id?: number;
    widget_id: number;
    title?: string;
    description?: string;
    map_marker_label?: string;
    map_file_name?: string;
    poll_title?: string;
    poll_description?: string;
    video_description?: string;
    video_url?: string;
}

export interface TimelineWidgetTranslation {
    id?: number;
    language_id?: number;
    widget_id: number;
    widget_timeline_id: number;
    title?: string;
    description?: string;
}

export interface EventsWidgetTranslation {
    id?: number;
    language_id?: number;
    widget_id: number;
    widget_events_id: number;
    title?: string;
}

export interface DocumentsWidgetTranslation {
    id?: number;
    language_id?: number;
    widget_id: number;
    widget_documents_id: number;
    title?: string;
}

export interface ImageWidgetTranslation {
    id?: number;
    language_id?: number;
    widget_id: number;
    widget_image_id: number;
    alt_text?: string;
    description?: string;
}

export interface EngagementContentTranslations {
    details_tabs: EngagementDetailsTabTranslation[];
    widgets: WidgetTranslation[];
    timeline_widgets: TimelineWidgetTranslation[];
    events_widgets: EventsWidgetTranslation[];
    documents_widgets: DocumentsWidgetTranslation[];
    image_widgets: ImageWidgetTranslation[];
}

export interface SyncEngagementContentTranslationsRequest {
    details_tabs?: EngagementDetailsTabTranslation[];
    widgets?: WidgetTranslation[];
    timeline_widgets?: TimelineWidgetTranslation[];
    events_widgets?: EventsWidgetTranslation[];
    documents_widgets?: DocumentsWidgetTranslation[];
    image_widgets?: ImageWidgetTranslation[];
}

const emptyContentTranslations = (): EngagementContentTranslations => ({
    details_tabs: [],
    widgets: [],
    timeline_widgets: [],
    events_widgets: [],
    documents_widgets: [],
    image_widgets: [],
});

export const getLanguageIdByCode = async (languageCode: string): Promise<number> => {
    const languages = await getLanguages();
    const language = languages.find((lng) => lng.code === languageCode);
    if (!language) {
        throw new Error(`Invalid language code ${languageCode}`);
    }

    return language.id;
};

const getByLanguageIdUrl = (engagementId: number, languageId: number) => {
    return replaceUrl(
        replaceUrl(Endpoints.EngagementContentTranslations.GET_BY_LANGUAGE, 'engagement_id', String(engagementId)),
        'language_id',
        String(languageId),
    );
};

const updateByLanguageIdUrl = (engagementId: number, languageId: number) => {
    return replaceUrl(
        replaceUrl(Endpoints.EngagementContentTranslations.UPDATE_BY_LANGUAGE, 'engagement_id', String(engagementId)),
        'language_id',
        String(languageId),
    );
};

export const getEngagementContentTranslationsByCode = async (
    engagementId: number,
    languageCode: string,
): Promise<EngagementContentTranslations> => {
    if (!languageCode) {
        return emptyContentTranslations();
    }

    const languageId = await getLanguageIdByCode(languageCode);
    const url = getByLanguageIdUrl(engagementId, languageId);
    const response = await http.GetRequest<EngagementContentTranslations>(url);
    return response.data ?? emptyContentTranslations();
};

export const syncEngagementContentTranslationsByCode = async (
    engagementId: number,
    languageCode: string,
    data: SyncEngagementContentTranslationsRequest,
): Promise<unknown> => {
    const languageId = await getLanguageIdByCode(languageCode);
    const url = updateByLanguageIdUrl(engagementId, languageId);
    const response = await http.PutRequest(url, data);
    return response.data;
};
