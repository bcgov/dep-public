import React, { useContext } from 'react';
import { UserManagementContext } from './UserManagementContext';
import { RoleAssignmentModal } from 'components/userManagement/common/RoleAssignmentModal';

export const ReassignRoleModal = () => {
    const { reassignRoleModalOpen, setReassignRoleModalOpen, user, loadUserListing } =
        useContext(UserManagementContext);

    return (
        <RoleAssignmentModal
            open={reassignRoleModalOpen}
            user={user}
            onClose={() => setReassignRoleModalOpen(false)}
            onSaved={loadUserListing}
        />
    );
};
