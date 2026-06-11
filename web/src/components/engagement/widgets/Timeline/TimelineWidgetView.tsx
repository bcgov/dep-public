import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Grid2 as Grid, Skeleton, Paper, ThemeProvider, Box } from '@mui/material';
import { Widget } from 'models/widget';
import { TimelineEvent as TimelineEventType, EventStatus, TimelineWidget } from 'models/timelineWidget';
import { fetchTimelineWidgets, getTimelineEventTranslationsByLanguage } from 'services/widgetService/TimelineService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BaseTheme } from 'styles/Theme';
import { BodyText, Heading3 } from 'components/common/Typography';
import { faCircle, faCircleHalf } from '@fortawesome/pro-solid-svg-icons';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { resolveTranslationValue } from 'components/engagement/public/view/engagementTranslationResolution';
import { getLanguageIdByCode } from 'services/engagementContentTranslationService';
interface TimelineWidgetProps {
    widget: Widget;
}

const TimelineWidgetView = ({ widget }: TimelineWidgetProps) => {
    const { translationBundle } = useEngagementLoaderData();
    const resolvedTranslationBundle = React.use(translationBundle);
    const [timelineWidget, setTimelineWidget] = useState<TimelineWidget | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTimelineEventTranslationsById, setCurrentTimelineEventTranslationsById] = useState<
        Map<number, { description: string | null; time: string | null }>
    >(new Map());

    const currentTimelineTranslationsById = useMemo(
        () =>
            new Map(
                resolvedTranslationBundle.currentContentTranslations.timeline_widgets.map((translation) => [
                    translation.widget_timeline_id,
                    translation,
                ]),
            ),
        [resolvedTranslationBundle.currentContentTranslations.timeline_widgets],
    );

    const defaultTimelineTranslationsById = useMemo(
        () =>
            new Map(
                resolvedTranslationBundle.defaultContentTranslations.timeline_widgets.map((translation) => [
                    translation.widget_timeline_id,
                    translation,
                ]),
            ),
        [resolvedTranslationBundle.defaultContentTranslations.timeline_widgets],
    );

    useEffect(() => {
        let isMounted = true;

        const loadTimelineData = async () => {
            setIsLoading(true);

            const timelineWidgets = await fetchTimelineWidgets(widget.id).catch(() => []);
            const nextTimelineWidget = timelineWidgets[0] ?? null;

            const nextCurrentTimelineEventTranslationsById = new Map<
                number,
                { description: string | null; time: string | null }
            >();

            if (nextTimelineWidget) {
                const activeLanguageCode = resolvedTranslationBundle.activeLanguageCode;
                const defaultLanguageCode = resolvedTranslationBundle.defaultLanguageCode;

                if (activeLanguageCode !== defaultLanguageCode) {
                    const activeLanguageId = await getLanguageIdByCode(activeLanguageCode).catch(() => null);
                    if (activeLanguageId) {
                        const activeTranslations = await getTimelineEventTranslationsByLanguage(
                            nextTimelineWidget.id,
                            activeLanguageId,
                        );
                        activeTranslations.forEach((translation) => {
                            nextCurrentTimelineEventTranslationsById.set(translation.timeline_event_id, translation);
                        });
                    }
                }
            }

            if (!isMounted) {
                return;
            }

            setTimelineWidget(nextTimelineWidget);
            setCurrentTimelineEventTranslationsById(nextCurrentTimelineEventTranslationsById);
            setIsLoading(false);
        };

        loadTimelineData();

        return () => {
            isMounted = false;
        };
    }, [widget.id, resolvedTranslationBundle.activeLanguageCode, resolvedTranslationBundle.defaultLanguageCode]);

    if (isLoading) {
        return <Skeleton variant="rectangular" height={200} />;
    }

    if (!timelineWidget) {
        return null;
    }

    const resolvedTimelineTitle =
        resolveTranslationValue<string>({
            translatedValue: currentTimelineTranslationsById.get(timelineWidget.id)?.title,
            defaultValue: defaultTimelineTranslationsById.get(timelineWidget.id)?.title,
            baseValue: timelineWidget.title,
        }).value ?? timelineWidget.title;
    const resolvedTimelineDescription =
        resolveTranslationValue<string>({
            translatedValue: currentTimelineTranslationsById.get(timelineWidget.id)?.description,
            defaultValue: defaultTimelineTranslationsById.get(timelineWidget.id)?.description,
            baseValue: timelineWidget.description,
        }).value ?? timelineWidget.description;

    return (
        <Suspense fallback={<Skeleton variant="rectangular" height={200} />}>
            <Grid container gap="1rem">
                <Grid size={12}>
                    <Heading3 weight="thin">{resolvedTimelineTitle}</Heading3>
                </Grid>
                <Grid size={12}>
                    <BodyText>{resolvedTimelineDescription}</BodyText>
                </Grid>
                <Grid
                    size={12}
                    component={Paper}
                    sx={{
                        mt: '1.5rem',
                        bgcolor: 'white',
                        padding: '2em',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'blue.90',
                        height: 'fit-content',
                    }}
                >
                    <ThemeProvider theme={BaseTheme}>
                        {timelineWidget.events.map((event, index) => (
                            <Grid container size={12} key={event.id} direction="row">
                                <TimelineEvent
                                    event={{
                                        ...event,
                                        description:
                                            resolveTranslationValue<string>({
                                                translatedValue: currentTimelineEventTranslationsById.get(event.id)
                                                    ?.description,
                                                defaultValue: null,
                                                baseValue: event.description,
                                            }).value ?? event.description,
                                        time:
                                            resolveTranslationValue<string>({
                                                translatedValue: currentTimelineEventTranslationsById.get(event.id)
                                                    ?.time,
                                                defaultValue: null,
                                                baseValue: event.time,
                                            }).value ?? event.time,
                                    }}
                                    isLast={index === timelineWidget.events.length - 1}
                                />
                            </Grid>
                        ))}
                    </ThemeProvider>
                </Grid>
            </Grid>
        </Suspense>
    );
};

