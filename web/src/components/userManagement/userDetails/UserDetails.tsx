import React, { JSX, useContext, useState } from 'react';
import { Grid2 as Grid, Link, Paper, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from 'hooks';
import { UserDetailsContext } from './UserDetailsContext';
import { formatDate } from 'components/common/dateHelper';
import AssignedEngagementsListing from './AssignedEngagementsListing';
import UserStatusButton from './UserStatusButton';
import UserDetailsSkeleton from './UserDetailsSkeleton';
import { USER_COMPOSITE_ROLE, USER_STATUS } from 'models/user';
import { Button } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareDashedCirclePlus, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';
import { Heading2, Heading3 } from 'components/common/Typography';
import { deleteUser } from 'services/userService/api';
import { openNotification } from 'services/notificationService/notificationSlice';
import { USER_ROLES } from 'services/userService/constants';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';

export const UserDetail = ({ label, value }: { label: string; value: JSX.Element }) => {
    return (
        <Grid container spacing={1} size={12}>
            <Grid size="auto">
                <BodyText bold>{label}:</BodyText>
            </Grid>
            <Grid size="auto">{value}</Grid>
        </Grid>
    );
};

export const UserDetails = () => {
    const { savedUser, setAddUserModalOpen, isUserLoading } = useContext(UserDetailsContext);
    const { userDetail, roles } = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [isDeletingUser, setIsDeletingUser] = useState(false);

    const isSelf = savedUser?.id === userDetail?.user?.id;
    const isSuperAdmin = roles.includes(USER_ROLES.SUPER_ADMIN);
    const isInactive = savedUser?.status_id === USER_STATUS.INACTIVE.value;
    const canAssignToEngagement = !isInactive && !isSelf;
    const isAdminUser = savedUser?.main_role === USER_COMPOSITE_ROLE.ADMIN.label;

    const canDeleteUser = savedUser?.status_id === USER_STATUS.INACTIVE.value && !isSelf;

    if (isUserLoading) {
        return <UserDetailsSkeleton />;
    }

    const handleDeleteUser = () => {
        if (!savedUser) return;
        if (!isSuperAdmin)
            return dispatch(openNotification({ severity: 'error', text: 'Only Super Admins can delete users.' }));
        if (savedUser.status_id !== USER_STATUS.INACTIVE.value)
            return dispatch(openNotification({ severity: 'error', text: 'User must be deactivated before deletion.' }));
        if (isSelf)
            return dispatch(openNotification({ severity: 'error', text: 'You cannot delete your own account.' }));

        dispatch(
            openNotificationModal({
                open: true,
                data: {
                    style: 'danger',
                    header: `Delete ${savedUser.first_name} ${savedUser.last_name}?`,
                    subText: [
                        { text: 'This action removes the user from the database and cannot be undone.' },
                        { text: 'Only proceed if you understand the operational and audit implications.' },
                        { text: 'Do you want to permanently delete this user?' },
                    ],
                    confirmButtonText: 'Delete User',
                    cancelButtonText: 'Cancel',
                    handleConfirm: async () => {
                        try {
                            setIsDeletingUser(true);
                            await deleteUser(savedUser.id);
                            dispatch(
                                openNotification({
                                    severity: 'success',
                                    text: `${savedUser.first_name} ${savedUser.last_name} was deleted successfully.`,
                                }),
                            );
                            navigate('/usermanagement');
                        } catch {
                            dispatch(openNotification({ severity: 'error', text: 'Failed to delete user.' }));
                        } finally {
                            setIsDeletingUser(false);
                        }
                    },
                },
                type: 'confirm',
            }),
        );
    };

    return (
        <Grid container spacing={3} size={12} mt={2}>
            <Grid container size={{ xs: 12, md: 8 }} p={3} component={Paper}>
                <Grid container size={12} spacing={2} mb={2} alignItems="center">
                    <Grid size={12}>
                        <Heading2 decorated mb={0}>{`${savedUser?.last_name}, ${savedUser?.first_name}`}</Heading2>
                    </Grid>
                </Grid>
                <Grid container direction="column" spacing={1}>
                    <UserDetail
                        label="Email"
                        value={<Link href={`mailto:${savedUser?.email_address}`}>{savedUser?.email_address}</Link>}
                    />
                    <UserDetail
                        label="Date Added"
                        value={<BodyText>{savedUser ? formatDate(savedUser?.created_date) : ''}</BodyText>}
                    />
                    <UserDetail label="Role" value={<BodyText>{savedUser?.main_role || 'Unassigned'}</BodyText>} />
                    <UserDetail
                        label="Status"
                        value={
                            <BodyText>
                                {savedUser?.status_id === USER_STATUS.ACTIVE.value
                                    ? USER_STATUS.ACTIVE.label
                                    : USER_STATUS.INACTIVE.label}
                            </BodyText>
                        }
                    />
                </Grid>
            </Grid>

            <Grid container direction="column" size={{ xs: 12, md: 4 }} component={Paper} p={3}>
                <Heading3 bold>Actions</Heading3>
                <Grid container spacing={1}>
                    {savedUser?.main_role !== USER_COMPOSITE_ROLE.ADMIN.label && (
                        <Grid size={12}>
                            <Button
                                variant="primary"
                                icon={<FontAwesomeIcon icon={faSquareDashedCirclePlus} />}
                                onClick={() => setAddUserModalOpen(true)}
                                fullWidth
                                disabled={!canAssignToEngagement}
                            >
                                Add to an Engagement
                            </Button>
                        </Grid>
                    )}
                    <Grid size={12}>
                        <Tooltip
                            describeChild
                            followCursor
                            title={isAdminUser ? 'Administrators cannot be deactivated.' : ''}
                        >
                            {/* wrap the button so the tooltip applies when the button is disabled */}
                            <div>
                                <UserStatusButton />
                            </div>
                        </Tooltip>
                    </Grid>
                    {isSuperAdmin && (
                        <Grid size={12}>
                            <Tooltip
                                describeChild
                                followCursor
                                title={canDeleteUser ? '' : 'User must be deactivated first'}
                            >
                                {/* wrap the button so the tooltip applies when the button is disabled */}
                                <div>
                                    <Button
                                        variant="secondary"
                                        color="danger"
                                        icon={<FontAwesomeIcon icon={faTrashCan} />}
                                        onClick={handleDeleteUser}
                                        fullWidth
                                        loading={isDeletingUser}
                                        disabled={!canDeleteUser}
                                    >
                                        Delete User
                                    </Button>
                                </div>
                            </Tooltip>
                        </Grid>
                    )}
                </Grid>
            </Grid>

            <Grid size={12} sx={{ mt: 3 }}>
                <AssignedEngagementsListing />
            </Grid>
        </Grid>
    );
};

export default UserDetails;
