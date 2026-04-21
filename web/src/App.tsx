import React, { useEffect, useContext, useMemo } from 'react';
import '@bcgov/design-tokens/css-prefixed/variables.css'; // Will be available to use in all component
import './App.scss';
import { RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router';
import { useAppSelector, useAppDispatch } from './hooks';
import UnauthenticatedRoutes from './routes/UnauthenticatedRoutes';
import AuthenticatedRoutes from './routes/AuthenticatedRoutes';
import LazyRoute, { resolveLazyRouteTree } from 'routes/LazyRoute';
import { AppConfig } from 'config';
import { TenantState } from 'reduxSlices/tenantSlice';
import { AuthKeyCloakContext } from './components/auth/AuthKeycloakContext';
import { findTenantInPath } from './utils';
import UserService from './services/userService';

const MidScreenLoaderLazy = React.lazy(() =>
    import('components/common').then((module) => ({ default: module.MidScreenLoader })),
);

const App = () => {
    const dispatch = useAppDispatch();
    const userDetail = useAppSelector((state) => state.user.userDetail);
    const basename = findTenantInPath();
    const tenant: TenantState = useAppSelector((state) => state.tenant);
    const { isAuthenticated, isAuthenticating } = useContext(AuthKeyCloakContext);

    useEffect(() => {
        const optimisticTenantId = AppConfig.tenant.isSingleTenantEnvironment
            ? AppConfig.tenant.defaultTenant
            : basename;
        const optimisticBasename = AppConfig.tenant.isSingleTenantEnvironment ? '' : basename;

        sessionStorage.setItem('apiurl', String(AppConfig.apiUrl));
        sessionStorage.setItem('languageId', AppConfig.language.defaultLanguageId);

        if (optimisticTenantId) {
            sessionStorage.setItem('tenantId', optimisticTenantId);
            sessionStorage.setItem('basename', optimisticBasename);
        }
    }, [basename, AppConfig.apiUrl]);

    // Re-trigger auth data loading if authenticated but user details haven't loaded yet and tenant is now available
    // This handles the race condition where authentication completes before tenant loading
    useEffect(() => {
        if (isAuthenticated && tenant.id && !userDetail?.sub) {
            // Tenant is now loaded, retry loading user data
            UserService.setAuthData(dispatch);
        }
    }, [isAuthenticated, tenant.id, userDetail?.sub, dispatch]);

    const router = useMemo(() => {
        const routeTree = resolveLazyRouteTree(
            <LazyRoute
                id="root"
                loaderLazy={() => import('routes/RootRouteLoader')}
                ComponentLazy={() => import('routes/RootRoute')}
                ErrorBoundaryLazy={() => import('routes/NotFound')}
            >
                {UnauthenticatedRoutes}
                <LazyRoute ComponentLazy={() => import('routes/AdminAuthGuard')}>{AuthenticatedRoutes}</LazyRoute>
            </LazyRoute>,
        );

        return createBrowserRouter(createRoutesFromElements(routeTree), {
            basename: `/${basename}`,
        });
    }, [basename]);

    if (isAuthenticating) {
        return <MidScreenLoaderLazy message="Loading user details..." />;
    }

    return <RouterProvider router={router} />;
};
export default App;
