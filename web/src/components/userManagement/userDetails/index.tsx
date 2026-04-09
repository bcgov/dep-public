import React, { Suspense } from 'react';
import { UserDetails } from './UserDetails';
import { AddToEngagementModal } from './AddToEngagement';
import { UserDetailsContextProvider } from './UserDetailsContext';
import { ResponsiveContainer } from 'components/common/Layout';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { Await, useLoaderData } from 'react-router';
import UserDetailsSkeleton from './UserDetailsSkeleton';
import { UserDetailsLoaderData } from './userDetailsLoader';
import { User } from 'models/user';

export const UserProfile = () => {
    const { user } = useLoaderData() as UserDetailsLoaderData;

    return (
        <Suspense
            fallback={
                <ResponsiveContainer>
                    <AutoBreadcrumbs />
                    <UserDetailsSkeleton />
                </ResponsiveContainer>
            }
        >
            <Await resolve={user}>
                {(resolvedUser: User) => (
                    <UserDetailsContextProvider initialUser={resolvedUser}>
                        <ResponsiveContainer>
                            <AutoBreadcrumbs />
                            <UserDetails />
                        </ResponsiveContainer>
                        <AddToEngagementModal />
                    </UserDetailsContextProvider>
                )}
            </Await>
        </Suspense>
    );
};

export default UserProfile;
