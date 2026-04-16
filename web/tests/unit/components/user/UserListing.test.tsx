import React, { ReactNode } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupEnv } from '../setEnvVars';
import * as reactRouter from 'react-router';
import { RouterProvider } from 'react-router';
import * as userService from 'services/userService/api';
import { User, createDefaultUser } from 'models/user';
import UserManagementListing from 'components/userManagement/listing';
import { draftEngagement } from '../factory';

const mockUser1: User = {
    ...createDefaultUser,
    id: 1,
    contact_number: '555 012 4564',
    description: 'mock description',
    email_address: '1',
    external_id: '3859G58GJH3921',
    first_name: 'Mock first name',
    last_name: 'Mock last name',
    updated_date: Date(),
    created_date: Date(),
    status_id: 1,
    roles: [],
};

jest.mock('axios');

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    Link: ({ children }: { children: ReactNode }) => {
        return <a>{children}</a>;
    },
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn((callback) =>
        callback({
            user: {
                assignedEngagements: [draftEngagement.id],
                roles: [],
                userDetail: {
                    user: {
                        id: 999,
                    },
                },
            },
        }),
    ),
    useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLocation: jest.fn(() => ({
        search: '',
    })),
    useNavigate: jest.fn(),
}));

const router = reactRouter.createMemoryRouter(
    [
        {
            path: '/manage/users',
            element: <UserManagementListing />,
        },
    ],
    {
        initialEntries: ['/manage/users'],
    },
);

describe('User Management tests', () => {
    jest.spyOn(userService, 'getUserList').mockReturnValue(
        Promise.resolve({
            items: [mockUser1],
            total: 1,
        }),
    );

    beforeEach(() => {
        setupEnv();
    });

    test('User table is rendered', async () => {
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('User Name')).toBeVisible();
            expect(screen.getByText('Role')).toBeVisible();
            expect(screen.getByText('Date Added')).toBeVisible();
            expect(screen.getByText('Status')).toBeVisible();
        });
    });

    test('Assign Role to user modal appears', async () => {
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('User Name')).toBeVisible();
            expect(screen.getByText('Actions')).toBeVisible();
        });
    });
});
