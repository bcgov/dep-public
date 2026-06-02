import React, { createContext, JSX, useContext, useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from 'hooks';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { Widget, WidgetType } from 'models/widget';
import { getEvents, sortWidgetEvents, getEventItemTranslations } from 'services/widgetService/EventService';
import { EVENT_TYPE, Event, EventTypeLabel } from 'models/event';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    getLanguageIdByCode,
} from 'services/engagementContentTranslationService';

export interface EventsContextProps {
    inPersonFormTabOpen: boolean;
    setInPersonFormTabOpen: React.Dispatch<React.SetStateAction<boolean>>;
    virtualSessionFormTabOpen: boolean;
    setVirtualSessionFormTabOpen: React.Dispatch<React.SetStateAction<boolean>>;
    widget: Widget | null;
    loadEvents: () => void;
    isLoadingEvents: boolean;
    events: Event[];
    eventToEdit: Event | null;
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
    handleChangeEventToEdit: (_event: Event | null) => void;
    handleEventDrawerOpen: (_event: EventTypeLabel, _open: boolean) => void;
    updateWidgetEventsSorting: (widget_events: Event[]) => void;
}

export type EngagementParams = {
    engagementId: string;
};

export const EventsContext = createContext<EventsContextProps>({
    inPersonFormTabOpen: false,
    virtualSessionFormTabOpen: false,
    setInPersonFormTabOpen: () => {
        throw new Error('setInPersonFormTabOpen not implemented');
    },
    setVirtualSessionFormTabOpen: () => {
        throw new Error('setVirtualSessionFormTab not implemented');
    },
    widget: null,
    loadEvents: () => {
        throw new Error('loadEvents not implemented');
    },
    isLoadingEvents: false,
    setEvents: (updatedEvent: React.SetStateAction<Event[]>) => [],
    events: [],
    eventToEdit: null,
    handleChangeEventToEdit: () => {
        /* empty default method  */
    },
    handleEventDrawerOpen: (_event: EventTypeLabel, _open: boolean) => {
        /* empty default method  */
    },
    updateWidgetEventsSorting: (widget_events: Event[]) => {
        /* empty default method  */
    },
});

export const EventsProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const dispatch = useAppDispatch();
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const { widgets, isWidgetInScope } = useContext(WidgetDrawerContext);
    const widget =
        widgets.find((widget) => isWidgetInScope(widget) && widget.widget_type_id === WidgetType.Events) || null;
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const [inPersonFormTabOpen, setInPersonFormTabOpen] = useState(false);
    const [virtualSessionFormTabOpen, setVirtualSessionFormTabOpen] = useState(false);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);

    const loadEvents = async () => {
        if (!widget) {
            return;
        }
        try {
            setIsLoadingEvents(true);
            const loadedEvents = await getEvents(widget.id);
            if (activeLanguageCode === 'en') {
                setEvents(loadedEvents);
            } else {
                const [contentTranslations, languageId] = await Promise.all([
                    getEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode),
                    getLanguageIdByCode(activeLanguageCode),
                ]);
                const eventTranslationsById = new Map(
                    contentTranslations.events_widgets.map((translation) => [
                        translation.widget_events_id,
                        translation,
                    ]),
                );

                const itemTranslationsByEvent = new Map(
                    await Promise.all(
                        loadedEvents.map(async (eventRecord) => {
                            const translations = await getEventItemTranslations(eventRecord.id, languageId);
                            return [eventRecord.id, translations] as const;
                        }),
                    ),
                );

                setEvents(
                    loadedEvents.map((eventRecord) => {
                        const translatedEvent = eventTranslationsById.get(eventRecord.id);
                        if (!translatedEvent) {
                            return eventRecord;
                        }

                        const eventItems = eventRecord.event_items?.map((item, index) => {
                            if (index !== 0) {
                                return item;
                            }
                            const eventItemTranslations = itemTranslationsByEvent.get(eventRecord.id) ?? [];
                            const itemTranslation = eventItemTranslations.find(
                                (translation) => translation.event_item_id === item.id,
                            );
                            return {
                                ...item,
                                event_name: translatedEvent?.title ?? item.event_name,
                                description: itemTranslation?.description ?? item.description,
                                location_name: itemTranslation?.location_name ?? item.location_name,
                                location_address: itemTranslation?.location_address ?? item.location_address,
                                url_label: itemTranslation?.url_label ?? item.url_label,
                            };
                        });

                        return {
                            ...eventRecord,
                            event_items: eventItems,
                        };
                    }),
                );
            }
            setIsLoadingEvents(false);
        } catch {
            dispatch(
                openNotification({ severity: 'error', text: 'An error occurred while trying to load the events' }),
            );
        }
    };

    const handleChangeEventToEdit = (event: Event | null) => {
        setEventToEdit(event);
    };

    const handleEventDrawerOpen = (type: EventTypeLabel, open: boolean) => {
        if (type === EVENT_TYPE.OPENHOUSE || type === EVENT_TYPE.MEETUP) {
            setInPersonFormTabOpen(open);
        } else if (type === EVENT_TYPE.VIRTUAL) {
            setVirtualSessionFormTabOpen(open);
        }
        if (!open && eventToEdit) {
            setEventToEdit(null);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [widget, activeLanguageCode]);

    const updateWidgetEventsSorting = async (resortedWidgetEvents: Event[]) => {
        if (!widget) {
            return;
        }
        try {
            await sortWidgetEvents(widget.id, resortedWidgetEvents);
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'Error sorting widget events' }));
        }
    };

    const contextValue = useMemo(
        () => ({
            virtualSessionFormTabOpen,
            setVirtualSessionFormTabOpen,
            inPersonFormTabOpen,
            setInPersonFormTabOpen,
            eventToEdit,
            handleChangeEventToEdit,
            handleEventDrawerOpen,
            widget,
            loadEvents,
            isLoadingEvents,
            setEvents,
            events,
            updateWidgetEventsSorting,
        }),
        [
            virtualSessionFormTabOpen,
            setVirtualSessionFormTabOpen,
            inPersonFormTabOpen,
            setInPersonFormTabOpen,
            eventToEdit,
            handleChangeEventToEdit,
            handleEventDrawerOpen,
            widget,
            loadEvents,
            isLoadingEvents,
            setEvents,
            events,
            updateWidgetEventsSorting,
        ],
    );

    return <EventsContext.Provider value={contextValue}>{children}</EventsContext.Provider>;
};
