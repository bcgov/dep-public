import React, { createContext, useState, useEffect, JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoaderData } from 'react-router';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { User, createDefaultUser } from 'models/user';
import { getUser } from 'services/userService/api';
import { getMembershipsByUser } from 'services/membershipService';
import { EngagementTeamMember } from 'models/engagementTeamMember';

export interface UserViewContext {
    savedUser: User | undefined;
    isUserLoading: boolean;
    addUserModalOpen: boolean;
    isMembershipLoading: boolean;
    memberships: EngagementTeamMember[];
    setMemberships: React.Dispatch<React.SetStateAction<EngagementTeamMember[]>>;
    setAddUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    getUserMemberships: () => Promise<void>;
    getUserDetails: () => Promise<void>;
}

export type UserParams = {
    userId: string;
};

interface UserDetailsLoaderData {
    user: User;
}

export const UserDetailsContext = createContext<UserViewContext>({
    savedUser: createDefaultUser,
    isUserLoading: true,
    addUserModalOpen: false,
    memberships: [],
    setMemberships: () => {
        throw new Error('set memberships is not implemented');
    },
    setAddUserModalOpen: () => {
        throw new Error('Not implemented');
    },
    getUserMemberships: () => {
        throw new Error('Not implemented');
    },
    getUserDetails: () => {
        throw new Error('Not implemented');
    },
    isMembershipLoading: true,
});

export const UserDetailsContextProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const { userId } = useParams<UserParams>();
    const navigate = useNavigate();
    const { user } = useLoaderData() as UserDetailsLoaderData;
    const dispatch = useAppDispatch();
    const [savedUser, setSavedUser] = useState<User | undefined>(user);
    const [isUserLoading, setUserLoading] = useState(false);
    const [isMembershipLoading, setMembershipLoading] = useState(true);
    const [memberships, setMemberships] = useState<EngagementTeamMember[]>([]);
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);

    useEffect(() => {
        setSavedUser(user);
        setUserLoading(false);
    }, [user]);

    const getUserDetails = async () => {
        if (isNaN(Number(userId))) {
            navigate('/usermanagement');
            return;
        }
        setUserLoading(true);
        try {
            const fetchedUser = await getUser({ user_id: Number(userId), include_roles: true });
            setSavedUser(fetchedUser);
            setUserLoading(false);
        } catch {
            setUserLoading(false);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while fetching User information',
                }),
            );
        }
    };

    useEffect(() => {
        getUserMemberships();
    }, [savedUser]);

    const getUserMemberships = async () => {
        if (!savedUser) {
            return;
        }
        const userMemberships = await getMembershipsByUser({
            user_external_id: savedUser.external_id,
            include_engagement_details: true,
            include_revoked: true,
        });

        setMemberships(userMemberships);
        setMembershipLoading(false);
    };

    return (
        <UserDetailsContext.Provider
            value={{
                savedUser,
                isUserLoading,
                addUserModalOpen,
                setAddUserModalOpen,
                memberships,
                setMemberships,
                getUserMemberships,
                getUserDetails,
                isMembershipLoading,
            }}
        >
            {children}
        </UserDetailsContext.Provider>
    );
};
