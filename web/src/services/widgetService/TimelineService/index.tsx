import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL, replaceUrl } from 'helper';
import { TimelineWidget, TimelineEvent } from 'models/timelineWidget';
import { WidgetLocation } from 'models/widget';
import { AppConfig } from 'config';

interface PostTimelineRequest {
    widget_id: number;
    engagement_id: number;
    title: string;
    description: string;
    events: TimelineEvent[];
    location: WidgetLocation | null;
}

interface PatchTimelineRequest {
    events?: TimelineEvent[];
    title?: string;
    description?: string;
}

export const postTimeline = async (widget_id: number, data: PostTimelineRequest): Promise<TimelineWidget> => {
    const url = replaceUrl(Endpoints.TimelineWidgets.CREATE, 'widget_id', String(widget_id));
    const response = await http.PostRequest<TimelineWidget>(url, data);
    return response.data || Promise.reject(new Error('Failed to create timeline widget'));
};

export const patchTimeline = async (
    widget_id: number,
    timeline_id: number,
    data: PatchTimelineRequest,
): Promise<TimelineWidget> => {
    const url = replaceAllInURL({
        URL: Endpoints.TimelineWidgets.UPDATE,
        params: {
            widget_id: String(widget_id),
            timeline_id: String(timeline_id),
        },
    });
    const response = await http.PatchRequest<TimelineWidget>(url, data);
    return response.data || Promise.reject(new Error('Failed to update timeline widget'));
};

export const fetchTimelineWidgets = async (widget_id: number): Promise<TimelineWidget[]> => {
    const url = replaceUrl(Endpoints.TimelineWidgets.GET, 'widget_id', String(widget_id));
    const responseData = await http.GetRequest<TimelineWidget[]>(url);
    return responseData.data ?? [];
};

export interface TimelineEventTranslation {
    id: number;
    timeline_event_id: number;
    language_id: number;
    description: string | null;
    time: string | null;
}

export const getTimelineEventTranslationsByLanguage = async (
    timeline_id: number,
    language_id: number,
): Promise<TimelineEventTranslation[]> => {
    try {
        const url = `${AppConfig.apiUrl}/timelines/${timeline_id}/translations/language/${language_id}`;
        const response = await http.GetRequest<TimelineEventTranslation[]>(url);
        return response.data ?? [];
    } catch {
        return [];
    }
};

export const postTimelineEventTranslation = async (
    timeline_id: number,
    data: { timeline_event_id: number; language_id: number; description: string; time: string },
): Promise<TimelineEventTranslation> => {
    const url = `${AppConfig.apiUrl}/timelines/${timeline_id}/translations/`;
    const response = await http.PostRequest<TimelineEventTranslation>(url, data);
    return response.data || Promise.reject(new Error('Failed to create timeline event translation'));
};

export const patchTimelineEventTranslation = async (
    timeline_id: number,
    translation_id: number,
    data: { description: string; time: string },
): Promise<TimelineEventTranslation> => {
    const url = `${AppConfig.apiUrl}/timelines/${timeline_id}/translations/${translation_id}`;
    const response = await http.PatchRequest<TimelineEventTranslation>(url, data);
    return response.data || Promise.reject(new Error('Failed to update timeline event translation'));
};
