import React, { JSX, ReactNode, useContext, useMemo, useState } from 'react';
import { Chip, Grid2 as Grid, Link, Paper, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from 'hooks';
import { UserDetailsContext } from './UserDetailsContext';
import { formatDate } from 'components/common/dateHelper';
import AssignedEngagementsListing from './AssignedEngagementsListing';
import UserStatusButton from './UserStatusButton';
import { USER_COMPOSITE_ROLE, USER_STATUS } from 'models/user';
import { Button } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faSquareDashedCirclePlus, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';
import { Heading2, Heading3 } from 'components/common/Typography';
import { deleteUser } from 'services/userService/api';
import { openNotification } from 'services/notificationService/notificationSlice';
import { USER_ROLES } from 'services/userService/constants';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import { RoleAssignmentModal } from 'components/userManagement/common/RoleAssignmentModal';
import { ROUTES, getPath } from 'routes/routes';

export const UserDetail = ({ label, value }: { label: string; value: JSX.Element }) => {
    return (
        <Grid container spacing={1} alignItems="center" minHeight={40}>
            <Grid size="auto">
                <BodyText bold>{label}:</BodyText>
            </Grid>
            <Grid size="auto">
                <BodyText>{value}</BodyText>
            </Grid>
        </Grid>
    );
};

const ReadOnlyField = ({ label, value }: { label: string; value: ReactNode }) => {
    return (
        <Grid
            container
            size={12}
            spacing={2}
            alignItems="center"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
        >
            <Grid size={{ xs: 12, sm: 4 }}>
                <BodyText bold>{label}</BodyText>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
                <BodyText>{value}</BodyText>
            </Grid>
        </Grid>
    );
};

const EditableField = ({ label, value, controls }: { label: string; value: ReactNode; controls: ReactNode }) => {
    return (
        <Grid
            container
            size={12}
            spacing={2}
            alignItems="center"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: '#F8F8F8' }}
        >
            <Grid size={{ xs: 12, md: 'grow' }}>
                <Grid container direction="column" spacing={1}>
                    <Grid size={12}>
                        <BodyText bold>{label}</BodyText>
                    </Grid>
                    <Grid size={12}>
                        <BodyText component="div">{value}</BodyText>
                    </Grid>
                </Grid>
            </Grid>
            <Grid size={{ xs: 12, md: 'auto' }}>{controls}</Grid>
        </Grid>
    );
};

