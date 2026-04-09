import React, { ReactNode } from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupEnv } from '../setEnvVars';
import * as userService from 'services/userService/api';
import * as membershipService from 'services/membershipService';
import * as notificationModalSlice from 'services/notificationModalService/notificationModalSlice';
import { User, createDefaultUser } from 'models/user';
import { draftEngagement } from '../factory';
import { EngagementTeamMember, initialDefaultTeamMember } from 'models/engagementTeamMember';
import UserProfile from 'components/userManagement/userDetails';
import { USER_ROLES } from 'services/userService/constants';
import { createMemoryRouter, RouterProvider } from 'react-router';

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

const mockMembership: EngagementTeamMember = {
    ...initialDefaultTeamMember,
    id: 1,
    engagement_id: draftEngagement.id,
    user: {
        ...mockUser1,
    },
    user_id: mockUser1.id,
    engagement: {
        ...draftEngagement,
    },
};

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
                userDetail: { ...mockUser1 },
                roles: [USER_ROLES.TOGGLE_USER_STATUS],
            },
            tenant: {
                short_name: 'TEST',
            },
        }),
    ),
    useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
    useParams: jest.fn(() => ({ userId: '1' })),
    useLoaderData: jest.fn(() => ({ user: mockUser1 })),
}));

const router = createMemoryRouter(
    [
        {
            path: '/usermanagement/:userId/details',
            element: <UserProfile />,
        },
    ],
    {
        initialEntries: ['/usermanagement/1/details'],
    },
);

describe('User Details tests', () => {
    const mockOpenNotificationModal = jest
        .spyOn(notificationModalSlice, 'openNotificationModal')
        .mockImplementation(jest.fn());
    jest.spyOn(userService, 'getUser').mockReturnValue(Promise.resolve(mockUser1));
    jest.spyOn(membershipService, 'getMembershipsByUser').mockReturnValue(Promise.resolve([mockMembership]));

    beforeEach(() => {
        setupEnv();
    });

    test('User details page is rendered', async () => {
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText(draftEngagement.name)).toBeVisible();
            expect(screen.getByText(`${mockUser1.last_name}, ${mockUser1.first_name}`)).toBeVisible();
            expect(screen.getByText(mockUser1.email_address)).toBeVisible();
            expect(screen.getByText('Deactivate User')).toBeVisible();
        });
    });

    test('Confirmation model appears when toggling status', async () => {
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Deactivate User')).toBeVisible();
        });

        const button = screen.getByTestId('user-status-toggle');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockOpenNotificationModal).toHaveBeenCalled();
        });
    });
});
