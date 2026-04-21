import React from 'react';
import { useMatches } from 'react-router';
import AuthGate from './AuthGate';

type AuthGateHandle = {
    allowedRoles?: string[];
};

const AuthGateRoute = () => {
    const matches = useMatches();
    const routeMatch = [...matches].reverse().find((match) => {
        const handle = match.handle as AuthGateHandle | undefined;
        return Array.isArray(handle?.allowedRoles);
    });
    const allowedRoles = (routeMatch?.handle as AuthGateHandle | undefined)?.allowedRoles ?? [];

    return <AuthGate allowedRoles={allowedRoles} />;
};

export default AuthGateRoute;
