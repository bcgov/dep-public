import React, { Suspense } from 'react';
import { UserDetails } from './UserDetails';
import { AddToEngagementModal } from './AddToEngagement';
import { UserDetailsContextProvider } from './UserDetailsContext';
import { Await, useLoaderData } from 'react-router';
import UserDetailsSkeleton from './UserDetailsSkeleton';
import { UserDetailsLoaderData } from './userDetailsLoader';
import { User } from 'models/user';

export const UserProfile = () => {
    const { user } = useLoaderData() as UserDetailsLoaderData;

    return (
        <Suspense fallback={<UserDetailsSkeleton />}>
            <Await resolve={user}>
                {(resolvedUser: User) => (
                    <UserDetailsContextProvider initialUser={resolvedUser}>
                        <UserDetails />
                        <AddToEngagementModal />
                    </UserDetailsContextProvider>
                )}
            </Await>
        </Suspense>
    );
};

export default UserProfile;
