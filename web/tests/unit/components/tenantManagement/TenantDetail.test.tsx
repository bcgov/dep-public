import React, { JSX, ReactNode, SuspenseProps } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as reactRouter from 'react-router';
import * as tenantService from 'services/tenantService';
import TenantDetail from '../../../../src/components/tenantManagement/Detail';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { USER_ROLES } from 'services/userService/constants';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import { NotificationModalState } from 'services/notificationModalService/types';

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

const mockTenant = {
    id: 1,
    name: 'Tenant One',
    title: 'Title One',
    description: 'Description One',
    contact_name: 'Contact One',
    short_name: 'tenantone',
    contact_email: 'contactone@example.com',
    hero_image_url: 'https://example.com/logo.png',
    hero_image_credit: 'Photographer One',
    hero_image_description: 'Logo Description One',
};

jest.mock('axios');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    Suspense: ({ children }: { children: ReactNode }) => {
        // For tests, just render children directly (skip suspense)
        return <>{children}</>;
    },
}));

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    Box: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('components/common/Typography/', () => ({
    Heading1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
    Heading2: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
    Heading4: ({ children }: { children: ReactNode }) => <h4>{children}</h4>,
    BodyText: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

jest.mock('components/common/Layout', () => ({
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DetailsContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Detail: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn(() => {
        return {
            roles: [USER_ROLES.SUPER_ADMIN],
        };
    }),
    useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useParams: jest.fn(() => {
        return { tenantShortName: mockTenant.short_name };
    }),
    useNavigate: jest.fn(() => jest.fn()),
    Await: ({ children, resolve }: { children: (data: unknown) => ReactNode; resolve: unknown }) => {
        // For tests, immediately "resolve" the promise by calling children with mockTenant
        // This simulates the resolved state without actually waiting
        return <>{children(mockTenant)}</>;
    },
}));

jest.mock('services/tenantService', () => ({
    deleteTenant: jest.fn(),
}));

jest.mock('services/notificationService/notificationSlice', () => ({
    openNotification: jest.fn(),
}));

let capturedNotification: NotificationModalState;
jest.mock('services/notificationModalService/notificationModalSlice', () => ({
    openNotificationModal: jest.fn((notification: NotificationModalState) => {
        capturedNotification = notification;
    }),
}));

// Mocking AutoBreadcrumbs component
jest.mock('components/common/Navigation/Breadcrumb', () => ({
    AutoBreadcrumbs: () => <div>Breadcrumbs</div>,
}));

const router = createMemoryRouter(
    [
        {
            path: '/manage/tenantadmin/:tenantShortName/detail',
            element: <TenantDetail />,
            id: 'tenant',
            loader: () => Promise.resolve(mockTenant),
        },
    ],
    { initialEntries: ['/manage/tenantadmin/tenantone/detail'] },
);

describe('Tenant Detail Page tests', () => {
    const navigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(reactRouter, 'useNavigate').mockReturnValue(navigate);
    });

    test('Tenant detail is rendered', async () => {
        render(<RouterProvider router={router} />);
        await waitFor(() => {
            const tenantNames = screen.getAllByText('Tenant One');
            expect(tenantNames).toHaveLength(2);
            expect(screen.getByText('Title One')).toBeVisible();
            expect(screen.getByText('Description One')).toBeVisible();
            expect(screen.getByText('Contact One')).toBeVisible();
            expect(screen.getByText('contactone@example.com')).toBeVisible();
            expect(screen.getByText('Photographer One')).toBeVisible();
            expect(screen.getByText('Logo Description One')).toBeVisible();

            expect(screen.getByText('Edit')).toBeVisible();
            expect(screen.getByText('Delete Tenant Instance')).toBeVisible();
        });
    });

    test('Delete popup works as expected', async () => {
        render(<RouterProvider router={router} />);
        await waitFor(() => {
            screen.getByText('Delete Tenant Instance').click();
        });
        await waitFor(() => {
            expect(openNotificationModal).toHaveBeenCalledTimes(1);
            expect(capturedNotification.data.header).toBe('Delete Tenant Instance?');
            capturedNotification.data.handleConfirm?.();
            // Test that the deleteTenant function was called
            expect(tenantService.deleteTenant).toHaveBeenCalledTimes(1);
        });
    });

    test('Loading state is rendered', () => {
        // Re-mock the Suspense component to render the fallback prop
        jest.spyOn(React, 'Suspense').mockImplementation((props: SuspenseProps) => {
            return props.fallback;
        });
        render(<RouterProvider router={router} />);
        const loadingTexts = screen.getAllByText('Loading...');
        expect(loadingTexts.length).toBeGreaterThan(0);
        jest.restoreAllMocks();
    });
});
