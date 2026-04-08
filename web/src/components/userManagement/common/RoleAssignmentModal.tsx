import React, { useEffect, useMemo, useState } from 'react';
import { Grid2 as Grid, MenuItem, Modal, Paper, Select } from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { BodyText, Heading3 } from 'components/common/Typography';
import { modalStyle } from 'components/common';
import { useAppDispatch, useAppSelector } from 'hooks';
import { USER_COMPOSITE_ROLE, User } from 'models/user';
import { addUserToRole, changeUserRole } from 'services/userService/api';
import { openNotification } from 'services/notificationService/notificationSlice';
import { USER_ROLES } from 'services/userService/constants';

const roleOptions = [
    USER_COMPOSITE_ROLE.ADMIN,
    USER_COMPOSITE_ROLE.VIEWER,
    USER_COMPOSITE_ROLE.TEAM_MEMBER,
    USER_COMPOSITE_ROLE.REVIEWER,
];

interface RoleAssignmentModalProps {
    open: boolean;
    user?: User;
    onClose: () => void;
    onSaved?: () => Promise<void> | void;
}

export const RoleAssignmentModal = ({ open, user, onClose, onSaved }: RoleAssignmentModalProps) => {
    const dispatch = useAppDispatch();
    const { roles } = useAppSelector((state) => state.user);
    const [selectedRole, setSelectedRole] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isSuperAdmin = roles.includes(USER_ROLES.SUPER_ADMIN);
    const isAdminUser = user?.main_role === USER_COMPOSITE_ROLE.ADMIN.label;
    const isReassignment = Boolean(user?.main_role);

    const initialRoleValue = useMemo(
        () => roleOptions.find((role) => role.label === user?.main_role)?.value || '',
        [user?.main_role],
    );

    useEffect(() => {
        if (!open) {
            setSelectedRole('');
            return;
        }

        setSelectedRole(initialRoleValue);
    }, [initialRoleValue, open]);

    const handleClose = () => {
        if (isSaving) {
            return;
        }

        setSelectedRole('');
        onClose();
    };

    const handleSave = async () => {
        if (!user || !selectedRole) {
            return;
        }

        if (isAdminUser && !isSuperAdmin) {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Only Super Admins can reassign an Administrator to a lower role.',
                }),
            );
            return;
        }

        try {
            setIsSaving(true);

            if (user.main_role) {
                await changeUserRole({
                    user_id: user.id,
                    role: selectedRole,
                });
            } else {
                await addUserToRole({
                    user_id: user.external_id,
                    role: selectedRole,
                });
            }

            await onSaved?.();
            handleClose();

            const selectedRoleLabel = roleOptions.find((role) => role.value === selectedRole)?.label || selectedRole;
            dispatch(
                openNotification({
                    severity: 'success',
                    text: isReassignment
                        ? `You have reassigned ${user.first_name} ${user.last_name} as ${selectedRoleLabel}.`
                        : `You have successfully added ${user.first_name} ${user.last_name} to the role ${selectedRoleLabel}.`,
                }),
            );
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'Failed to update user role.' }));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose} keepMounted={false}>
            <Paper sx={{ ...modalStyle }}>
                <Grid container spacing={2}>
                    <Grid size={12}>
                        <Heading3 bold>{isReassignment ? 'Reassign Role' : 'Assign Role'}</Heading3>
                    </Grid>
                    <Grid size={12}>
                        <BodyText>
                            Choose a role for {user?.first_name} {user?.last_name}.
                        </BodyText>
                    </Grid>
                    <Grid size={12}>
                        <Select
                            fullWidth
                            value={selectedRole}
                            onChange={(event) => setSelectedRole(event.target.value)}
                        >
                            {roleOptions.map((roleOption) => (
                                <MenuItem
                                    key={roleOption.value}
                                    value={roleOption.value}
                                    disabled={
                                        roleOption.value === USER_COMPOSITE_ROLE.ADMIN.value &&
                                        !roles.includes(USER_ROLES.SUPER_ADMIN)
                                    }
                                >
                                    {roleOption.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid container size={12} justifyContent="flex-end" spacing={1}>
                        <Grid size="auto">
                            <Button onClick={handleClose} disabled={isSaving}>
                                Cancel
                            </Button>
                        </Grid>
                        <Grid size="auto">
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                loading={isSaving}
                                disabled={!selectedRole || selectedRole === initialRoleValue}
                            >
                                Save
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Modal>
    );
};
