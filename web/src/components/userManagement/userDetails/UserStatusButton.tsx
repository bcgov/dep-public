import React, { useContext, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from 'hooks';
import { UserDetailsContext } from './UserDetailsContext';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import { openNotification } from 'services/notificationService/notificationSlice';
import { toggleUserStatus } from 'services/userService/api';
import { USER_ROLES } from 'services/userService/constants';
import { USER_COMPOSITE_ROLE } from 'models/user';
import { Button } from 'components/common/Input/Button';
import { faUserCheck, faUserXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const UserStatusButton = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => {
    const { roles, userDetail } = useAppSelector((state) => state.user);
    const { short_name: tenantName } = useAppSelector((state) => state.tenant);
    const { savedUser, getUserDetails } = useContext(UserDetailsContext);
    const [userStatus, setUserStatus] = useState(false);
    const [togglingUserStatus, setTogglingUserStatus] = useState(false);
    const dispatch = useAppDispatch();

    const isActive = savedUser?.status_id === 1;
    const isSelf = savedUser?.id === userDetail?.user?.id;
    const isAdminUser = [USER_COMPOSITE_ROLE.ADMIN.label, USER_COMPOSITE_ROLE.SUPER_ADMIN.label].includes(
        savedUser?.main_role ?? '',
    );
    const canToggle = roles.includes(USER_ROLES.TOGGLE_USER_STATUS);

    useEffect(() => {
        setUserStatus(isActive);
    }, [savedUser]);

    const handleUpdateActiveStatus = async (active: boolean) => {
        if (!savedUser) {
            return;
        }

        try {
            setUserStatus(active);
            setTogglingUserStatus(true);
            await toggleUserStatus(savedUser.external_id, active);
            getUserDetails();
            dispatch(
                openNotification({
                    severity: 'success',
                    text: `You have successfully ${active ? 'activated' : 'deactivated'} ${savedUser.first_name} ${
                        savedUser.last_name
                    }.`,
                }),
            );
            setTogglingUserStatus(false);
        } catch {
            setUserStatus(!active);
            setTogglingUserStatus(false);
            dispatch(openNotification({ severity: 'error', text: 'Failed to update user status' }));
        }
    };

    const handleToggleUserStatus = async (active: boolean) => {
        if (!roles.includes(USER_ROLES.TOGGLE_USER_STATUS)) {
            dispatch(
                openNotification({ severity: 'error', text: 'You do not have permissions to update user status' }),
            );
            return;
        }

        if (active) {
            return handleActivateUser();
        }

        return handleDeactivateUser();
    };
    const handleDeactivateUser = () => {
        dispatch(
            openNotificationModal({
                open: true,
                data: {
                    style: 'warning',
                    header: `Deactivate ${savedUser?.first_name} ${savedUser?.last_name} in ${tenantName}?`,
                    subText: [
                        {
                            text: `This user will lose all access to resources within this organization. You can reactivate this user at any time to restore their access.`,
                        },
                        {
                            text: 'Do you want to deactivate this user?',
                        },
                    ],
                    handleConfirm: () => {
                        handleUpdateActiveStatus(false);
                    },
                },
                type: 'confirm',
            }),
        );
    };

    const handleActivateUser = () => {
        dispatch(
            openNotificationModal({
                open: true,
                data: {
                    style: 'warning',
                    header: `Reactivate ${savedUser?.first_name} ${savedUser?.last_name}?`,
                    subText: [
                        {
                            text:
                                'This user will regain access to the system with the ' +
                                'same permission level they had before deactivation. ' +
                                'You may need to reinstate their access to some engagements manually.',
                        },
                        { text: 'Ensure that reactivating this user complies with your organization’s policies.' },
                        { text: 'Do you want to reactivate this user?' },
                    ],
                    handleConfirm: () => {
                        handleUpdateActiveStatus(true);
                    },
                },
                type: 'confirm',
            }),
        );
    };

    return (
        <Button
            size={size}
            fullWidth
            data-testid="user-status-toggle"
            loading={togglingUserStatus}
            onClick={() => handleToggleUserStatus(!userStatus)}
            disabled={isAdminUser || isSelf || !canToggle}
            icon={<FontAwesomeIcon icon={userStatus ? faUserXmark : faUserCheck} />}
        >
            {userStatus ? 'Deactivate User' : 'Reactivate User'}
        </Button>
    );
};

export default UserStatusButton;
