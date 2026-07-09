import { render, waitFor, screen, fireEvent, within, getByRole } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { DarkTheme } from 'styles/Theme';
import React from 'react';
import '@testing-library/jest-dom';
import Landing from 'components/landing';
import { setupEnv } from '../setEnvVars';
import { openEngagement, closedEngagement } from '../factory';
import { MemoryRouter, useLoaderData } from 'react-router';

const MOCK_TENANT = {
    title: 'Mock Tenant',
    description: 'Mock Tenant Description',
};

jest.mock('axios');

jest.mock('components/auth/AuthKeycloakContext', () => {
    return {
        AuthKeyCloakContext: React.createContext({
            isAuthenticated: false,
        }),
    };
});

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLoaderData: jest.fn(),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
    useRevalidator: () => ({
        revalidate: jest.fn(),
        state: 'idle',
    }),
}));

jest.mock('hooks', () => ({
    useAppTranslation: () => ({
        t: (key: string) => key,
    }),
    useAppSelector: (callback: (state: unknown) => unknown) =>
        callback({
            tenant: MOCK_TENANT,
            user: {
                roles: [],
            },
        }),
}));

jest.mock('constants/engagementStatus', () => ({
    EngagementDisplayStatus: {
        Draft: 1,
        Published: 2,
        Closed: 3,
        Scheduled: 4,
        Upcoming: 5,
        Open: 6,
        Unpublished: 7,
        1: 'Draft',
        2: 'Published',
        3: 'Closed',
        4: 'Scheduled',
        5: 'Upcoming',
        6: 'Open',
        7: 'Unpublished',
    },
    SubmissionStatus: {
        Upcoming: 1,
        Open: 2,
        Closed: 3,
        Unpublished: 4,
    },
    EngagementStatus: {
        Draft: 1,
        Published: 2,
        Closed: 3,
        Scheduled: 4,
        Unpublished: 5,
    },
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(() => jest.fn()),
}));

const mockUseLoaderData = useLoaderData as jest.Mock;

const populateLoaderData = () => {
    mockUseLoaderData.mockReturnValue({
        engagements: Promise.resolve({
            items: [openEngagement, closedEngagement],
            total: 2,
        }),
        allMetaFilters: Promise.resolve([]),
    });
};

const renderLanding = () =>
    render(
        <ThemeProvider theme={DarkTheme}>
            <MemoryRouter>
                <Landing />
            </MemoryRouter>
        </ThemeProvider>,
    );

describe('Landing page tests', () => {
    beforeEach(() => {
        setupEnv();
        populateLoaderData();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('LandingComponent is rendered correctly with engagements listed', async () => {
        renderLanding();

        await waitFor(() => {
            expect(screen.getByPlaceholderText('landing.filters.searchPlaceholder')).toBeInTheDocument();
            expect(screen.getByText('landing.filters.search')).toBeInTheDocument();
            expect(screen.getByText('landing.filters.drawer.openButton')).toBeInTheDocument();

            expect(screen.getByText(MOCK_TENANT.title)).toBeInTheDocument();
            expect(screen.getByText(MOCK_TENANT.description)).toBeInTheDocument();

            expect(screen.getByText(openEngagement.name)).toBeInTheDocument();
            expect(screen.getByText(closedEngagement.name)).toBeInTheDocument();
        });
    });

    test('Search field accepts input', async () => {
        renderLanding();

        const searchInput = await screen.findByPlaceholderText('landing.filters.searchPlaceholder');

        fireEvent.change(searchInput, {
            target: { value: 'New Search' },
        });

        expect(searchInput).toHaveValue('New Search');
    });

    test('Status dropdown is working', async () => {
        renderLanding();

        const statusDropdown = await screen.findByRole('combobox');

        fireEvent.mouseDown(statusDropdown);

        const listbox = within(getByRole(document.body, 'listbox'));

        fireEvent.click(listbox.getByText('landing.filters.status.open'));

        expect(statusDropdown).toBeInTheDocument();
    });

    test('Filter drawer is opened and closed', async () => {
        renderLanding();

        const filterButton = await screen.findByText('landing.filters.drawer.openButton');

        fireEvent.click(filterButton);

        await waitFor(() => {
            expect(screen.getByText('landing.filters.drawer.title')).toBeInTheDocument();
        });
    });

    test('NoResult component is rendered when engagements array is empty', async () => {
        mockUseLoaderData.mockReturnValue({
            engagements: Promise.resolve({
                items: [],
                total: 0,
            }),
            allMetaFilters: Promise.resolve([]),
        });

        renderLanding();

        await waitFor(() => {
            expect(screen.getByTestId('NoResultsHeader')).toBeInTheDocument();
        });
    });
});
