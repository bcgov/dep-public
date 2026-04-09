import React, { useMemo, useContext } from 'react';
import { MenuItem, Select } from '@mui/material';
import { User, USER_COMPOSITE_ROLE, USER_STATUS } from 'models/user';
import { UserManagementContext } from './UserManagementContext';
import { useAppSelector } from 'hooks';
import { USER_ROLES } from 'services/userService/constants';

interface ActionDropDownItem {
    value: number;
    label: string;
    action?: () => void;
    condition?: boolean;
}
export const ActionsDropDown = ({ selectedUser }: { selectedUser: User }) => {
    const { setAddUserModalOpen, setassignRoleModalOpen, setUser, setReassignRoleModalOpen } =
        useContext(UserManagementContext);
    const { roles, userDetail } = useAppSelector((state) => state.user);

    const hasNoRole = (): boolean => {
        if (selectedUser.main_role) {
            return false;
        }
        return true;
    };

    const isAdmin = (): boolean => {
        if (selectedUser?.main_role == USER_COMPOSITE_ROLE.ADMIN.label) {
            return true;
        }
        return false;
    };

    const isViewer = (): boolean => {
        if (selectedUser?.main_role == USER_COMPOSITE_ROLE.VIEWER.label) {
            return true;
        }
        return false;
    };

    const ITEMS: ActionDropDownItem[] = useMemo(
        () => [
            {
                value: 1,
                label: 'Assign Role',
                action: () => {
                    setUser(selectedUser);
                    setassignRoleModalOpen(true);
                },
                condition:
                    hasNoRole() &&
                    roles?.includes(USER_ROLES.EDIT_MEMBERS) &&
                    selectedUser.status_id == USER_STATUS.ACTIVE.value &&
                    selectedUser.id != userDetail?.user?.id,
            },
            {
                value: 2,
                label: 'Assign to an Engagement',
                action: () => {
                    setUser(selectedUser);
                    setAddUserModalOpen(true);
                },
                condition:
                    !hasNoRole() &&
                    !isAdmin() &&
                    !isViewer() &&
                    selectedUser.status_id == USER_STATUS.ACTIVE.value &&
                    selectedUser.id != userDetail?.user?.id,
            },
            {
                value: 3,
                label: 'Reassign Role',
                action: () => {
                    setUser(selectedUser);
                    setReassignRoleModalOpen(true);
                },
                condition:
                    !hasNoRole() &&
                    roles.includes(USER_ROLES.UPDATE_USER_GROUP) &&
                    (selectedUser.main_role !== USER_COMPOSITE_ROLE.ADMIN.label ||
                        roles.includes(USER_ROLES.SUPER_ADMIN)) &&
                    selectedUser.status_id == USER_STATUS.ACTIVE.value &&
                    selectedUser.id != userDetail?.user?.id,
            },
        ],
        [selectedUser.id, selectedUser.main_role],
    );

    return (
        <Select
            id={`action-drop-down-${selectedUser.id}`}
            value={0}
            fullWidth
            size="small"
            sx={{ backgroundColor: 'var(--bcds-surface-background-white)' }}
        >
            <MenuItem value={0} sx={{ fontStyle: 'italic', height: '2em' }} color="info" disabled>
                {'(Select One)'}
            </MenuItem>
            {ITEMS.filter((item) => item.condition).map((item) => (
                <MenuItem key={item.value} value={item.value} onClick={item.action}>
                    {item.label}
                </MenuItem>
            ))}
        </Select>
    );
};
