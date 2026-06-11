import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl, replaceAllInURL } from 'helper';
import { Event, EventTypeLabel } from 'models/event';
import { WidgetLocation } from 'models/widget';

export const getEvents = async (widget_id: number): Promise<Event[]> => {
    const url = replaceUrl(Endpoints.Events.GET_LIST, 'widget_id', String(widget_id));
    const responseData = await http.GetRequest<Event[]>(url);
    return responseData.data || [];
};

interface PostEventProps {
    widget_id: number;
    title?: string;
    type: EventTypeLabel;
    items: {
        event_name?: string;
        description?: string;
        location_name?: string;
        location_address?: string;
        start_date: string;
        end_date: string;
        url?: string;
        url_label?: string;
    }[];
    location: WidgetLocation | null;
}
export const postEvent = async (widget_id: number, data: PostEventProps): Promise<Event> => {
    const url = replaceUrl(Endpoints.Events.CREATE, 'widget_id', String(widget_id));
    const response = await http.PostRequest<Event>(url, data);
    return response.data || Promise.reject(new Error('Failed to create event'));
};

export interface PatchEventProps {
    event_name?: string;
    description?: string;
    location_name?: string;
    location_address?: string;
    start_date?: string;
    end_date?: string;
    url?: string;
    url_label?: string;
}

export const patchEvent = async (
    widget_id: number,
    event_id: number,
    item_id: number,
    data: PatchEventProps,
): Promise<Event> => {
    const url = replaceAllInURL({
        URL: Endpoints.Events.UPDATE,
        params: {
            widget_id: String(widget_id),
            event_id: String(event_id),
            item_id: String(item_id),
        },
    });
    const response = await http.PatchRequest<Event>(url, data);
    return response.data || Promise.reject(new Error('Failed to patch event'));
};

export const deleteEvent = async (widget_id: number, event_id: number): Promise<Event> => {
    const url = replaceAllInURL({
        URL: Endpoints.Events.DELETE,
        params: {
            widget_id: String(widget_id),
            event_id: String(event_id),
        },
    });
    const response = await http.DeleteRequest<Event>(url);
    return response.data || Promise.reject(new Error('Failed to delete event'));
};

export const sortWidgetEvents = async (widget_id: number, data: Event[]): Promise<Event> => {
    const url = replaceUrl(Endpoints.Events.SORT, 'widget_id', String(widget_id));
    const response = await http.PatchRequest<Event>(url, data);
    return response.data || Promise.reject(new Error('Failed to update sort order'));
};

export interface EventItemTranslation {
    id?: number;
    language_id?: number;
    event_item_id: number;
    event_name?: string;
    description?: string;
    location_name?: string;
    location_address?: string;
    url?: string;
    url_label?: string;
}

type ImmutableFields = 'id' | 'language_id' | 'event_item_id';
export type EventItemTranslationData = Partial<Omit<EventItemTranslation, ImmutableFields>>;

export const getEventItemTranslation = async (
    eventId: number,
    eventItemId: number,
    languageId: number,
): Promise<EventItemTranslation | null> => {
    try {
        const url = replaceAllInURL({
            URL: Endpoints.Events.GET_ITEM_TRANSLATION,
            params: {
                event_id: String(eventId),
                event_item_id: String(eventItemId),
                language_id: String(languageId),
            },
        });
        const response = await http.GetRequest<EventItemTranslation>(url);
        return response.data ?? null;
    } catch {
        return null;
    }
};

export const getEventItemTranslations = async (
    eventId: number,
    languageId: number,
): Promise<EventItemTranslation[]> => {
    try {
        const url = replaceAllInURL({
            URL: Endpoints.Events.GET_ITEM_TRANSLATIONS,
            params: {
                event_id: String(eventId),
                language_id: String(languageId),
            },
        });
        const response = await http.GetRequest<EventItemTranslation[]>(url);
        return response.data ?? [];
    } catch {
        return [];
    }
};

export const createEventItemTranslation = async (
    eventId: number,
    data: { event_item_id: number; language_id: number } & EventItemTranslationData,
): Promise<EventItemTranslation> => {
    const url = replaceUrl(Endpoints.Events.CREATE_ITEM_TRANSLATION, 'event_id', String(eventId));
    const response = await http.PostRequest<EventItemTranslation>(url, data);
    return response.data || Promise.reject(new Error('Failed to create event item translation'));
};

export const updateEventItemTranslation = async (
    eventId: number,
    translationId: number,
    data: EventItemTranslationData,
): Promise<EventItemTranslation> => {
    const url = replaceAllInURL({
        URL: Endpoints.Events.UPDATE_ITEM_TRANSLATION,
        params: {
            event_id: String(eventId),
            translation_id: String(translationId),
        },
    });
    const response = await http.PatchRequest<EventItemTranslation>(url, data);
    return response.data || Promise.reject(new Error('Failed to update event item translation'));
};

export const saveEventItemTranslation = async (
    eventId: number,
    eventItemId: number,
    languageId: number,
    data: EventItemTranslationData,
): Promise<EventItemTranslation> => {
    const existingTranslations = await getEventItemTranslations(eventId, languageId);
    const existing = existingTranslations.find((translation) => translation.event_item_id === eventItemId);
    if (existing?.id) {
        return updateEventItemTranslation(eventId, existing.id, data);
    }
    return createEventItemTranslation(eventId, { event_item_id: eventItemId, language_id: languageId, ...data });
};
