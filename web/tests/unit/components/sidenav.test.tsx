import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import SideNav from '../../../src/components/layout/SideNav/SideNav';
import ProviderShell from './ProviderShell';
import { setupEnv } from './setEnvVars';
import { Routes } from '../../../src/components/layout/SideNav/SideNavElements';
import { USER_ROLES } from 'services/userService/constants';
import { UserState } from 'services/userService/types';
import { staffUserState } from './factory';

jest.mock('@reduxjs/toolkit/query/react', () => ({
    ...jest.requireActual('@reduxjs/toolkit/query/react'),
    fetchBaseQuery: jest.fn(),
}));

jest.mock('axios');

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useMatches: jest.fn(() => []),
    useLocation: jest.fn(() => ({ pathname: '/manage' })),
}));

jest.mock('hooks', () => ({
    useAppTranslation: () => ({
        t: (key: string) => key, // return the key itself (i.e. no translation)
    }),
    useAppSelector: (callback: (state: unknown) => unknown) =>
        callback({
            user: {
                ...staffUserState,
                roles: [
                    USER_ROLES.VIEW_ENGAGEMENT,
                    USER_ROLES.VIEW_ASSIGNED_ENGAGEMENTS,
                    USER_ROLES.VIEW_SURVEYS,
                    USER_ROLES.VIEW_USERS,
                    USER_ROLES.VIEW_FEEDBACKS,
                    USER_ROLES.SUPER_ADMIN,
                    USER_ROLES.MANAGE_METADATA,
                    USER_ROLES.VIEW_LANGUAGES,
                ],
            } as UserState,
            language: { id: 'en', name: 'English' },
        }),
}));

test('Load SideNav', async () => {
    setupEnv();
    render(
        <ProviderShell>
            <SideNav setOpen={() => void 0} isMediumScreen={false} open={true} />
        </ProviderShell>,
    );

    Routes.forEach((route) => {
        fireEvent.click(screen.getByTestId(`SideNav/${route.name}-button`));
    });

    await waitFor(() =>
        Routes.forEach((route) => {
            screen.getByTestId(`SideNav/${route.name}-button`);
        }),
    );

    Routes.forEach((route) => {
        expect(screen.getByTestId(`SideNav/${route.name}-button`)).toHaveTextContent(`${route.name}`);
    });

    Routes.forEach((route) => {
        expect(screen.getByTestId(`SideNav/${route.name}-button`)).not.toBeDisabled();
    });
});
