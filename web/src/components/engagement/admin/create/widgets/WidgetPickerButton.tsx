import React, { useContext, useEffect, useState } from 'react';
import { WidgetDrawerContext } from 'components/engagement/form/EngagementWidgets/WidgetDrawerContext';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { If, Else, Then } from 'react-if';
import { useAppDispatch } from 'hooks';
import { colors } from 'styles/Theme';
import { WidgetCardSwitch } from 'components/engagement/form/EngagementWidgets/WidgetCardSwitch';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import { WidgetLocation } from 'models/widget';
import { useParams } from 'react-router';
import { getEngagementContentTranslationsByCode } from 'services/engagementContentTranslationService';

/**
 * A button component that allows users to pick and manage widgets for a specific location in an engagement.
 * It displays the first widget if available, or a button to open the widget drawer if no widgets are present.
 * The component also handles the removal of widgets with a confirmation modal.
 * @param {Object} props - The properties for the WidgetPickerButton component.
 * @param {WidgetLocation} props.location - The location where the widget will be placed in the engagement.
 * @returns {JSX.Element} A button that displays the first widget or prompts the user to add a widget.
 * @example
 * <WidgetPickerButton location={WidgetLocation.Header} />
 */
export const WidgetPickerButton = ({
    location,
    detailsTabId,
    tabIndex,
}: {
    location: WidgetLocation;
    detailsTabId?: number;
    tabIndex?: number;
}) => {
    const { widgets, deleteWidget, setWidgetDrawerOpen, isWidgetsLoading, setWidgetLocation, setWidgetDetailsTabId } =
        useContext(WidgetDrawerContext);
    const dispatch = useAppDispatch();
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const [translatedTitles, setTranslatedTitles] = useState<Map<number, string>>(new Map());
    const validDetailsTabId = detailsTabId && detailsTabId > 0 ? detailsTabId : undefined;
    const locationWidgets = widgets.filter(
        (w) =>
            w.location === location &&
            (location !== WidgetLocation.Details ||
                (w.engagement_details_tab_id ?? null) === (validDetailsTabId ?? null)),
    );

    useEffect(() => {
        if (activeLanguageCode === 'en' || locationWidgets.length === 0) {
            setTranslatedTitles(new Map());
            return;
        }
        const engagementId = locationWidgets[0].engagement_id;
        getEngagementContentTranslationsByCode(engagementId, activeLanguageCode)
            .then((translations) => {
                const titleMap = new Map<number, string>();
                translations.widgets.forEach((t) => {
                    if (t.title) titleMap.set(t.widget_id, t.title);
                });
                setTranslatedTitles(titleMap);
            })
            .catch(() => {
                /* silently fall back to base title */
            });
    }, [activeLanguageCode, locationWidgets.map((w) => w.id).join(',')]);

    useEffect(() => {
        setWidgetLocation(location);
        setWidgetDetailsTabId(validDetailsTabId ?? null);
        return () => {
            setWidgetLocation(WidgetLocation.Summary);
            setWidgetDetailsTabId(null);
        };
    }, [location, validDetailsTabId, setWidgetLocation, setWidgetDetailsTabId]);

    const removeWidget = (widgetId: number) => {
        dispatch(
            openNotificationModal({
                open: true,
                data: {
                    style: 'warning',
                    header: 'Remove Widget',
                    subText: [
                        { text: 'You will be removing this widget from the engagement.' },
                        { text: 'Do you want to remove this widget?' },
                    ],
                    handleConfirm: () => {
                        deleteWidget(widgetId);
                    },
                },
                type: 'confirm',
            }),
        );
    };

    return (
        <Grid container spacing={2} direction="column">
            <If condition={isWidgetsLoading}>
                <Then>
                    <Grid size={12}>
                        <Skeleton width="100%" height="3em" />
                    </Grid>
                </Then>
                <Else>
                    <Grid>
                        {/* Only ever render the widget assigned to this location. */}
                        {locationWidgets.length > 0 ? (
                            <WidgetCardSwitch
                                singleSelection={true}
                                key={locationWidgets[0].id}
                                widget={{
                                    ...locationWidgets[0],
                                    title: translatedTitles.get(locationWidgets[0].id) ?? locationWidgets[0].title,
                                }}
                                removeWidget={removeWidget}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setWidgetDrawerOpen(true)}
                                style={{
                                    width: '100%',
                                    borderRadius: '8px',
                                    borderColor: colors.surface.blue[90],
                                    borderWidth: '2px',
                                    borderStyle: 'dashed',
                                    backgroundColor: colors.surface.blue[10],
                                    padding: '3rem',
                                    fontSize: '16px',
                                    color: colors.surface.blue[90],
                                    cursor: 'pointer',
                                }}
                            >
                                Optional Content Widgets
                            </button>
                        )}
                    </Grid>
                </Else>
            </If>
        </Grid>
    );
};
