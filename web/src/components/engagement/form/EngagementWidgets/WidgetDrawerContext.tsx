import React, { createContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { useAppDispatch } from 'hooks';
import { Widget, WidgetLocation } from 'models/widget';
import { openNotification } from 'services/notificationService/notificationSlice';
import { getWidgets } from 'services/widgetService';
import { WidgetTabValues } from './type';
import { useDeleteWidgetMutation } from 'apiManager/apiSlices/widgets';
import { useRouteLoaderData } from 'react-router';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';

export interface WidgetDrawerContextProps {
    widgets: Widget[];
    setWidgets: React.Dispatch<React.SetStateAction<Widget[]>>;
    widgetDrawerOpen: boolean;
    setWidgetDrawerOpen: (_open: boolean) => void;
    widgetDrawerTabValue: string;
    setWidgetDrawerTabValue: React.Dispatch<React.SetStateAction<string>>;
    isWidgetsLoading: boolean;
    loadWidgets: () => Promise<void>;
    deleteWidget: (widgetIndex: number) => void;
    widgetLocation: number;
    setWidgetLocation: (widgetLocation: number) => void;
    widgetDetailsTabId: number | null;
    setWidgetDetailsTabId: (detailsTabId: number | null) => void;
    isWidgetInScope: (widget: Widget) => boolean;
}

export type EngagementParams = {
    engagementId: string;
};

export const WidgetDrawerContext = createContext<WidgetDrawerContextProps>({
    widgets: [],
    setWidgets: () => {
        return;
    },
    isWidgetsLoading: false,
    widgetDrawerOpen: false,
    setWidgetDrawerOpen: (_open: boolean) => {
        /* empty default method  */
    },
    widgetDrawerTabValue: WidgetTabValues.WIDGET_OPTIONS,
    setWidgetDrawerTabValue: (_tabValue: React.SetStateAction<string>) => {
        /* empty default method  */
    },
    loadWidgets: () => Promise.resolve(),
    deleteWidget: (widgetIndex: number) => {
        /* empty default method  */
    },
    widgetLocation: WidgetLocation.Summary,
    setWidgetLocation: (widgetLocation: number) => {
        /* empty default method  */
    },
    widgetDetailsTabId: null,
    setWidgetDetailsTabId: (_detailsTabId: number | null) => {
        /* empty default method  */
    },
    isWidgetInScope: (_widget: Widget) => false,
});

export const WidgetDrawerProvider = ({
    children,
    location,
}: PropsWithChildren<{
    location?: WidgetLocation;
}>) => {
    const savedEngagement = React.use(
        (useRouteLoaderData('single-engagement') as EngagementLoaderAdminData).engagement,
    );
    const dispatch = useAppDispatch();
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [isWidgetsLoading, setIsWidgetsLoading] = useState(true);
    const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false);
    const [widgetDrawerTabValue, setWidgetDrawerTabValue] = React.useState(WidgetTabValues.WIDGET_OPTIONS);
    const [removeWidget] = useDeleteWidgetMutation();
    const [widgetLocation, setWidgetLocation] = useState(WidgetLocation.Summary);
    const [widgetDetailsTabId, setWidgetDetailsTabId] = useState<number | null>(null);

    const isWidgetInScope = (widget: Widget) => {
        if (widget.location !== widgetLocation) {
            return false;
        }

        if (widgetLocation !== WidgetLocation.Details) {
            return true;
        }

        const widgetDetailsTab = widget.engagement_details_tab_id ?? null;

        if (widgetDetailsTab === widgetDetailsTabId) {
            return true;
        }

        return widgetDetailsTab === null;
    };

    const deleteWidget = async (widgetId: number) => {
        try {
            await removeWidget({ engagementId: savedEngagement.id, widgetId });
            dispatch(openNotification({ severity: 'success', text: 'Removed Widget' }));
            loadWidgets();
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'Error removing widgets' }));
        }
    };

    const loadWidgets = async () => {
        if (!savedEngagement.id) {
            setIsWidgetsLoading(false);
            return;
        }

        try {
            const widgetsList = await getWidgets(savedEngagement.id);
            setWidgets(widgetsList);
            setIsWidgetsLoading(false);
        } catch {
            setIsWidgetsLoading(false);
            dispatch(openNotification({ severity: 'error', text: 'Error fetching engagement widgets' }));
        }
    };

    useEffect(() => {
        loadWidgets();
    }, [savedEngagement]);

    const contextValue = useMemo(
        () => ({
            widgets,
            setWidgets,
            deleteWidget,
            widgetDrawerOpen,
            setWidgetDrawerOpen,
            widgetDrawerTabValue,
            setWidgetDrawerTabValue,
            isWidgetsLoading,
            loadWidgets,
            widgetLocation,
            setWidgetLocation,
            widgetDetailsTabId,
            setWidgetDetailsTabId,
            isWidgetInScope,
        }),
        [widgets, widgetDrawerOpen, widgetDrawerTabValue, isWidgetsLoading, widgetLocation, widgetDetailsTabId],
    );

    return <WidgetDrawerContext.Provider value={contextValue}>{children}</WidgetDrawerContext.Provider>;
};
