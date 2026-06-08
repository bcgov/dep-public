import React, { useContext, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import { Grid2 as Grid } from '@mui/material';
import { BodyText, Heading3 } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { useForm, FormProvider, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from 'hooks';
import { EventsContext } from './EventsContext';
import ControlledTextField from 'components/common/ControlledInputComponents/ControlledTextField';
import { openNotification } from 'services/notificationService/notificationSlice';
import {
    postEvent,
    patchEvent,
    PatchEventProps,
    getEventItemTranslations,
    saveEventItemTranslation,
} from 'services/widgetService/EventService';
import { Event, EVENT_TYPE } from 'models/event';
import { formatToUTC, formatToPacific } from 'components/common/dateHelper';
import { formEventDates } from './utils';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import { updatedDiff } from 'deep-object-diff';
import { WidgetLocation } from 'models/widget';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
    getLanguageIdByCode,
} from 'services/engagementContentTranslationService';

dayjs.extend(tz);

const schema = yup
    .object({
        event_name: yup
            .string()
            .max(100, 'Event name cannot exceed 100 characters')
            .required('Event name cannot be empty'),
        description: yup.string().max(500, 'Description cannot exceed 500 characters'),
        location_name: yup
            .string()
            .max(50, 'Location name cannot exceed 50 characters')
            .required('Location name cannot be empty'),
        location_address: yup
            .string()
            .max(100, 'Location address cannot exceed 100 characters')
            .required('Address cannot be empty'),
        date: yup.string().defined().required('Date cannot be empty'),
        time_from: yup.string().required('Time from cannot be empty'),
        time_to: yup.string().required('Time to cannot be empty'),
    })
    .required();

type InPersonEventForm = yup.TypeOf<typeof schema>;

const InPersonEventFormDrawer = () => {
    const dispatch = useAppDispatch();
    const {
        inPersonFormTabOpen,
        setInPersonFormTabOpen,
        widget,
        loadEvents,
        setEvents,
        eventToEdit,
        handleEventDrawerOpen,
    } = useContext(EventsContext);
    const [isCreating, setIsCreating] = useState(false);
    const eventItemToEdit = eventToEdit ? eventToEdit.event_items[0] : null;
    const startDate = dayjs(eventItemToEdit ? eventItemToEdit?.start_date : '').tz('US/Pacific');
    const endDate = dayjs(eventItemToEdit ? eventItemToEdit?.end_date : '').tz('US/Pacific');
    const methods = useForm<InPersonEventForm>({
        resolver: yupResolver(schema) as unknown as Resolver<InPersonEventForm>,
    });
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();

    const pad = (num: number) => {
        let timeString = num.toString();
        if (num < 10) timeString = '0' + num;
        return timeString;
    };

    useEffect(() => {
        const initializeEventForm = async () => {
            let translatedEventName = eventItemToEdit?.event_name || '';
            let translatedDescription = eventItemToEdit?.description || '';
            let translatedLocationName = eventItemToEdit?.location_name || '';
            let translatedLocationAddress = eventItemToEdit?.location_address || '';

            if (eventToEdit && widget && activeLanguageCode !== 'en') {
                const contentTranslations = await getEngagementContentTranslationsByCode(
                    widget.engagement_id,
                    activeLanguageCode,
                );
                const eventTranslation = contentTranslations.events_widgets.find(
                    (translation) => translation.widget_events_id === eventToEdit.id,
                );
                translatedEventName = eventTranslation?.title ?? translatedEventName;

                if (eventItemToEdit) {
                    const languageId = await getLanguageIdByCode(activeLanguageCode);
                    const itemTranslations = await getEventItemTranslations(eventToEdit.id, languageId);
                    const itemTranslation = itemTranslations.find(
                        (translation) => translation.event_item_id === eventItemToEdit.id,
                    );
                    if (itemTranslation) {
                        translatedDescription = itemTranslation.description ?? translatedDescription;
                        translatedLocationName = itemTranslation.location_name ?? translatedLocationName;
                        translatedLocationAddress = itemTranslation.location_address ?? translatedLocationAddress;
                    }
                }
            }

            methods.setValue('event_name', translatedEventName);
            methods.setValue('description', translatedDescription);
            methods.setValue('location_name', translatedLocationName);
            methods.setValue('location_address', translatedLocationAddress);
            methods.setValue('date', eventItemToEdit ? formatToPacific(eventItemToEdit.start_date, 'YYYY-MM-DD') : '');
            methods.setValue('time_from', pad(startDate.hour()) + ':' + pad(startDate.minute()) || '');
            methods.setValue('time_to', pad(endDate.hour()) + ':' + pad(endDate.minute()) || '');
        };

        initializeEventForm();
    }, [eventToEdit, activeLanguageCode, widget?.engagement_id]);

    const { handleSubmit, reset } = methods;

    const updateEvent = async (data: InPersonEventForm) => {
        if (eventToEdit && eventItemToEdit && widget) {
            const validatedData = await schema.validate(data);
            const { date, time_from, time_to } = validatedData;
            const { dateFrom, dateTo } = formEventDates(date, time_from, time_to);
            const eventUpdatesToPatch = updatedDiff(eventItemToEdit, {
                ...data,
            }) as PatchEventProps;

            await patchEvent(widget.id, eventToEdit.id, eventItemToEdit.id, {
                start_date: formatToUTC(dateFrom),
                end_date: formatToUTC(dateTo),
                ...eventUpdatesToPatch,
                event_name: activeLanguageCode === 'en' ? validatedData.event_name : eventItemToEdit.event_name,
                ...(activeLanguageCode !== 'en' && {
                    description: eventItemToEdit.description,
                    location_name: eventItemToEdit.location_name,
                    location_address: eventItemToEdit.location_address,
                }),
            });

            if (activeLanguageCode !== 'en') {
                const existingContentTranslations = await getEngagementContentTranslationsByCode(
                    widget.engagement_id,
                    activeLanguageCode,
                );
                const existingTranslation = existingContentTranslations.events_widgets.find(
                    (translation) => translation.widget_events_id === eventToEdit.id,
                );
                const nextTranslations = existingTranslation
                    ? existingContentTranslations.events_widgets.map((translation) =>
                          translation.widget_events_id === eventToEdit.id
                              ? { ...translation, title: validatedData.event_name }
                              : translation,
                      )
                    : [
                          ...existingContentTranslations.events_widgets,
                          {
                              widget_id: widget.id,
                              widget_events_id: eventToEdit.id,
                              title: validatedData.event_name,
                          },
                      ];

                await syncEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode, {
                    events_widgets: nextTranslations,
                });

                const languageId = await getLanguageIdByCode(activeLanguageCode);
                await saveEventItemTranslation(eventToEdit.id, eventItemToEdit.id, languageId, {
                    description: validatedData.description,
                    location_name: validatedData.location_name,
                    location_address: validatedData.location_address,
                });
            }

            handleEventDrawerOpen(EVENT_TYPE.MEETUP, false);
            dispatch(openNotification({ severity: 'success', text: 'Event was successfully updated' }));
        }
    };

    const createEvent = async (data: InPersonEventForm) => {
        const validatedData = await schema.validate(data);
        const { event_name, description, location_address, location_name, date, time_from, time_to } = validatedData;
        const { dateFrom, dateTo } = formEventDates(date, time_from, time_to);
        if (widget) {
            const createdWidgetEvent = await postEvent(widget.id, {
                widget_id: widget.id,
                type: EVENT_TYPE.OPENHOUSE,
                items: [
                    {
                        event_name: event_name,
                        description: description,
                        location_name: location_name,
                        location_address: location_address,
                        start_date: formatToUTC(dateFrom),
                        end_date: formatToUTC(dateTo),
                    },
                ],
                location: widget.location in WidgetLocation ? widget.location : null,
            });

            if (activeLanguageCode !== 'en' && createdWidgetEvent?.id) {
                const existingContentTranslations = await getEngagementContentTranslationsByCode(
                    widget.engagement_id,
                    activeLanguageCode,
                );
                const nextTranslations = [
                    ...existingContentTranslations.events_widgets,
                    {
                        widget_id: widget.id,
                        widget_events_id: createdWidgetEvent.id,
                        title: event_name,
                    },
                ];
                await syncEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode, {
                    events_widgets: nextTranslations,
                });

                const createdEventItemId = createdWidgetEvent.event_items?.[0]?.id;
                if (createdEventItemId) {
                    const languageId = await getLanguageIdByCode(activeLanguageCode);
                    await saveEventItemTranslation(createdWidgetEvent.id, createdEventItemId, languageId, {
                        description: description,
                        location_name: location_name,
                        location_address: location_address,
                    });
                }
            }

            setEvents((prevWidgetEvents: Event[]) => [...prevWidgetEvents, createdWidgetEvent]);
        }
        dispatch(openNotification({ severity: 'success', text: 'A new event was successfully added' }));
    };

    const saveEvent = async (data: InPersonEventForm) => {
        if (eventItemToEdit) {
            return updateEvent(data);
        }
        return createEvent(data);
    };

    const onSubmit: SubmitHandler<InPersonEventForm> = async (data: InPersonEventForm) => {
        if (!widget) {
            return;
        }
        try {
            setIsCreating(true);
            await saveEvent(data);
            loadEvents();
            setIsCreating(false);
            reset({});
            setInPersonFormTabOpen(false);
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'An error occurred while trying to add event' }));
            setIsCreating(false);
        }
    };

    return (
        <Drawer
            anchor="right"
            open={inPersonFormTabOpen}
            onClose={() => {
                handleEventDrawerOpen(EVENT_TYPE.MEETUP, false);
            }}
        >
            <Box sx={{ width: '40vw', paddingTop: '7em' }} role="presentation">
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid
                            container
                            direction="row"
                            alignItems="baseline"
                            justifyContent="flex-start"
                            spacing={2}
                            padding="2em"
                        >
                            <Grid size={12}>
                                <Heading3 bold>{eventItemToEdit ? 'Edit' : 'Add'} In-Person Event</Heading3>
                                <Divider sx={{ marginTop: '1em' }} />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Event Name
                                </BodyText>
                                <ControlledTextField name="event_name" />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Description
                                </BodyText>
                                <ControlledTextField name="description" multiline minRows={4} />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Location Name
                                </BodyText>
                                <ControlledTextField name="location_name" />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Location Address
                                </BodyText>
                                <ControlledTextField name="location_address" />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Date
                                </BodyText>
                                <ControlledTextField name="date" type="date" />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Time - From
                                </BodyText>
                                <ControlledTextField name="time_from" type="time" />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Time - To
                                </BodyText>
                                <ControlledTextField name="time_to" type="time" />
                            </Grid>
                            <Grid
                                size={12}
                                container
                                direction="row"
                                spacing={1}
                                justifyContent={'flex-start'}
                                marginTop="2em"
                            >
                                <Grid>
                                    <Button variant="primary" type="submit" loading={isCreating}>
                                        Save &amp; Close
                                    </Button>
                                </Grid>
                                <Grid>
                                    <Button onClick={() => handleEventDrawerOpen(EVENT_TYPE.MEETUP, false)}>
                                        Cancel
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </form>
                </FormProvider>
            </Box>
        </Drawer>
    );
};

export default InPersonEventFormDrawer;
