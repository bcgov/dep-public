import React from 'react';
import '@testing-library/jest-dom';
import LoggedInHeader from '../../../src/components/layout/Header/InternalHeader';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import ProviderShell from './ProviderShell';
import { setupEnv } from './setEnvVars';
import { staffUserState, tenant } from './factory';

jest.mock('@reduxjs/toolkit/query/react', () => ({
    ...jest.requireActual('@reduxjs/toolkit/query/react'),
    fetchBaseQuery: jest.fn(),
}));

jest.mock('hooks', () => ({
    ...jest.requireActual('hooks'),
    useAppTranslation: jest.fn(() => {
        return {
            t: (key: string) => key,
        };
    }),
    useAppSelector: (callback: any) =>
        callback({
            user: staffUserState,
            tenant: tenant,
            language: { id: 'en', name: 'English' },
        }),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useRouteLoaderData: (routeId: string) => {
        if (routeId === 'authenticated-root') {
            return {
                myTenants: Promise.resolve([tenant, { ...tenant, name: 'Tenant 2', short_name: 'T2' }]),
            };
        }
    },
    useNavigation: jest.fn(() => ({ state: 'idle' })),
    useMatches: jest.fn(() => []),
    useLocation: jest.fn(() => ({ pathname: '/manage' })),
    useParams: jest.fn(() => ({})),
}));

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: jest.fn(() => true),
}));

test('Load Header', async () => {
    setupEnv();
    render(
        <ProviderShell>
            <LoggedInHeader />
        </ProviderShell>,
    );

    await waitFor(() => screen.getByTestId('tenant-switcher-button'));
    await waitFor(() => screen.getByTestId('user-menu-button'));

    expect(screen.getByTestId('tenant-switcher-button')).toHaveTextContent('Tenant 1');
    expect(screen.getByTestId('user-menu-button')).toHaveTextContent('Hello Test');

    fireEvent.click(screen.getByTestId('tenant-switcher-button'));

    // Wait for the tenant switcher to open
    await waitFor(() => screen.getByText('Tenant 2'));

    fireEvent.click(screen.getByTestId('user-menu-button'));

    // Wait for the user menu to open
    await waitFor(() => screen.getByText('Logout'));
});
