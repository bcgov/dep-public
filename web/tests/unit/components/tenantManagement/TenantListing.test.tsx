import React, { ReactNode } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupEnv } from '../setEnvVars';
import TenantListingPage from '../../../../src/components/tenantManagement/Listing';
import { USER_ROLES } from 'services/userService/constants';

const mockTenantOne = {
    id: 1,
    name: 'Tenant One',
    title: 'Title One',
    description: 'Description One',
    contact_name: 'Contact One',
    short_name: 'tenantone',
};

const mockTenantTwo = {
    id: 2,
    name: 'Tenant Two',
    title: 'Title Two',
    description: 'Description Two',
    contact_name: 'Contact Two',
    short_name: 'tenanttwo',
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

jest.mock('axios');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    lazy: () => () => null,
}));

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    Link: ({ children }: { children: ReactNode }) => {
        return <a>{children}</a>;
    },
}));

jest.mock('components/common/Navigation/Breadcrumb', () => ({
    AutoBreadcrumbs: () => <div />,
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

// Mocking AutoBreadcrumbs component
jest.mock('components/common/Navigation/Breadcrumb', () => ({
    AutoBreadcrumbs: () => <div>Breadcrumbs</div>,
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({
        search: '',
    })),
    useRouteLoaderData: jest.fn(() => Promise.resolve({ tenants: [mockTenantOne, mockTenantTwo] })),
    Await: ({ children, resolve }: { children: (data: unknown) => ReactNode; resolve: unknown }) => {
        // For tests, immediately "resolve" the promise by calling children with mockTenant
        // This simulates the resolved state without actually waiting
        return <>{children([mockTenantOne, mockTenantTwo])}</>;
    },
}));

describe('Tenant Listing Page tests', () => {
    beforeEach(() => {
        setupEnv();
    });

    test('Tenant table is rendered', async () => {
        render(<TenantListingPage />);

        await waitFor(() => {
            expect(screen.getByText('Tenant One')).toBeVisible();
            expect(screen.getByText('Tenant Two')).toBeVisible();
            expect(screen.getByText('Description One')).toBeVisible();
            expect(screen.getByText('Description Two')).toBeVisible();

            expect(screen.getByText('Add Tenant')).toBeVisible();
        });
    });
});
