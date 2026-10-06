import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { DarkTheme } from 'styles/Theme';
import React from 'react';
import '@testing-library/jest-dom';
import Landing from 'components/landing';
import { setupEnv } from '../setEnvVars';
import { MemoryRouter } from 'react-router';

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
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
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

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(() => jest.fn()),
}));

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
