import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { DarkTheme } from 'styles/Theme';
import React from 'react';
import '@testing-library/jest-dom';
import Landing from 'components/landing';
import { setupEnv } from '../setEnvVars';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';

const MOCK_TENANT = {
    title: 'Mock Tenant',
    description: 'Mock Tenant Description',
};

jest.mock('axios');

global['Request'] = jest.fn().mockImplementation((input: string = '', init: RequestInit = {}) => ({
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

jest.mock('components/auth/AuthKeycloakContext', () => {
    return {
        AuthKeyCloakContext: React.createContext({
            isAuthenticated: false,
        }),
    };
});

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

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(() => jest.fn()),
}));

const CurrentLocation = () => {
    const location = useLocation();
    return <span data-testid="current-location">{`${location.pathname}${location.search}`}</span>;
};

const renderLanding = (initialEntry = '/') => {
    const router = createMemoryRouter(
        [
            {
                path: '/',
                loader: () => ({
                    regionFilter: Promise.resolve({
                        taxon_id: 1,
                        name: 'Region',
                        filter_type: 'multi',
                        values: ['North Coast'],
                    }),
                }),
                element: (
                    <>
                        <Landing />
                        <CurrentLocation />
                    </>
                ),
            },
            { path: '*', element: <CurrentLocation /> },
        ],
        { initialEntries: [initialEntry] },
    );
    return render(
        <ThemeProvider theme={DarkTheme}>
            <RouterProvider router={router} />
        </ThemeProvider>,
    );
};

describe('Landing page tests', () => {
    beforeEach(() => {
        setupEnv();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('LandingComponent is rendered correctly', async () => {
        renderLanding();

        await waitFor(() => {
            expect(screen.getByPlaceholderText('landing.hero.searchPlaceholder')).toBeInTheDocument();
            expect(screen.getByText('landing.hero.search')).toBeInTheDocument();

            expect(screen.getByText(MOCK_TENANT.title)).toBeInTheDocument();
            expect(screen.getByText(MOCK_TENANT.description)).toBeInTheDocument();
        });
    });

    test('Search field accepts input', async () => {
        renderLanding();

        const searchInput = await screen.findByPlaceholderText('landing.hero.searchPlaceholder');

        fireEvent.change(searchInput, {
            target: { value: 'New Search' },
        });

        expect(searchInput).toHaveValue('New Search');
    });

    test('Search forwards home page query parameters and search text', async () => {
        renderLanding('/?region=North%20Coast&campaign=spring');

        const searchInput = await screen.findByPlaceholderText('landing.hero.searchPlaceholder');
        fireEvent.change(searchInput, {
            target: { value: 'New Search' },
        });
        fireEvent.click(screen.getByText('landing.hero.search'));

        await waitFor(() => {
            expect(screen.getByTestId('current-location')).toHaveTextContent(
                '/search?region=North+Coast&campaign=spring&q=New+Search',
            );
        });
    });

    test('Region dropdown is working', async () => {
        renderLanding();

        const regionDropdown = await screen.findByLabelText(/Select an area to filter the engagements./i);

        expect(regionDropdown).toBeInTheDocument();
    });

    test('Stats counters are rendered correctly', async () => {
        renderLanding();

        await waitFor(() => {
            expect(screen.getByText('landing.stats.title')).toBeInTheDocument();
            expect(screen.getByText('landing.stats.publicResponses')).toBeInTheDocument();
            expect(screen.getByText('landing.stats.totalEngagements')).toBeInTheDocument();
            expect(screen.getByText('landing.stats.openOpportunities')).toBeInTheDocument();
            expect(screen.getByText('landing.stats.upcomingOpportunities')).toBeInTheDocument();
        });
    });
});
