import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React, { ReactNode } from 'react';
import '@testing-library/jest-dom';
import EngagementListing from '../../../../src/components/engagement/listing';
import { setupEnv } from '../setEnvVars';
import * as notificationSlice from 'services/notificationService/notificationSlice';
import { createDefaultSurvey } from 'models/survey';
import { createDefaultEngagement } from 'models/engagement';
import { EngagementStatus } from 'constants/engagementStatus';
import { EngagementDisplayStatus } from 'constants/engagementStatus';
import assert from 'assert';
import { USER_ROLES } from 'services/userService/constants';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { deleteEngagement } from 'services/engagementService';
import { useSelector } from 'react-redux';

global['Request'] = jest.fn().mockImplementation((input: string = '', init: RequestInit = {}) => ({
    // React Router data APIs call toUpperCase on request.method; default to GET
    method: (init.method || 'GET').toUpperCase(),
    url: input,
    headers: {
        get: jest.fn(),
        has: jest.fn(),
    },
    signal: {
        removeEventListener: jest.fn(),
        addEventListener: jest.fn(),
    },
    clone: jest.fn(),
}));

const mockSurvey = {
    ...createDefaultSurvey(),
    id: 1,
    name: 'Survey 1',
    engagement_id: 2,
};

const mockSurveyTwo = {
    ...createDefaultSurvey(),
    id: 2,
    name: 'Survey 2',
    engagement_id: 1,
};

const mockSurveys = [mockSurvey];

const mockEngagementOne = {
    ...createDefaultEngagement(),
    id: 1,
    name: 'Engagement One',
    created_date: '2022-09-14 10:00:00',
    surveys: [mockSurveyTwo],
    rich_content:
        '{"blocks":[{"key":"29p4m","text":"Test content","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    content: 'Test content',
    rich_description:
        '{"blocks":[{"key":"bqupg","text":"Test description","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    description: 'Test description',
    description_title: 'Test Description Title',
    start_date: '2022-09-01',
    end_date: '2022-09-30',
    status_id: EngagementStatus.Draft,
    engagement_status: {
        id: EngagementStatus.Draft,
        status_name: 'Draft',
    },
};

const mockEngagementTwo = {
    ...createDefaultEngagement(),
    id: 2,
    name: 'Engagement Two',
    status_id: EngagementStatus.Published,
    engagement_status: {
        id: EngagementStatus.Published,
        status_name: 'Open',
    },
    created_date: '2026-01-15 10:00:00',
    published_date: '2026-01-16 10:00:00',
    rich_content:
        '{"blocks":[{"key":"29p4m","text":"Test content","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    rich_description:
        '{"blocks":[{"key":"bqupg","text":"Test description","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    description: 'Test description',
    description_title: 'Test Description Title',
    start_date: '2026-01-17',
    end_date: '2026-09-30',
    surveys: mockSurveys,
    submissions_meta_data: {
        total: 1,
        pending: 0,
        needs_further_review: 0,
        rejected: 0,
        approved: 1,
    },
};

jest.mock('axios');

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: () => false,
}));

jest.mock('components/permissionsGate', () => ({
    ...jest.requireActual('components/permissionsGate'),
    PermissionsGate: ({ children }: { children: ReactNode }) => {
        return <>{children}</>;
    },
}));

let mockFetcherData = {
    engagements: { items: [mockEngagementOne, mockEngagementTwo], total: 2 },
};

const mockFetcher = {
    load: jest.fn(),
    data: mockFetcherData,
    state: 'idle',
};

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({
        search: '',
    })),
    useFetcher: jest.fn(() => mockFetcher),
    useRevalidator: jest.fn(() => ({ revalidate: revalidateMock })),
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn(() => {
        return {
            roles: [USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS, USER_ROLES.EDIT_ENGAGEMENT, USER_ROLES.CREATE_ENGAGEMENT],
            assignedEngagements: [mockEngagementOne.id, mockEngagementTwo.id],
        };
    }),
    useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('services/engagementService', () => ({
    deleteEngagement: jest.fn(),
}));

