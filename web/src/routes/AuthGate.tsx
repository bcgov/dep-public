import React from 'react';
import { useAppSelector } from 'hooks';
import { useLocation, Navigate, Outlet } from 'react-router';
import { USER_COMPOSITE_ROLE } from 'models/user';
import { getPath, ROUTES } from './routes';

const AuthGate = ({ allowedRoles }: { allowedRoles: string[] }) => {
    const permissions = useAppSelector((state) => state.user.roles);
    const location = useLocation();

    const scopesMap: { [scope: string]: boolean } = {};
    allowedRoles.forEach((scope) => {
        scopesMap[scope] = true;
    });

    return permissions.some((permission) => scopesMap[permission]) ||
        permissions?.includes('/' + USER_COMPOSITE_ROLE.TEAM_MEMBER.value) ? (
        <Outlet />
    ) : (
        <Navigate to={getPath(ROUTES.UNAUTHORIZED)} state={{ from: location }} replace />
    );
};

export default AuthGate;
