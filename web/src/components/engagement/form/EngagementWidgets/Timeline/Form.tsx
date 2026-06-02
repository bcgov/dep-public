import React, { useContext, useEffect } from 'react';
import Divider from '@mui/material/Divider';
import { Grid2 as Grid, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { TextField } from 'components/common/Input';
import { Button } from 'components/common/Input/Button';
import { BodyText } from 'components/common/Typography/Body';
import { MidScreenLoader } from 'components/common';
import { SubmitHandler } from 'react-hook-form';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { TimelineContext } from './TimelineContext';
import {
    patchTimeline,
    postTimeline,
    getTimelineEventTranslationsByLanguage,
    postTimelineEventTranslation,
    patchTimelineEventTranslation,
    TimelineEventTranslation,
} from 'services/widgetService/TimelineService';
import { WidgetTitle } from '../WidgetTitle';
import { TimelineEvent, TimelineWidget } from 'models/timelineWidget';
import { WidgetLocation } from 'models/widget';
import { Heading3 } from 'components/common/Typography';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    getLanguageIdByCode,
    syncEngagementContentTranslationsByCode,
    TimelineWidgetTranslation,
} from 'services/engagementContentTranslationService';

interface DetailsForm {
    title: string;
    description: string;
    events: TimelineEvent[];
}

interface WidgetState {
    title: string;
    description: string;
}

