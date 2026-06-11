import React, { Suspense } from 'react';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { WidgetLocation } from 'models/widget';
import { WidgetSwitch } from 'components/engagement/widgets/WidgetSwitch';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { usePreview } from 'components/engagement/preview/PreviewContext';
import WidgetPlaceholder from 'components/engagement/preview/placeholders/WidgetPlaceholder';
import { resolveTranslationValue } from './engagementTranslationResolution';

export interface EngagementWidgetDisplayProps {
    location: WidgetLocation;
    detailsTabId?: number;
    tabIndex?: number;
}

export const EngagementWidgetSkeleton = () => (
    <Grid
        sx={{
            width: { xs: '100%', md: '47.5%' },
            display: 'flex',
            minHeight: '360px',
        }}
    >
        <Skeleton variant="rectangular" sx={{ width: '100%', height: '360px' }} />
    </Grid>
);

export const EngagementWidgetDisplay = ({ location, detailsTabId, tabIndex }: EngagementWidgetDisplayProps) => {
    const { widgets, translationBundle } = useEngagementLoaderData();
    const { isPreviewMode } = usePreview();
    const resolvedWidgets = React.use(widgets);
    const resolvedTranslationBundle = React.use(translationBundle);

    const getPlaceholderLabel = () => {
        if (location === WidgetLocation.Details && tabIndex && tabIndex > 0) {
            return `Tab ${tabIndex} Supporting Content Area (Optional)`;
        }

        return 'Supporting Content Area (Optional)';
    };

    return (
        <Suspense fallback={<EngagementWidgetSkeleton />}>
            {(() => {
                const currentWidgetTranslations = new Map(
                    resolvedTranslationBundle.currentContentTranslations.widgets.map((translation) => [
                        translation.widget_id,
                        translation,
                    ]),
                );
                const defaultWidgetTranslations = new Map(
                    resolvedTranslationBundle.defaultContentTranslations.widgets.map((translation) => [
                        translation.widget_id,
                        translation,
                    ]),
                );

                const translatedWidgets = resolvedWidgets.map((baseWidget) => {
                    const currentWidgetTranslation = currentWidgetTranslations.get(baseWidget.id);
                    const defaultWidgetTranslation = defaultWidgetTranslations.get(baseWidget.id);

                    return {
                        ...baseWidget,
                        title:
                            resolveTranslationValue<string>({
                                translatedValue: currentWidgetTranslation?.title,
                                defaultValue: defaultWidgetTranslation?.title,
                                baseValue: baseWidget.title,
                            }).value ?? baseWidget.title,
                        description:
                            resolveTranslationValue<string>({
                                translatedValue: currentWidgetTranslation?.description,
                                defaultValue: defaultWidgetTranslation?.description,
                                baseValue: baseWidget.description,
                            }).value ?? baseWidget.description,
                        map_marker_label:
                            resolveTranslationValue<string>({
                                translatedValue: currentWidgetTranslation?.map_marker_label,
                                defaultValue: defaultWidgetTranslation?.map_marker_label,
                                baseValue: baseWidget.map_marker_label,
                            }).value ?? baseWidget.map_marker_label,
                        poll_title:
                            resolveTranslationValue<string>({
                                translatedValue: currentWidgetTranslation?.poll_title,
                                defaultValue: defaultWidgetTranslation?.poll_title,
                                baseValue: baseWidget.poll_title,
                            }).value ?? baseWidget.poll_title,
                        poll_description:
                            resolveTranslationValue<string>({
                                translatedValue: currentWidgetTranslation?.poll_description,
                                defaultValue: defaultWidgetTranslation?.poll_description,
                                baseValue: baseWidget.poll_description,
                            }).value ?? baseWidget.poll_description,
                        video_description:
                            resolveTranslationValue<string>({
                                translatedValue: currentWidgetTranslation?.video_description,
                                defaultValue: defaultWidgetTranslation?.video_description,
                                baseValue: baseWidget.video_description,
                            }).value ?? baseWidget.video_description,
                        video_url:
                            resolveTranslationValue<string>({
                                translatedValue: currentWidgetTranslation?.video_url,
                                defaultValue: defaultWidgetTranslation?.video_url,
                                baseValue: baseWidget.video_url,
                            }).value ?? baseWidget.video_url,
                    };
                });

                const widget = translatedWidgets.find(
                    (w) =>
                        w.location === location &&
                        (location !== WidgetLocation.Details ||
                            (w.engagement_details_tab_id ?? null) === (detailsTabId ?? null)),
                );
                if (widget)
                    return (
                        <Grid container size={12}>
                            <WidgetSwitch widget={widget} />
                        </Grid>
                    );

                if (isPreviewMode) {
                    return (
                        <Grid container size={12} minHeight="360px">
                            <WidgetPlaceholder title={getPlaceholderLabel()} minHeight="360px" />
                        </Grid>
                    );
                }

                return null;
            })()}
        </Suspense>
    );
};
