import React, { useContext } from 'react';
import { UserManagementContext } from './UserManagementContext';
import { RoleAssignmentModal } from 'components/userManagement/common/RoleAssignmentModal';

export const AssignRoleModal = () => {
    const { assignRoleModalOpen, setassignRoleModalOpen, user, loadUserListing } = useContext(UserManagementContext);
    return (
        <RoleAssignmentModal
            open={assignRoleModalOpen}
            user={user}
            onClose={() => setassignRoleModalOpen(false)}
            onSaved={loadUserListing}
        />
    );
};
