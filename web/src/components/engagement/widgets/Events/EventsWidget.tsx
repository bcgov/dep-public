import React, { useEffect, useState } from 'react';
import { Grid2 as Grid, Skeleton, Paper, ThemeProvider } from '@mui/material';
import { Widget } from 'models/widget';
import { Event, EVENT_TYPE } from 'models/event';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { Switch, Case } from 'react-if';
import { EventItemTranslation, getEventItemTranslations, getEvents } from 'services/widgetService/EventService';
import VirtualSession from './VirtualSession';
import InPersonEvent from './InPersonEvent';
import { Heading2, BodyText } from 'components/common/Typography';
import { BaseTheme } from 'styles/Theme';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { resolveTranslationValue } from 'components/engagement/public/view/engagementTranslationResolution';
import { getLanguageIdByCode } from 'services/engagementContentTranslationService';

interface EventsWidgetProps {
    widget: Widget;
}
const EventsWidget = ({ widget }: EventsWidgetProps) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
    const [currentEventItemTranslationsById, setCurrentEventItemTranslationsById] = useState<
        Map<number, EventItemTranslation>
    >(new Map());
    const [defaultEventItemTranslationsById, setDefaultEventItemTranslationsById] = useState<
        Map<number, EventItemTranslation>
    >(new Map());
    const { translationBundle } = useEngagementLoaderData();
    const loadedTranslationBundle = React.use(translationBundle);

    const currentEventTranslationsById = new Map(
        loadedTranslationBundle.currentContentTranslations.events_widgets.map((translation) => [
            translation.widget_events_id,
            translation,
        ]),
    );
    const defaultEventTranslationsById = new Map(
        loadedTranslationBundle.defaultContentTranslations.events_widgets.map((translation) => [
            translation.widget_events_id,
            translation,
        ]),
    );

    const fetchEvents = async () => {
        try {
            const loadedEvents = await getEvents(widget.id);

            const currentEventItemTranslations = new Map<number, EventItemTranslation>();
            const defaultEventItemTranslations = new Map<number, EventItemTranslation>();

            const activeLanguageCode = loadedTranslationBundle.activeLanguageCode;
            const defaultLanguageCode = loadedTranslationBundle.defaultLanguageCode;
            const [activeLanguageId, defaultLanguageId] = await Promise.all([
                getLanguageIdByCode(activeLanguageCode).catch(() => null),
                activeLanguageCode === defaultLanguageCode
                    ? Promise.resolve(null)
                    : getLanguageIdByCode(defaultLanguageCode).catch(() => null),
            ]);

            if (activeLanguageId) {
                const activeTranslationSets = await Promise.all(
                    loadedEvents.map((event) => getEventItemTranslations(event.id, activeLanguageId)),
                );
                activeTranslationSets.flat().forEach((translation) => {
                    currentEventItemTranslations.set(translation.event_item_id, translation);
                });
            }

            if (defaultLanguageId) {
                const defaultTranslationSets = await Promise.all(
                    loadedEvents.map((event) => getEventItemTranslations(event.id, defaultLanguageId)),
                );
                defaultTranslationSets.flat().forEach((translation) => {
                    defaultEventItemTranslations.set(translation.event_item_id, translation);
                });
            }

            setCurrentEventItemTranslationsById(currentEventItemTranslations);
            setDefaultEventItemTranslationsById(defaultEventItemTranslations);
            setEvents(loadedEvents);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.log(error);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while fetching Engagement widgets information',
                }),
            );
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [widget, loadedTranslationBundle.activeLanguageCode, loadedTranslationBundle.defaultLanguageCode]);

    if (isLoading) {
        return (
            <Grid container justifyContent="flex-start" flexDirection={'column'} size={12} paddingBottom={0}>
                <Heading2 mb={0} pb={0}>
                    <Skeleton variant="rectangular" sx={{ width: '90%' }} />
                </Heading2>
                <BodyText m="1rem 0 1.5rem;">
                    <Skeleton variant="text" sx={{ width: '80%' }} />
                </BodyText>
                <ThemeProvider theme={BaseTheme}>
                    <Paper elevation={1} sx={{ padding: '1em' }}>
                        <Grid container justifyContent="flex-start" spacing={3}>
                            <Grid size={12}></Grid>
                            <Grid size={12}>
                                <Skeleton variant="rectangular" height="3em" />
                            </Grid>
                            <Grid size={12}>
                                <Skeleton variant="rectangular" height="1.5em" />
                            </Grid>
                            <Grid size={12}>
                                <Skeleton variant="rectangular" height="1.5em" />
                            </Grid>
                        </Grid>
                    </Paper>
                </ThemeProvider>
            </Grid>
        );
    }

    if (events.length === 0) {
        return null;
    }

    return (
        <Grid container justifyContent="flex-start" flexDirection={'column'} size={12} paddingBottom={0}>
            {events.map((event: Event) => {
                const eventItem = event.event_items[0];
                const resolvedEventName =
                    resolveTranslationValue<string>({
                        translatedValue: currentEventTranslationsById.get(event.id)?.title,
                        defaultValue: defaultEventTranslationsById.get(event.id)?.title,
                        baseValue: eventItem.event_name,
                    }).value ?? eventItem.event_name;

                const localizedEventItem = {
                    ...eventItem,
                    description:
                        resolveTranslationValue<string>({
                            translatedValue: currentEventItemTranslationsById.get(eventItem.id)?.description,
                            defaultValue: defaultEventItemTranslationsById.get(eventItem.id)?.description,
                            baseValue: eventItem.description,
                        }).value ?? eventItem.description,
                    location_name:
                        resolveTranslationValue<string>({
                            translatedValue: currentEventItemTranslationsById.get(eventItem.id)?.location_name,
                            defaultValue: defaultEventItemTranslationsById.get(eventItem.id)?.location_name,
                            baseValue: eventItem.location_name,
                        }).value ?? eventItem.location_name,
                    location_address:
                        resolveTranslationValue<string>({
                            translatedValue: currentEventItemTranslationsById.get(eventItem.id)?.location_address,
                            defaultValue: defaultEventItemTranslationsById.get(eventItem.id)?.location_address,
                            baseValue: eventItem.location_address,
                        }).value ?? eventItem.location_address,
                    url:
                        resolveTranslationValue<string>({
                            translatedValue: currentEventItemTranslationsById.get(eventItem.id)?.url,
                            defaultValue: defaultEventItemTranslationsById.get(eventItem.id)?.url,
                            baseValue: eventItem.url,
                        }).value ?? eventItem.url,
                    url_label:
                        resolveTranslationValue<string>({
                            translatedValue: currentEventItemTranslationsById.get(eventItem.id)?.url_label,
                            defaultValue: defaultEventItemTranslationsById.get(eventItem.id)?.url_label,
                            baseValue: eventItem.url_label,
                        }).value ?? eventItem.url_label,
                };

                return (
                    <>
                        <Heading2 mb={0} pb={0}>
                            {resolvedEventName}
                        </Heading2>
                        <BodyText m="1rem 0 1.5rem;">{localizedEventItem.description}</BodyText>
                        <ThemeProvider key={event.id} theme={BaseTheme}>
                            <Paper elevation={1} sx={{ minHeight: '12em', p: '2em', mb: '2.5rem' }}>
                                <Grid
                                    container
                                    columnSpacing={1}
                                    rowSpacing={1}
                                    margin={0}
                                    size={12}
                                    lineHeight="2.25rem"
                                >
                                    <Switch>
                                        <Case condition={event.type === EVENT_TYPE.VIRTUAL}>
                                            <VirtualSession eventItem={localizedEventItem} />
                                        </Case>
                                        <Case
                                            condition={
                                                event.type === EVENT_TYPE.OPENHOUSE || event.type === EVENT_TYPE.MEETUP
                                            }
                                        >
                                            <InPersonEvent eventItem={localizedEventItem} />
                                        </Case>
                                    </Switch>
                                </Grid>
                            </Paper>
                        </ThemeProvider>
                    </>
                );
            })}
        </Grid>
    );
};

export default EventsWidget;
