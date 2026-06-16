import React from 'react';
import WidgetDrawer from 'components/engagement/form/EngagementWidgets/WidgetDrawer';
import { WidgetDrawerProvider } from 'components/engagement/form/EngagementWidgets/WidgetDrawerContext';
import { WidgetPickerButton } from './WidgetPickerButton';
import { WidgetLocation } from 'models/widget';

/**
 * WidgetPicker component allows users to select and manage widgets for a specific location in an engagement.
 * It provides a button to open the widget drawer and displays the selected widgets.
 * The component is wrapped in a context provider to manage actions and widget state.
 * @param {Object} props - The properties for the WidgetPicker component.
 * @param {WidgetLocation} props.location - The location where the widget will be placed in the engagement.
 * @returns {JSX.Element} A component that displays a button to pick widgets and a drawer for widget management.
 * @example
 * <WidgetPicker location={WidgetLocation.Header} />
 * @see {@link WidgetPickerButton} for the button that opens the widget drawer.
 * @see {@link WidgetDrawer} for the drawer that displays available widgets.
 * @see {@link WidgetDrawerProvider} for the context provider that manages widget state.
 */
export const WidgetPicker = ({
    location,
    detailsTabId,
    tabIndex,
}: {
    location: WidgetLocation;
    detailsTabId?: number;
    tabIndex?: number;
}) => {
    return (
        <WidgetDrawerProvider>
            <WidgetPickerButton location={location} detailsTabId={detailsTabId} tabIndex={tabIndex} />
            <WidgetDrawer />
        </WidgetDrawerProvider>
    );
};

export default WidgetPicker;
