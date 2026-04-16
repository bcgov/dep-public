import React, { useContext, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAppSelector } from 'hooks';
import { AuthKeyCloakContext } from 'components/auth/AuthKeycloakContext';
import { getPath, ROUTES } from './routes';
import { MidScreenLoader } from 'components/common';
import UserService from 'services/userService';

const AdminAuthGuard = () => {
    const { isAuthenticated, keycloakInstance } = useContext(AuthKeyCloakContext);
    const roles = useAppSelector((state) => state.user.roles);
    const authenticationLoading = useAppSelector((state) => state.user.authentication.loading);
    const userDetail = useAppSelector((state) => state.user.userDetail);
    const location = useLocation();
    const attemptedLoginForPathRef = useRef<string | null>(null);

    useEffect(() => {
        const targetPath = `${location.pathname}${location.search}${location.hash}`;

        if (!isAuthenticated && keycloakInstance && attemptedLoginForPathRef.current !== targetPath) {
            attemptedLoginForPathRef.current = targetPath;
            UserService.doLogin(window.location.href);
        }
    }, [isAuthenticated, keycloakInstance, location.hash, location.pathname, location.search]);

    if (!isAuthenticated) {
        return <MidScreenLoader message="Redirecting to sign in..." />;
    }

    if (authenticationLoading || !userDetail?.sub) {
        return <MidScreenLoader message="Loading user details..." />;
    }

    const noAccessPath = getPath(ROUTES.NO_ACCESS);
    const isNoAccessRoute = location.pathname.endsWith(noAccessPath);

    if (roles.length === 0 && !isNoAccessRoute) {
        return <Navigate to={noAccessPath} replace state={{ from: location }} />;
    }

    if (roles.length > 0 && isNoAccessRoute) {
        return <Navigate to={getPath(ROUTES.HOME)} replace />;
    }

    return <Outlet />;
};

export default AdminAuthGuard;
