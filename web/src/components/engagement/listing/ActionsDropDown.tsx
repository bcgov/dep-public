import React, { useMemo, useState } from 'react';
import { USER_ROLES } from 'services/userService/constants';
import { MenuItem, Modal, Select } from '@mui/material';
import { Engagement } from 'models/engagement';
import { useNavigate, useRevalidator } from 'react-router';
import { useAppDispatch, useAppSelector } from 'hooks';
import { SubmissionStatus, EngagementStatus } from 'constants/engagementStatus';
import { openNotification } from 'services/notificationService/notificationSlice';
import ConfirmModal from 'components/common/Modals/ConfirmModal';
import { deleteEngagement } from 'services/engagementService';

interface ActionDropDownItem {
    value: number;
    label: string;
    action?: () => void;
    condition?: boolean;
}
export const ActionsDropDown = ({ engagement }: { engagement: Engagement }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const revalidator = useRevalidator();
    const [deleteEngagementModalOpen, setDeleteEngagementModalOpen] = useState(false);
    const { roles, assignedEngagements } = useAppSelector((state) => state.user);
    const submissionHasBeenOpened = [SubmissionStatus.Open, SubmissionStatus.Closed].includes(
        engagement.submission_status,
    );
    const isDraft = engagement.engagement_status.id === EngagementStatus.Draft;
    const isOpen = engagement.submission_status === SubmissionStatus.Open;
    const isClosed = engagement.submission_status === SubmissionStatus.Closed;
    const isUpcoming =
        engagement.engagement_status.id === EngagementStatus.Published &&
        engagement.submission_status === SubmissionStatus.Upcoming;
    const isScheduled = engagement.engagement_status.id === EngagementStatus.Scheduled;

    const canEditEngagement = (): boolean => {
        const authorized = roles.includes(USER_ROLES.EDIT_ENGAGEMENT) || assignedEngagements.includes(engagement.id);

        if (!authorized) {
            return false;
        }

        if (isDraft) {
            const canEditDraftEngagement = roles.includes(USER_ROLES.EDIT_DRAFT_ENGAGEMENT);
            return canEditDraftEngagement;
        }
        if (isOpen) {
            const canEditOpenEngagement = roles.includes(USER_ROLES.EDIT_OPEN_ENGAGEMENT);
            return canEditOpenEngagement;
        }
        if (isClosed) {
            const canEditClosedEngagement = roles.includes(USER_ROLES.EDIT_CLOSED_ENGAGEMENT);
            return canEditClosedEngagement;
        }
        if (isScheduled) {
            const canEditScheduledEngagement = roles.includes(USER_ROLES.EDIT_SCHEDULED_ENGAGEMENT);
            return canEditScheduledEngagement;
        }
        if (isUpcoming) {
            const canEditUpcomingEngagement = roles.includes(USER_ROLES.EDIT_UPCOMING_ENGAGEMENT);
            return canEditUpcomingEngagement;
        }
        return true;
    };

    const canViewSurvey = (): boolean => {
        if (engagement.engagement_status.id !== EngagementStatus.Draft) {
            return true;
        }

        if (engagement.surveys.length === 0) {
            return false;
        }

        return roles.includes(USER_ROLES.VIEW_ALL_SURVEYS) || assignedEngagements.includes(engagement.id);
    };

    const removeEngagement = async () => {
        setDeleteEngagementModalOpen(true);
    };

    const confirmRemoveEngagement = async () => {
        setDeleteEngagementModalOpen(false);
        const status = engagement.status_id || engagement.engagement_status?.id || 0;
        try {
            if (status === EngagementStatus.Published) {
                throw new Error('Cannot delete an engagement that is currently published');
            }
            await deleteEngagement(engagement.id);
            dispatch(openNotification({ text: 'The engagement was successfully deleted', severity: 'success' }));
            revalidator.revalidate();
        } catch (error) {
            dispatch(openNotification({ text: String(error), severity: 'error' }));
        }
    };

    const ITEMS: ActionDropDownItem[] = useMemo(
        () => [
            {
                value: 1,
                label: 'Edit Engagement',
                action: () => {
                    navigate(`/engagements/${engagement.id}/form`);
                },
                condition: canEditEngagement(),
            },
            {
                value: 2,
                label: 'View Survey',
                action: () => {
                    navigate(`/surveys/${engagement.surveys[0].id}/submit`);
                },
                condition: canViewSurvey(),
            },
            {
                value: 3,
                label: 'View Report - Public',
                action: () => {
                    navigate(`/engagements/${engagement.id}/dashboard/public`);
                },
                condition:
                    submissionHasBeenOpened &&
                    (roles.includes(USER_ROLES.ACCESS_DASHBOARD) || assignedEngagements.includes(engagement.id)),
            },
            {
                value: 4,
                label: 'View Report - Internal',
                action: () => {
                    navigate(`/engagements/${engagement.id}/dashboard/internal`);
                },
                condition:
                    submissionHasBeenOpened &&
                    roles.includes(USER_ROLES.VIEW_ALL_SURVEY_RESULTS) &&
                    (roles.includes(USER_ROLES.ACCESS_DASHBOARD) || assignedEngagements.includes(engagement.id)),
            },
            {
                value: 5,
                label: 'View All Comments',
                action: () => {
                    navigate(`/surveys/${engagement.surveys[0].id}/comments`);
                },
                condition:
                    submissionHasBeenOpened &&
                    (roles.includes(USER_ROLES.REVIEW_COMMENTS) ||
                        roles.includes(USER_ROLES.VIEW_APPROVED_COMMENTS) ||
                        assignedEngagements.includes(engagement.id)),
            },
            {
                value: 7,
                label: 'Delete Engagement',
                action: () => {
                    removeEngagement();
                },
                condition:
                    roles.includes(USER_ROLES.SUPER_ADMIN) ||
                    (roles.includes(USER_ROLES.UNPUBLISH_ENGAGEMENT) && assignedEngagements.includes(engagement.id)),
            },
        ],
        [engagement.id],
    );

    return (
        <>
            {/* prevent user from accidentally deleting a survey */}
            <Modal open={deleteEngagementModalOpen} aria-describedby="delete-engagement-modal-subtext">
                <ConfirmModal
                    style="danger"
                    header={`Are you sure you want to delete ${engagement.name || 'this engagement'}?`}
                    subHeader="This action cannot be undone."
                    subTextId="delete-engagement-modal-subtext"
                    subText={[
                        {
                            text: 'You will not be able to delete an engagement if it is published or you are in the production environment.',
                            bold: false,
                        },
                    ]}
                    handleConfirm={confirmRemoveEngagement}
                    handleClose={() => setDeleteEngagementModalOpen(false)}
                    confirmButtonText={'Delete Engagement'}
                    cancelButtonText={'Cancel & Go Back'}
                />
            </Modal>

            <Select
                id={`action-drop-down-${engagement.id}`}
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
        </>
    );
};
