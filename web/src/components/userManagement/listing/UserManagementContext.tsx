import React, { createContext, useState, useEffect, JSX } from 'react';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { createDefaultPageInfo, PageInfo, PaginationOptions } from 'components/common/Table/types';
import { User, createDefaultUser } from 'models/user';
import { getUserList } from 'services/userService/api';
import { useLocation } from 'react-router';
import { updateURLWithPagination } from 'components/common/Table/utils';

export interface UserManagementContextProps {
    usersLoading: boolean;
    pageInfo: PageInfo;
    users: User[];
    paginationOptions: PaginationOptions<User>;
    setPaginationOptions: React.Dispatch<React.SetStateAction<PaginationOptions<User>>>;
    addUserModalOpen: boolean;
    setAddUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    assignRoleModalOpen: boolean;
    setassignRoleModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
    loadUserListing: () => void;
    setSearchText: React.Dispatch<React.SetStateAction<string>>;
    reassignRoleModalOpen: boolean;
    setReassignRoleModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export type EngagementParams = {
    engagementId: string;
};

export const UserManagementContext = createContext<UserManagementContextProps>({
    usersLoading: true,
    pageInfo: createDefaultPageInfo(),
    users: [],
    paginationOptions: {
        page: 0,
        size: 0,
    },
    setPaginationOptions: () => {
        return;
    },
    addUserModalOpen: false,
    setAddUserModalOpen: () => {
        return;
    },
    assignRoleModalOpen: false,
    setassignRoleModalOpen: () => {
        return;
    },
    user: createDefaultUser,
    setUser: () => {
        return;
    },
    loadUserListing: () => {
        return;
    },
    setSearchText: () => {
        return;
    },
    reassignRoleModalOpen: false,
    setReassignRoleModalOpen: () => {
        return;
    },
});

export const UserManagementContextProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const pageFromURL = searchParams.get('page');
    const sizeFromURL = searchParams.get('size');
    const dispatch = useAppDispatch();
    const [users, setUsers] = useState<User[]>([]);
    const [user, setUser] = useState<User>(createDefaultUser);
    const [pageInfo, setPageInfo] = useState<PageInfo>(createDefaultPageInfo());
    const [usersLoading, setUsersLoading] = useState(true);
    const [addUserModalOpen, setAddUserModalOpen] = useState(false);
    const [assignRoleModalOpen, setassignRoleModalOpen] = useState(false);
    const [reassignRoleModalOpen, setReassignRoleModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [paginationOptions, setPaginationOptions] = useState<PaginationOptions<User>>({
        page: Number(pageFromURL) || 1,
        size: Number(sizeFromURL) || 10,
        sort_key: 'last_name',
        nested_sort_key: 'last_name',
        sort_order: 'asc',
    });

    useEffect(() => {
        updateURLWithPagination(paginationOptions);
        loadUserListing();
    }, [paginationOptions, searchText]);

    const { page, size, sort_key, nested_sort_key, sort_order } = paginationOptions;

    const loadUserListing = async () => {
        try {
            setUsersLoading(true);
            const response = await getUserList({
                page,
                size,
                sort_key: nested_sort_key || sort_key,
                sort_order,
                include_roles: true,
                search_text: searchText,
                include_inactive: true,
            });
            setUsers(response.items);
            setPageInfo({
                total: response.total,
            });
            setUsersLoading(false);
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while trying to fetch users, please refresh the page or try again at a later time',
                }),
            );
            setUsersLoading(false);
        }
    };

    return (
        <UserManagementContext.Provider
            value={{
                users,
                pageInfo,
                usersLoading,
                paginationOptions,
                setPaginationOptions,
                addUserModalOpen,
                setAddUserModalOpen,
                assignRoleModalOpen,
                setassignRoleModalOpen,
                user,
                setUser,
                loadUserListing,
                setSearchText,
                reassignRoleModalOpen,
                setReassignRoleModalOpen,
            }}
        >
            {children}
        </UserManagementContext.Provider>
    );
};