const Form = () => {
    const dispatch = useAppDispatch();
    const { widget, isLoadingTimelineWidget, timelineWidget } = useContext(TimelineContext);
    const { setWidgetDrawerOpen } = useContext(WidgetDrawerContext);
    const [isCreating, setIsCreating] = React.useState(false);
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();

    const newEvent: TimelineEvent = {
        id: 0,
        widget_id: widget?.id || 0,
        timeline_id: 0,
        engagement_id: widget?.engagement_id || 0,
        description: '',
        time: '',
        status: 1,
        position: 0,
    };

    const [timelineEvents, setTimelineEvents] = React.useState<TimelineEvent[]>(
        timelineWidget ? timelineWidget.events.toSorted((a, b) => a.position - b.position) : [newEvent],
    );
    const [timelineWidgetState, setTimelineWidgetState] = React.useState<WidgetState>({
        description: timelineWidget?.description || '',
        title: timelineWidget?.title || '',
    });

    const timelineEventStatusTypes = [
        {
            title: 'Pending',
            value: 1,
        },
        {
            title: 'In Progress',
            value: 2,
        },
        {
            title: 'Completed',
            value: 3,
        },
    ];

    const translateTimelineWidget = (
        timelineWidget: TimelineWidget,
        timelineTranslation?: TimelineWidgetTranslation,
    ) => {
        if (timelineTranslation) {
            setTimelineWidgetState({
                ...timelineWidget,
                title: timelineTranslation.title ?? timelineWidget.title,
                description: timelineTranslation.description ?? timelineWidget.description,
            });
        }
    };

    const translateTimelineEvents = (timelineWidget: TimelineWidget, eventTranslations: TimelineEventTranslation[]) => {
        if (eventTranslations.length > 0) {
            const translatedEvents = timelineWidget.events.map((event: TimelineEvent) => {
                const eventTr = eventTranslations.find((t) => t.timeline_event_id === event.id);
                if (!eventTr) return event;
                return {
                    ...event,
                    description: eventTr.description ?? event.description,
                };
            });
            setTimelineEvents(translatedEvents.toSorted((a, b) => a.position - b.position));
        }
    };

    const initializeTranslations = async () => {
        if (!timelineWidget) {
            return;
        }

        const currentTimelineWidget = timelineWidget;

        setTimelineEvents(currentTimelineWidget.events.toSorted((a, b) => a.position - b.position));
        if (activeLanguageCode === 'en' || !widget) {
            return;
        }
        const [contentTranslations, languageId] = await Promise.all([
            getEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode),
            getLanguageIdByCode(activeLanguageCode),
        ]);
        const timelineTranslation = contentTranslations.timeline_widgets.find(
            (t) => t.widget_timeline_id === currentTimelineWidget.id,
        );
        translateTimelineWidget(currentTimelineWidget, timelineTranslation);
        const eventTranslations = await getTimelineEventTranslationsByLanguage(currentTimelineWidget.id, languageId);
        translateTimelineEvents(currentTimelineWidget, eventTranslations);
    };

    useEffect(() => {
        if (!timelineWidget) return;
        setTimelineWidgetState(timelineWidget);
        initializeTranslations();
    }, [timelineWidget, activeLanguageCode, widget?.id]);

    const createTimeline = async (data: DetailsForm) => {
        if (!widget) {
            return;
        }

        const { title, description, events } = data;
        await postTimeline(widget.id, {
            widget_id: widget.id,
            engagement_id: widget.engagement_id,
            title: title,
            description: description,
            events: events,
            location: widget.location in WidgetLocation ? widget.location : null,
        });
        dispatch(openNotification({ severity: 'success', text: 'A new timeline was successfully added' }));
    };

    const updateTimeline = async (data: DetailsForm) => {
        if (!widget || !timelineWidget) {
            return;
        }

        if (Object.keys(data).length === 0) {
            return;
        }

        if (activeLanguageCode == 'en') {
            await patchTimeline(widget.id, timelineWidget.id, { ...data });
        } else {
            const [existingTranslations, languageId] = await Promise.all([
                getEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode),
                getLanguageIdByCode(activeLanguageCode),
            ]);
            const existingTimelineTranslations = existingTranslations.timeline_widgets;
            const existingRecord = existingTimelineTranslations.find((t) => t.widget_timeline_id === timelineWidget.id);
            const updatedRecord = existingRecord
                ? { ...existingRecord, title: data.title, description: data.description }
                : {
                      widget_id: widget.id,
                      widget_timeline_id: timelineWidget.id,
                      title: data.title,
                      description: data.description,
                  };
            const otherTranslations = existingTimelineTranslations.filter(
                (t) => t.widget_timeline_id !== timelineWidget.id,
            );
            const existingEventTranslations = await getTimelineEventTranslationsByLanguage(
                timelineWidget.id,
                languageId,
            );
            await syncEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode, {
                timeline_widgets: [...otherTranslations, updatedRecord],
            });
            await Promise.all(
                data.events
                    .filter((event) => event.id > 0)
                    .map((event) => {
                        const existing = existingEventTranslations.find((t) => t.timeline_event_id === event.id);
                        if (existing) {
                            return patchTimelineEventTranslation(timelineWidget.id, existing.id, {
                                description: event.description ?? '',
                                time: event.time ?? '',
                            });
                        }
                        return postTimelineEventTranslation(timelineWidget.id, {
                            timeline_event_id: event.id,
                            language_id: languageId,
                            description: event.description ?? '',
                            time: event.time ?? '',
                        });
                    }),
            );
        }

        dispatch(openNotification({ severity: 'success', text: 'The timeline widget was successfully updated' }));
    };

    const saveTimelineWidget = (data: DetailsForm) => {
        if (!timelineWidget) {
            return createTimeline(data);
        }
        return updateTimeline(data);
    };

    const onSubmit: SubmitHandler<DetailsForm> = async (data: DetailsForm) => {
        if (!widget) {
            return;
        }
        try {
            setIsCreating(true);
            await saveTimelineWidget(data);
            setIsCreating(false);
            setWidgetDrawerOpen(false);
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'An error occurred while trying to add the event' }));
            setIsCreating(false);
        }
    };

    const handleOnSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const eventsForSubmission = [...timelineEvents];
        eventsForSubmission.forEach((event, index) => {
            event.position = index;
        });
        eventsForSubmission.sort((a, b) => a.position - b.position);
        const formData = new FormData(event.currentTarget);
        const restructuredData = {
            title: ((formData.get('title') as string) ?? '').trim(),
            description: ((formData.get('description') as string) ?? '').trim(),
            events: eventsForSubmission,
        };
        setTimelineEvents(eventsForSubmission);
        onSubmit(restructuredData);
    };

    const handleAddEvent = () => {
        if (!timelineEvents) {
            return;
        }
        const newEventWithCorrectIndex = newEvent;
        newEventWithCorrectIndex.position = timelineEvents.length;
        setTimelineEvents([...timelineEvents, newEventWithCorrectIndex]);
    };

    const handleRemoveEvent = (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (!event || !timelineEvents) {
            return;
        }
        const position = Number(event.currentTarget.value);
        const dataToSplice: TimelineEvent[] = [...timelineEvents];
        dataToSplice.splice(position, 1);
        dataToSplice.forEach((event, index) => {
            event.position = index;
        });
        setTimelineEvents([...dataToSplice]);
    };

    const handleTextChange = (newValue: string, property: string) => {
        if (!timelineEvents) {
            return;
        }
        if ('description' === property) {
            setTimelineWidgetState({ ...timelineWidgetState, description: newValue });
        } else if ('title' === property) {
            setTimelineWidgetState({ ...timelineWidgetState, title: newValue });
        }
    };

    const handleEventTextChange = (newValue: string, index: number, property: string) => {
        if (!timelineEvents) {
            return;
        }
        const newArray = [...timelineEvents];
        if ('description' === property) {
            newArray[index].description = newValue;
            setTimelineEvents([...newArray]);
        } else if ('time' === property) {
            newArray[index].time = newValue;
            setTimelineEvents([...newArray]);
        }
    };

    const handleSelectChange = (e: SelectChangeEvent<string>, index: number) => {
        if (!timelineEvents) {
            return;
        }
        const newValue = e.target.value;
        const newArray = [...timelineEvents];
        newArray[index].status = Number(newValue);
        setTimelineEvents([...newArray]);
    };

    if (isLoadingTimelineWidget || !widget) {
        return (
            <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start" spacing={2}>
                <Grid size={12}>
                    <MidScreenLoader />
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid size={12} container alignItems="flex-start" justifyContent={'flex-start'} spacing={3}>
            <Grid size={12}>
                <WidgetTitle widget={widget} />
                <Divider sx={{ marginTop: '0.5em' }} />
            </Grid>
            <Grid size={12}>
                <form onSubmit={(event) => handleOnSubmit(event)} id="timelineForm">
                    <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start" spacing={2}>
                        <Grid size={12}>
                            <TextField
                                title="Title"
                                instructions="The title must be less than 255 characters."
                                name="title"
                                value={timelineWidgetState?.title}
                                onChange={(newValue) => {
                                    handleTextChange(newValue, 'title');
                                }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                name="description"
                                title="Description"
                                multiline
                                rows={4}
                                value={timelineWidgetState?.description}
                                onChange={(newValue) => {
                                    handleTextChange(newValue, 'description');
                                }}
                            />
                        </Grid>
                        <Grid
                            size={12}
                            container
                            direction="column"
                            alignItems={'stretch'}
                            justifyContent="flex-start"
                            spacing={2}
                            mt={'3em'}
                        >
                            {timelineEvents?.map((tEvent, index) => {
                                return (
                                    <Grid
                                        className={`event${index + 1}`}
                                        key={`event${index + 1}`}
                                        spacing={1}
                                        container
                                        mb={'1em'}
                                        size={12}
                                    >
                                        <Heading3 bold>{`Event ${index + 1}`}</Heading3>

                                        <Grid size={12}>
                                            <BodyText bold>Event Description</BodyText>
                                            <BodyText size="small">Describe the timeline event.</BodyText>
                                            <TextField
                                                name={'eventDescription' + (index + 1)}
                                                id={'eventDescription' + (index + 1)}
                                                value={tEvent.description}
                                                onChange={(newValue) => {
                                                    handleEventTextChange(newValue, index, 'description');
                                                }}
                                            />
                                        </Grid>

                                        <Grid size={12}>
                                            <BodyText bold>Event Time</BodyText>
                                            <BodyText size="small">When did the event happen?</BodyText>
                                            <TextField
                                                name={'eventTime' + (index + 1)}
                                                id={'eventTime' + (index + 1)}
                                                value={tEvent.time}
                                                onChange={(newValue) => {
                                                    handleEventTextChange(newValue, index, 'time');
                                                }}
                                            />
                                        </Grid>

                                        <Grid size={12}>
                                            <BodyText bold>Event Status</BodyText>
                                            <Select
                                                name={'eventStatus' + (index + 1)}
                                                id={'eventStatus' + (index + 1)}
                                                variant="outlined"
                                                value={tEvent.status?.toString()}
                                                defaultValue="Select an event status"
                                                fullWidth
                                                onChange={(event: SelectChangeEvent<string>) => {
                                                    handleSelectChange(event, index);
                                                }}
                                            >
                                                {timelineEventStatusTypes.map((statusType) => (
                                                    <MenuItem
                                                        key={`status-type-${statusType.value || 1}`}
                                                        value={statusType.value || 1}
                                                    >
                                                        {statusType.title || 'Pending'}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </Grid>

                                        <Grid size={12} sx={{ marginTop: '8px' }}>
                                            <Button
                                                size="small"
                                                disabled={timelineEvents.length <= 1}
                                                value={index}
                                                onClick={handleRemoveEvent}
                                            >
                                                Remove Event
                                            </Button>
                                        </Grid>

                                        <Grid size={12}>
                                            <Divider sx={{ marginTop: '1em' }} />
                                        </Grid>
                                    </Grid>
                                );
                            })}
                            <Grid>
                                <Button size="small" variant="primary" onClick={() => handleAddEvent()}>
                                    Add Event
                                </Button>
                            </Grid>
                        </Grid>

                        <Grid
                            size={12}
                            container
                            direction="row"
                            alignItems={'flex-start'}
                            justifyContent="flex-start"
                            spacing={2}
                            mt={'3em'}
                        >
                            <Grid>
                                <Button variant="primary" type="submit" disabled={isCreating}>
                                    Save & Close
                                </Button>
                            </Grid>
                            <Grid>
                                <Button onClick={() => setWidgetDrawerOpen(false)}>Cancel</Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </form>
            </Grid>
        </Grid>
    );
};

export default Form;