export default TimelineWidgetView;

const TimelineEvent = ({ event, isLast }: { event: TimelineEventType; isLast: boolean }) => {
    return (
        <Grid container direction="row" gap={2} alignItems="stretch" justifyContent="flex-start">
            {/* Left side with icon and line */}
            <Grid container alignItems="stretch" direction="column" sx={{ width: '3rem' }}>
                {/* Event Icon */}
                <Grid>
                    <Paper
                        sx={{
                            height: '1.5em',
                            width: '1.5em',
                            borderRadius: '50%',
                            border: '1px solid',
                            borderColor: 'blue.90',
                            fontSize: '32px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            display: 'flex',
                            color: 'blue.90',
                        }}
                    >
                        {event.status === EventStatus.Completed && <FontAwesomeIcon icon={faCircle} />}
                        {event.status === EventStatus.InProgress && (
                            <FontAwesomeIcon rotation={270} icon={faCircleHalf} />
                        )}
                    </Paper>
                </Grid>
                {/* Dividing line */}
                {!isLast && (
                    <Grid size="grow" alignItems="center" direction="column">
                        <Box
                            sx={{
                                height: 'calc(100% + 2em)',
                                width: 'calc(50% - 1px)',
                                borderRight: '4px solid',
                                borderColor: 'blue.90',
                            }}
                        />
                    </Grid>
                )}
            </Grid>

            {/* Right side with event content */}
            <Grid size="auto" minHeight={isLast ? '0' : '6em'}>
                <BodyText size="large" bold>
                    {event.description} ({['Pending', 'In Progress', 'Completed'][event.status - 1]})
                </BodyText>
                <BodyText>{event.time}</BodyText>
            </Grid>
        </Grid>
    );
};
