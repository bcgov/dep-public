import React, { createContext, useState, useEffect, JSX } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { User, createDefaultUser } from 'models/user';
import { getUser } from 'services/userService/api';
import { getMembershipsByUser } from 'services/membershipService';
import { EngagementTeamMember } from 'models/engagementTeamMember';
import { ROUTES, getPath } from 'routes/routes';

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

export const UserDetailsContextProvider = ({
    children,
    initialUser,
}: {
    children: JSX.Element | JSX.Element[];
    initialUser: User;
}) => {
    const { userId } = useParams<UserParams>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [savedUser, setSavedUser] = useState<User | undefined>(initialUser);
    const [isUserLoading, setUserLoading] = useState(false);
    const [isMembershipLoading, setMembershipLoading] = useState(true);
    const [memberships, setMemberships] = useState<EngagementTeamMember[]>([]);
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);

    useEffect(() => {
        setSavedUser(initialUser);
        setUserLoading(false);
    }, [initialUser]);

    const getUserDetails = async () => {
        if (isNaN(Number(userId))) {
            navigate(getPath(ROUTES.USER_MANAGEMENT));
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
    }, [savedUser?.external_id]);

    const getUserMemberships = async () => {
        if (!savedUser) {
            return;
        }
        setMembershipLoading(true);
        try {
            const userMemberships = await getMembershipsByUser({
                user_external_id: savedUser.external_id,
                include_engagement_details: true,
                include_revoked: true,
            });
            setMemberships(userMemberships);
        } finally {
            setMembershipLoading(false);
        }
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