const openActionsFor = async (engagementId: number) => {
    const input = await waitFor(() => document.getElementById(`action-drop-down-${engagementId}`));

    if (!(input instanceof HTMLElement)) {
        throw new TypeError(`#action-drop-down-${engagementId} is not an HTMLElement`);
    }

    const root: HTMLElement = input.parentElement ?? input;
    const trigger =
        root.querySelector('[role="button"][aria-haspopup="listbox"]') ||
        root.closest('td')?.querySelector('[role="button"][aria-haspopup="listbox"]') ||
        root.querySelector('[role="combobox"]'); // fallback on some MUI builds

    if (!(trigger instanceof HTMLElement)) {
        throw new TypeError(`Trigger element was not found.`);
    }

    fireEvent.mouseDown(trigger);
    await screen.findByRole('listbox');
};

const revalidateMock = jest.fn();

const router = createMemoryRouter(
    [
        {
            path: '/engagements/',
            element: <EngagementListing />,
        },
    ],
    {
        initialEntries: ['/engagements/'],
    },
);

describe('Engagement listing page tests', () => {
    jest.spyOn(notificationSlice, 'openNotification').mockImplementation(jest.fn());

    beforeEach(() => {
        setupEnv();
        revalidateMock.mockClear();
        (useSelector as unknown as jest.Mock).mockImplementation(() => ({
            roles: [USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS, USER_ROLES.EDIT_ENGAGEMENT, USER_ROLES.CREATE_ENGAGEMENT],
            assignedEngagements: [mockEngagementOne.id, mockEngagementTwo.id],
        }));
    });

    test('Engagement table is rendered and engagements are fetched', async () => {
        mockFetcherData = {
            engagements: { items: [mockEngagementOne, mockEngagementTwo], total: 2 },
        };
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Engagement One')).toBeInTheDocument();
            expect(screen.getByText('2022-09-14')).toBeInTheDocument();

            expect(screen.getByText('Engagement Two')).toBeInTheDocument();
            expect(screen.getByText('2026-01-15')).toBeInTheDocument();
        });

        expect(screen.getByText('Create Engagement', { exact: false })).toBeInTheDocument();
    });

    test('Search filter works and fetches engagements with the search text as a param', async () => {
        mockFetcherData = {
            engagements: { items: [mockEngagementOne], total: 1 },
        };
        const { container } = render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Engagement One')).toBeInTheDocument();
        });

        const searchField = container.querySelector('input[name="searchText"]');
        assert(searchField, 'Unable to find search field that matches the given query');

        fireEvent.change(searchField, { target: { value: 'Engagement One' } });
        fireEvent.click(screen.getByTestId('engagement/listing/searchButton'));

        await waitFor(() => {
            expect(mockFetcher.load).toHaveBeenLastCalledWith(
                '/engagements/search?page=1&size=10&sort_key=engagement.created_date&sort_order=desc&search_text=Engagement+One',
            );
        });
    });

    test('Advanced Search filter works and fetches engagements with the selected status as a param', async () => {
        mockFetcherData = {
            engagements: { items: [mockEngagementOne], total: 1 },
        };
        const { getByTestId } = render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Engagement One')).toBeInTheDocument();
        });

        const checkbox = getByTestId(EngagementDisplayStatus.Draft.toString()).querySelector('input[type="checkbox"]');
        expect(checkbox).toHaveProperty('checked', false);

        fireEvent.click(getByTestId(EngagementDisplayStatus.Draft.toString()));
        expect(checkbox).toHaveProperty('checked', true);

        fireEvent.click(screen.getByTestId('search-button'));
        await waitFor(() => {
            expect(mockFetcher.load).toHaveBeenLastCalledWith(
                '/engagements/search?page=1&size=10&sort_key=engagement.created_date&sort_order=desc&engagement_status=1',
            );
        });
    });

    test('Delete engagement succeeds: shows modal, calls service, shows success, revalidates', async () => {
        mockFetcherData = {
            engagements: { items: [mockEngagementOne, mockEngagementTwo], total: 2 },
        };

        (useSelector as unknown as jest.Mock).mockImplementation(() => ({
            roles: [USER_ROLES.SUPER_ADMIN],
            assignedEngagements: [mockEngagementOne.id, mockEngagementTwo.id],
        }));

        (deleteEngagement as jest.Mock).mockResolvedValue({ id: mockEngagementOne.id });

        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Engagement One')).toBeInTheDocument();
        });

        await openActionsFor(mockEngagementOne.id);
        fireEvent.click(await screen.findByRole('option', { name: /Delete Engagement/i }));

        const confirm = await screen.findByRole('button', { name: /Delete Engagement/i });
        fireEvent.click(confirm);

        await waitFor(() => {
            expect(deleteEngagement).toHaveBeenCalledWith(mockEngagementOne.id);
            expect(revalidateMock).toHaveBeenCalledTimes(1);
            expect(notificationSlice.openNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringMatching(/successfully deleted/i),
                    severity: 'success',
                }),
            );
        });
    });

    test('Delete engagement fails in production env (403): shows error and does not revalidate', async () => {
        mockFetcherData = {
            engagements: { items: [mockEngagementOne], total: 1 },
        };

        (useSelector as unknown as jest.Mock).mockImplementation(() => ({
            roles: [USER_ROLES.SUPER_ADMIN],
            assignedEngagements: [mockEngagementOne.id, mockEngagementTwo.id],
        }));

        (deleteEngagement as jest.Mock).mockRejectedValue(
            new Error('Engagement deletion is not allowed in production environment'),
        );

        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Engagement One')).toBeInTheDocument();
        });

        await openActionsFor(mockEngagementOne.id);
        fireEvent.click(await screen.findByRole('option', { name: /Delete Engagement/i }));

        const confirm = await screen.findByRole('button', { name: /Delete Engagement/i });
        fireEvent.click(confirm);

        await waitFor(() => {
            expect(deleteEngagement).toHaveBeenCalledWith(mockEngagementOne.id);
            expect(revalidateMock).not.toHaveBeenCalled();
            expect(notificationSlice.openNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringMatching(/production environment/i),
                    severity: 'error',
                }),
            );
        });
    });

    test('Delete engagement option is hidden without permission', async () => {
        mockFetcherData = {
            engagements: { items: [mockEngagementOne], total: 1 },
        };
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Engagement One')).toBeInTheDocument();
        });

        await openActionsFor(mockEngagementOne.id);
        expect(screen.queryByRole('option', { name: /Delete Engagement/i })).not.toBeInTheDocument();
    });

    test('Delete engagement blocked when published (client guard): shows error and does not call service', async () => {
        const publishedEngagement = {
            ...mockEngagementTwo,
            status_id: EngagementStatus.Published,
            engagement_status: { id: EngagementStatus.Published, status_name: 'Published' },
        };
        mockFetcherData = {
            engagements: { items: [publishedEngagement], total: 1 },
        };

        (useSelector as unknown as jest.Mock).mockImplementation(() => ({
            roles: [USER_ROLES.SUPER_ADMIN],
            assignedEngagements: [publishedEngagement.id],
        }));

        (deleteEngagement as jest.Mock).mockResolvedValue({ id: publishedEngagement.id });

        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText(publishedEngagement.name)).toBeInTheDocument();
        });

        await openActionsFor(mockEngagementTwo.id);
        fireEvent.click(await screen.findByRole('option', { name: /Delete Engagement/i }));
        const confirm = await screen.findByRole('button', { name: /Delete Engagement/i });
        fireEvent.click(confirm);

        await waitFor(() => {
            expect(deleteEngagement).not.toHaveBeenCalled();
            expect(notificationSlice.openNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringMatching(/currently published/i),
                    severity: 'error',
                }),
            );
        });
    });
});
