import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WidgetTitle } from 'components/engagement/form/EngagementWidgets/WidgetTitle';
import { WidgetDrawerContext } from 'components/engagement/form/EngagementWidgets/WidgetDrawerContext';
import { Widget, WidgetLocation, WidgetType } from 'models/widget';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';

const mockDispatch = jest.fn();
const mockUpdateWidgetUnwrap = jest.fn();
const mockUpdateWidget = jest.fn(() => ({ unwrap: mockUpdateWidgetUnwrap }));

jest.mock('hooks', () => ({
    ...jest.requireActual('hooks'),
    useAppDispatch: () => mockDispatch,
}));

jest.mock('apiManager/apiSlices/widgets', () => ({
    ...jest.requireActual('apiManager/apiSlices/widgets'),
    useUpdateWidgetMutation: () => [mockUpdateWidget],
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useParams: jest.fn(),
}));

jest.mock('services/engagementContentTranslationService', () => ({
    ...jest.requireActual('services/engagementContentTranslationService'),
    getEngagementContentTranslationsByCode: jest.fn(),
    syncEngagementContentTranslationsByCode: jest.fn(),
}));

const mockedGetTranslations = jest.mocked(getEngagementContentTranslationsByCode);
const mockedSyncTranslations = jest.mocked(syncEngagementContentTranslationsByCode);

const baseWidget: Widget = {
    id: 10,
    engagement_id: 20,
    title: 'Original Widget Title',
    widget_type_id: WidgetType.Map,
    location: WidgetLocation.Summary,
    items: [],
};

const renderWidgetTitle = (widget: Widget = baseWidget) => {
    const setWidgets = jest.fn();

    render(
        <WidgetDrawerContext.Provider
            value={{
                widgets: [widget],
                setWidgets,
                widgetDrawerOpen: false,
                setWidgetDrawerOpen: jest.fn(),
                widgetDrawerTabValue: 'widget-options',
                setWidgetDrawerTabValue: jest.fn(),
                isWidgetsLoading: false,
                loadWidgets: jest.fn(async () => undefined),
                deleteWidget: jest.fn(),
                widgetLocation: WidgetLocation.Summary,
                setWidgetLocation: jest.fn(),
                widgetDetailsTabId: null,
                setWidgetDetailsTabId: jest.fn(),
                isWidgetInScope: jest.fn(() => true),
            }}
        >
            <WidgetTitle widget={widget} />
        </WidgetDrawerContext.Provider>,
    );

    return { setWidgets };
};

describe('WidgetTitle language behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('updates base widget title for English', async () => {
        const { useParams } = jest.requireMock('react-router');
        useParams.mockReturnValue({ languageCode: 'en' });

        mockUpdateWidgetUnwrap.mockResolvedValue({ title: 'Updated English Title' });

        renderWidgetTitle();

        fireEvent.click(screen.getByRole('button'));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated English Title' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(mockUpdateWidget).toHaveBeenCalledWith({
                id: 10,
                engagementId: 20,
                data: { title: 'Updated English Title' },
            });
        });

        expect(mockedGetTranslations).not.toHaveBeenCalled();
        expect(mockedSyncTranslations).not.toHaveBeenCalled();
    });

    test('updates translation bucket for non-English', async () => {
        const { useParams } = jest.requireMock('react-router');
        useParams.mockReturnValue({ languageCode: 'fr' });

        mockedGetTranslations.mockResolvedValue({
            details_tabs: [],
            widgets: [{ id: 1, widget_id: 10, title: 'Ancien titre' }],
            timeline_widgets: [],
            events_widgets: [],
            documents_widgets: [],
            image_widgets: [],
        });
        mockedSyncTranslations.mockResolvedValue({
            details_tabs: [],
            widgets: [],
            timeline_widgets: [],
            events_widgets: [],
            documents_widgets: [],
            image_widgets: [],
        });

        renderWidgetTitle();

        fireEvent.click(screen.getByRole('button'));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Titre mis a jour' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(mockedGetTranslations).toHaveBeenCalledWith(20, 'fr');
            expect(mockedSyncTranslations).toHaveBeenCalledWith(20, 'fr', {
                widgets: [{ id: 1, widget_id: 10, title: 'Titre mis a jour' }],
            });
        });

        expect(mockUpdateWidget).not.toHaveBeenCalled();
    });
});
