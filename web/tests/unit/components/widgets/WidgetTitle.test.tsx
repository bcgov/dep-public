import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WidgetTitle } from 'components/engagement/form/EngagementWidgets/WidgetTitle';
import { WidgetDrawerContext } from 'components/engagement/form/EngagementWidgets/WidgetDrawerContext';
import { Widget, WidgetLocation, WidgetType } from 'models/widget';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';
import { AuthoringFormContext } from 'components/engagement/admin/create/authoring/AuthoringFormContext';
import { AuthoringContextType } from 'components/engagement/admin/create/authoring/types';
import {
    acquireEngagementSectionLock,
    LOCK_TOKEN_HEADER,
    releaseLock,
    ResourceLockRecord,
    SECTION_AUTHORING_DETAILS,
    SECTION_AUTHORING_SUMMARY,
} from 'services/resourceLockService';

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

jest.mock('services/resourceLockService', () => ({
    ...jest.requireActual('services/resourceLockService'),
    acquireEngagementSectionLock: jest.fn(),
    releaseLock: jest.fn(),
}));

const mockedGetTranslations = jest.mocked(getEngagementContentTranslationsByCode);
const mockedSyncTranslations = jest.mocked(syncEngagementContentTranslationsByCode);
const mockedAcquireLock = jest.mocked(acquireEngagementSectionLock);
const mockedReleaseLock = jest.mocked(releaseLock);

const baseWidget: Widget = {
    id: 10,
    engagement_id: 20,
    title: 'Original Widget Title',
    widget_type_id: WidgetType.Map,
    location: WidgetLocation.Summary,
    items: [],
};

const renderWidgetTitle = (
    widget: Widget = baseWidget,
    activeLockToken: string | null = 'test-lock-token',
    widgets: Widget[] = [widget],
) => {
    const setWidgets = jest.fn();

    render(
        <AuthoringFormContext.Provider
            value={
                {
                    activeLockToken,
                    activeLockSectionKey: activeLockToken ? SECTION_AUTHORING_SUMMARY : null,
                    activeLockLanguageId: activeLockToken ? 127 : undefined,
                    languageId: 127,
                } as AuthoringContextType
            }
        >
            <WidgetDrawerContext.Provider
                value={{
                    widgets,
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
            </WidgetDrawerContext.Provider>
        </AuthoringFormContext.Provider>,
    );

    return { setWidgets };
};

describe('WidgetTitle language behavior', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedAcquireLock.mockResolvedValue({
            lock_token: 'acquired-lock-token',
            lock_scope: 'engagement_section:20:authoring.summary:lang:127',
            resource_type: 'engagement_section',
            resource_id: 20,
            section_key: SECTION_AUTHORING_SUMMARY,
            language_id: 127,
            owner: { user_sub: 'test-user' },
            owner_session_id: 'test-session',
            acquired_at: '2025-01-01T00:00:00Z',
            is_mine: true,
        } as ResourceLockRecord);
        mockedReleaseLock.mockResolvedValue({ released: true });
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
                headers: { [LOCK_TOKEN_HEADER]: 'test-lock-token' },
            });
        });

        expect(mockedGetTranslations).not.toHaveBeenCalled();
        expect(mockedSyncTranslations).not.toHaveBeenCalled();
    });

    test('updates translation bucket for non-English', async () => {
        const { useParams } = jest.requireMock('react-router');
        useParams.mockReturnValue({ languageCode: 'fr' });
        const detailsWidget = { ...baseWidget, id: 102, location: WidgetLocation.Details };
        const summaryWidget = { ...baseWidget, id: 104 };

        mockedGetTranslations.mockResolvedValue({
            details_tabs: [],
            widgets: [
                { id: 1, widget_id: detailsWidget.id, title: 'Ancien titre' },
                { id: 2, widget_id: summaryWidget.id, title: 'Titre existant' },
            ],
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

        const { setWidgets } = renderWidgetTitle(detailsWidget, null, [detailsWidget, summaryWidget]);

        fireEvent.click(screen.getByRole('button'));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Titre mis a jour' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(mockedGetTranslations).toHaveBeenCalledWith(20, 'fr');
            expect(mockedSyncTranslations).toHaveBeenCalledWith(
                20,
                'fr',
                {
                    widgets: [{ id: 1, widget_id: detailsWidget.id, title: 'Titre mis a jour' }],
                },
                { [LOCK_TOKEN_HEADER]: 'acquired-lock-token' },
            );
        });

        expect(mockUpdateWidget).not.toHaveBeenCalled();
        expect(mockedAcquireLock).toHaveBeenCalledWith({
            engagementId: 20,
            sectionKey: SECTION_AUTHORING_DETAILS,
            languageId: 127,
        });
        expect(mockedReleaseLock).toHaveBeenCalledWith('acquired-lock-token');
        expect(setWidgets).not.toHaveBeenCalled();
    });
});