export const UserDetails = () => {
    const { savedUser, setAddUserModalOpen, getUserDetails } = useContext(UserDetailsContext);
    const { userDetail, roles } = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

    const isSelf = savedUser?.id === userDetail?.user?.id;
    const isSuperAdmin = roles.includes(USER_ROLES.SUPER_ADMIN);
    const isInactive = savedUser?.status_id === USER_STATUS.INACTIVE.value;
    const canAssignToEngagement = !isInactive && !isSelf;
    const canReassignRole = roles.includes(USER_ROLES.UPDATE_USER_GROUP);
    const isAdminUser = savedUser?.main_role === USER_COMPOSITE_ROLE.ADMIN.label;

    const { canEditRole, canEditRoleMessage } = useMemo(() => {
        if (!savedUser) return { canEditRole: false, canEditRoleMessage: '' };
        if (isSelf) return { canEditRole: false, canEditRoleMessage: 'You cannot change your own role.' };
        if (isInactive)
            return { canEditRole: false, canEditRoleMessage: 'You cannot change the role of an inactive user.' };
        if (!canReassignRole)
            return { canEditRole: false, canEditRoleMessage: "You do not have permission to change this user's role." };
        if (isAdminUser && !isSuperAdmin)
            return { canEditRole: false, canEditRoleMessage: 'You may not demote an Administrator.' };

        return { canEditRole: true, canEditRoleMessage: '' };
    }, [savedUser, isSelf, isInactive, isAdminUser, isSuperAdmin, canReassignRole]);

    const canDeleteUser = savedUser?.status_id === USER_STATUS.INACTIVE.value && !isSelf;
    const currentStatusLabel =
        savedUser?.status_id === USER_STATUS.ACTIVE.value ? USER_STATUS.ACTIVE.label : USER_STATUS.INACTIVE.label;

    const openRoleModal = () => {
        if (!savedUser) return;
        if (!canEditRole)
            return dispatch(openNotification({ severity: 'error', text: 'You need permission to change this role.' }));
        setRoleModalOpen(true);
    };

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
                            navigate(getPath(ROUTES.USER_MANAGEMENT));
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
            <Grid container size={12} p={3} component={Paper}>
                <Grid container size={12} spacing={2} mb={2} alignItems="center">
                    <Grid size={12}>
                        <Heading2 decorated mb={0}>{`${savedUser?.last_name}, ${savedUser?.first_name}`}</Heading2>
                    </Grid>
                </Grid>
                <Grid container size={{ xs: 12, lg: 6 }} direction="column" spacing={3}>
                    <Grid size={12}>
                        <Heading3 bold mb={0.5}>
                            Account Details
                        </Heading3>
                    </Grid>

                    <Grid container size={12} direction="column">
                        <ReadOnlyField
                            label="Email"
                            value={<Link href={`mailto:${savedUser?.email_address}`}>{savedUser?.email_address}</Link>}
                        />
                        <ReadOnlyField
                            label="Date Added"
                            value={savedUser ? formatDate(savedUser?.created_date) : ''}
                        />
                    </Grid>
                </Grid>
                <Grid container size={{ xs: 12, lg: 6 }} direction="column" spacing={3}>
                    <Grid size={12}>
                        <Heading3 bold mb={0.5}>
                            Access Controls
                        </Heading3>
                    </Grid>

                    <Grid container size={12} direction="column" spacing={2}>
                        <EditableField
                            label="Role"
                            value={
                                <Chip
                                    label={savedUser?.main_role || 'Unassigned'}
                                    size="small"
                                    color={savedUser?.main_role ? 'primary' : 'default'}
                                    variant={savedUser?.main_role ? 'filled' : 'outlined'}
                                />
                            }
                            controls={
                                <Tooltip describeChild placement="bottom" arrow title={canEditRoleMessage}>
                                    {/* wrap the button so the tooltip applies when the button is disabled */}
                                    <div>
                                        <Button
                                            variant="secondary"
                                            onClick={openRoleModal}
                                            icon={<FontAwesomeIcon icon={faPenToSquare} />}
                                            disabled={!canEditRole || isSelf}
                                            fullWidth
                                        >
                                            {savedUser?.main_role ? 'Reassign Role' : 'Assign Role'}
                                        </Button>
                                    </div>
                                </Tooltip>
                            }
                        />

                        <EditableField
                            label="Status"
                            value={
                                <Chip
                                    label={currentStatusLabel}
                                    size="small"
                                    color={savedUser?.status_id === USER_STATUS.ACTIVE.value ? 'success' : 'warning'}
                                    variant="filled"
                                />
                            }
                            controls={
                                <Grid container direction="column" spacing={1}>
                                    <Grid size={12}>
                                        <Tooltip
                                            describeChild
                                            placement="bottom"
                                            arrow
                                            title={isAdminUser ? 'Administrators cannot be deactivated.' : ''}
                                        >
                                            {/* wrap the button so the tooltip applies when the button is disabled */}
                                            <div>
                                                <UserStatusButton size={isSuperAdmin ? 'small' : 'medium'} />
                                            </div>
                                        </Tooltip>
                                    </Grid>

                                    {isSuperAdmin && (
                                        <Grid size={12}>
                                            <Tooltip
                                                describeChild
                                                placement="bottom"
                                                arrow
                                                title={canDeleteUser ? '' : 'User must be deactivated first'}
                                            >
                                                {/* wrap the button so the tooltip applies when the button is disabled */}
                                                <div>
                                                    <Button
                                                        size="small"
                                                        variant="secondary"
                                                        color="danger"
                                                        icon={<FontAwesomeIcon icon={faTrashCan} />}
                                                        onClick={handleDeleteUser}
                                                        loading={isDeletingUser}
                                                        disabled={!canDeleteUser}
                                                        fullWidth
                                                    >
                                                        Delete User
                                                    </Button>
                                                </div>
                                            </Tooltip>
                                        </Grid>
                                    )}
                                </Grid>
                            }
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid container size={12} alignItems="center" justifyContent="space-between" sx={{ mt: 3 }}>
                <Grid size="auto">
                    <Heading3 bold mb={0}>
                        Assigned Engagements
                    </Heading3>
                </Grid>
                {savedUser?.main_role !== USER_COMPOSITE_ROLE.ADMIN.label && (
                    <Grid size={{ xs: 12, sm: 'auto' }}>
                        <Button
                            variant="primary"
                            icon={<FontAwesomeIcon icon={faSquareDashedCirclePlus} />}
                            onClick={() => setAddUserModalOpen(true)}
                            disabled={!canAssignToEngagement}
                        >
                            Add to an Engagement
                        </Button>
                    </Grid>
                )}
            </Grid>

            <Grid size={12}>
                <AssignedEngagementsListing />
            </Grid>

            <RoleAssignmentModal
                open={roleModalOpen}
                user={savedUser}
                onClose={() => setRoleModalOpen(false)}
                onSaved={getUserDetails}
            />
        </Grid>
    );
};

export default UserDetails;
