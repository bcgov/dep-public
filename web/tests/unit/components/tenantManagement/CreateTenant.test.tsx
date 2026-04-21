import React, { ReactNode } from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import * as tenantService from 'services/tenantService';
import * as reactRouter from 'react-router';
import TenantCreationPage from 'components/tenantManagement/Create';
import { USER_ROLES } from 'services/userService/constants';
import { createMemoryRouter, useRouteLoaderData, RouterProvider } from 'react-router';

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

jest.mock('react', () => ({
    //this makes the suspense component render its children immediately
    ...jest.requireActual('react'),
    Suspense: jest.fn(({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => {
        return children;
    }),
}));

jest.mock('react-router', () => {
    const actual = jest.requireActual('react-router');
    return {
        ...actual,
        Await: ({ children, resolve }: { children: any; resolve: any }) => {
            // Resolve the promise immediately and call children with the result
            return children(resolve);
        },
        useParams: jest.fn(() => {
            return { tenantShortName: mockTenant.short_name };
        }),
        useNavigate: jest.fn(() => navigate),
        useRouteLoaderData: jest.fn((id) => {
            if (id === 'tenant-admin') {
                return [mockTenant]; // Return array directly for tenant list
            }
            return { tenants: [mockTenant] };
        }),
        useBlocker: jest.fn((fn) => {
            shouldBlockNavigation = fn;
            return blocker;
        }),
    };
});

jest.mock('axios');

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    Box: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Skeleton: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('components/common/Typography/', () => ({
    Heading1: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
    Heading2: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
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

const navigate = jest.fn();
let user: ReturnType<typeof userEvent.setup>;
let renderResult: ReturnType<typeof render>;

let shouldBlockNavigation: any;
const blockerReset = jest.fn();
const blockerProceed = jest.fn();
const blocker = {
    state: 'unblocked',
    reset: blockerReset,
    proceed: blockerProceed,
};

jest.mock('services/tenantService', () => ({
    createTenant: jest.fn(),
}));

jest.mock('services/notificationService/notificationSlice', () => ({
    openNotification: jest.fn(),
}));

// Mocking AutoBreadcrumbs component
jest.mock('components/common/Navigation/Breadcrumb', () => ({
    AutoBreadcrumbs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const router = createMemoryRouter(
    [
        {
            path: '/tenantadmin/create',
            element: <TenantCreationPage />,
            id: 'tenant',
        },
    ],
    { initialEntries: ['/tenantadmin/create'] },
);

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(() => jest.fn()),
}));

describe('Tenant Creation Page tests', () => {
    const editField = (placeholder: string, value: string) => {
        const field = screen.getByPlaceholderText(placeholder) as HTMLInputElement;
        fireEvent.change(field, { target: { value } });
        fireEvent.blur(field); // Trigger validation via blur
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        user = userEvent.setup();
        jest.spyOn(reactRouter, 'useNavigate').mockReturnValue(navigate);
        renderResult = render(<RouterProvider router={router} />);
        await screen.findByText('Create Tenant Instance');
    });

    test('Tenant creation page is rendered', async () => {
        expect(screen.getByText('Create Tenant Instance')).toBeVisible();
        expect(screen.getByText('Tenant Details')).toBeVisible();
        expect(screen.getByText('* Required fields')).toBeVisible();

        // The page should be fetching the tenant data to validate the short name
        expect(useRouteLoaderData).toHaveBeenCalledWith('tenant-admin');

        // Check that the form isn't pre-filled
        const fields = screen.getAllByRole('textbox');
        expect(fields).toHaveLength(8);
        expect(screen.getByPlaceholderText('Name')).toContainValue('');
        expect(screen.getByPlaceholderText('Full Name')).toContainValue('');
        expect(screen.getByPlaceholderText('Email')).toContainValue('');
        expect(screen.getByPlaceholderText('shortname')).toContainValue('');
        expect(screen.getByPlaceholderText('Title')).toContainValue('');
        expect(screen.getByPlaceholderText('Description')).toContainValue('');
        expect(screen.getByText('Drag and drop your image here.')).toBeVisible();
        expect(screen.getByTestId('tenant-form/image-credit')).toContainValue('');
        expect(screen.getByTestId('tenant-form/image-description')).toContainValue('');

        // Check that the buttons are visible
        expect(screen.getByText('Create Instance')).toBeVisible();
        // Button should be disabled until form is completed
        expect(screen.getByText('Create Instance')).toBeDisabled();
        expect(screen.getByText('Cancel')).toBeVisible();
    });

    test('Button is enabled after form is filled', async () => {
        editField('Name', 'New Name');
        editField('Full Name', 'New Full Name');
        editField('Email', 'contactone@example.com');
        editField('shortname', 'newname');
        editField('Title', 'New Title');
        editField('Description', 'New Description');
        await waitFor(() => expect(screen.getByText('Create Instance')).toBeEnabled());
    });

    test('Email throws error if invalid', async () => {
        editField('Email', 'invalid-email');
        expect(await screen.findByText("That doesn't look like a valid email...")).toBeVisible();
        expect(screen.getByText('Create Instance')).toBeDisabled();
    });

    test('Short name throws error if invalid', async () => {
        editField('shortname', 'invalid shortname');
        expect(await screen.findByText('Your input contains invalid symbols')).toBeVisible();
        expect(screen.getByText('Create Instance')).toBeDisabled();
    });

    test('Character limit is enforced on fields', async () => {
        const field = screen.getByPlaceholderText('Title') as HTMLInputElement;
        fireEvent.change(field, { target: { value: 'a'.repeat(256) } });
        fireEvent.blur(field);
        expect(await screen.findByText('This input is too long!')).toBeVisible();
        expect(screen.getByText('Create Instance')).toBeDisabled();
    });

    test('Unique short name is enforced', async () => {
        editField('shortname', mockTenant.short_name);
        expect(await screen.findByText('This short name is already in use')).toBeVisible();
        expect(screen.getByText('Create Instance')).toBeDisabled();
    });

    test('Cancel button navigates back to tenant listing page', async () => {
        await user.click(screen.getByText('Cancel'));
        expect(
            shouldBlockNavigation({
                nextLocation: { pathname: '/manage/tenantadmin' },
                currentLocation: { pathname: '/manage/tenantadmin/1/detail' },
            }),
            // Navigation should not be blocked since the form is untouched
        ).toBe(false);
        await waitFor(() => {
            expect(navigate).toHaveBeenNthCalledWith(1, '/manage/tenantadmin');
        });
    });

    test('User is prompted for confirmation when navigating with unsaved changes', async () => {
        editField('Name', 'New Name');
        await user.click(screen.getByText('Cancel'));
        await waitFor(() => {
            expect(navigate).toHaveBeenNthCalledWith(1, '/manage/tenantadmin');
        });
        // navigate() is a mock fn, so we have to simulate the blocker ourselves
        expect(
            shouldBlockNavigation({
                nextLocation: { pathname: '/manage/tenantadmin' },
                currentLocation: { pathname: '/manage/tenantadmin/1/detail' },
            }),
            // Navigation should be blocked since the form is dirty and the path is different
        ).toBe(true);
        const blocker = {
            state: 'blocked' as const,
            location: {
                pathname: '/manage/tenantadmin',
                state: { from: '/manage/tenantadmin/1/detail' },
                search: '',
                hash: '',
                key: 'foo',
                unstable_mask: undefined,
            },
            proceed: blockerProceed,
            reset: blockerReset,
        };
        jest.spyOn(reactRouter, 'useBlocker').mockReturnValue(blocker);
        renderResult.unmount();
        render(<RouterProvider router={router} />);
        expect(await screen.findByText('Unsaved Changes')).toBeVisible();
        await user.click(screen.getByText('Leave'));
        expect(blockerProceed).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledTimes(1);
    });

    test('Create instance button calls createTenant action', async () => {
        editField('Name', 'New Name');
        editField('Full Name', 'New Full Name');
        editField('Email', 'contactone@example.com');
        editField('shortname', 'newname');
        editField('Title', 'New Title');
        editField('Description', 'New Description');
        await waitFor(() => expect(screen.getByText('Create Instance')).toBeEnabled());
        await user.click(screen.getByText('Create Instance'));
        const updatedTenant = {
            name: 'New Name',
            title: 'New Title',
            description: 'New Description',
            contact_name: 'New Full Name',
            contact_email: 'contactone@example.com',
            short_name: 'newname',
            hero_image_url: '',
            hero_image_credit: '',
            hero_image_description: '',
        };
        expect(tenantService.createTenant).toHaveBeenCalledWith(updatedTenant);
    });
});
