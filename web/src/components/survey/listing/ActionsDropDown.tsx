import React, { useMemo } from 'react';
import { USER_ROLES } from 'services/userService/constants';
import { MenuItem, Modal, Select } from '@mui/material';
import { useNavigate } from 'react-router';
import { useAppSelector } from 'hooks';
import { SubmissionStatus, EngagementStatus } from 'constants/engagementStatus';
import { Survey } from 'models/survey';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useDispatch } from 'react-redux';
import { deleteSurvey } from 'services/surveyService';
import ConfirmModal from 'components/common/Modals/ConfirmModal';
import { getEngagement } from 'services/engagementService';
import { ROUTES, getPath } from 'routes/routes';

interface ActionDropDownItem {
    value: number;
    label: string;
    action?: () => void;
    condition?: boolean;
}
export const ActionsDropDown = ({ survey, loadSurveys }: { survey: Survey; loadSurveys: () => void }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { roles, assignedEngagements } = useAppSelector((state) => state.user);
    const [deleteSurveyModalOpen, setDeleteSurveyModalOpen] = React.useState(false);
    const engagement = survey.engagement;
    const engagementId = engagement?.id ?? 0;
    const submissionHasBeenOpened =
        !!engagement && [SubmissionStatus.Open, SubmissionStatus.Closed].includes(engagement.submission_status);
    const submissionIsClosed = !!engagement && [SubmissionStatus.Closed].includes(engagement.submission_status);
    const isEngagementDraft = !!engagement && engagement.engagement_status.id === EngagementStatus.Draft;

    const canEditSurvey = (): boolean => {
        if (submissionIsClosed) {
            return false;
        }

        if (roles.includes(USER_ROLES.EDIT_ALL_SURVEYS)) {
            return true;
        }

        if (
            isEngagementDraft &&
            assignedEngagements.includes(engagementId) &&
            roles.includes(USER_ROLES.VIEW_ENGAGEMENT)
        ) {
            return true;
        }

        return false;
    };

    const canViewReport = (): boolean => {
        return (
            submissionHasBeenOpened &&
            (roles.includes(USER_ROLES.ACCESS_DASHBOARD) || assignedEngagements.includes(engagementId))
        );
    };

    const canViewInternalReport = (): boolean => {
        return (
            submissionHasBeenOpened &&
            roles.includes(USER_ROLES.VIEW_ALL_SURVEY_RESULTS) &&
            (roles.includes(USER_ROLES.ACCESS_DASHBOARD) || assignedEngagements.includes(engagementId))
        );
    };

    const canViewAllComments = (): boolean => {
        return (
            submissionHasBeenOpened &&
            (roles.includes(USER_ROLES.REVIEW_COMMENTS) ||
                roles.includes(USER_ROLES.VIEW_APPROVED_COMMENTS) ||
                assignedEngagements.includes(engagementId))
        );
    };

    const removeSurvey = async () => {
        setDeleteSurveyModalOpen(true);
    };

    const confirmRemoveSurvey = async () => {
        setDeleteSurveyModalOpen(false);
        try {
            if (survey.engagement_id) {
                const engagement = await getEngagement(survey.engagement_id);
                if (engagement?.status_id === EngagementStatus.Published) {
                    throw new Error('Cannot delete a survey that is linked to a published engagement');
                }
            }
            await deleteSurvey(survey.id);
            dispatch(openNotification({ text: 'The survey was successfully deleted', severity: 'success' }));
            loadSurveys();
        } catch (error) {
            dispatch(openNotification({ text: String(error), severity: 'error' }));
        }
    };

    const ITEMS: ActionDropDownItem[] = useMemo(
        () => [
            {
                value: 1,
                label: 'Edit Survey',
                action: () => {
                    navigate(getPath(ROUTES.SURVEY_BUILD, { surveyId: survey.id }));
                },
                condition: canEditSurvey(),
            },
            {
                value: 2,
                label: 'View Report - Public',
                action: () => {
                    navigate(getPath(ROUTES.ENGAGEMENT_DASHBOARD, { engagementId, dashboardType: 'public' }));
                },
                condition: canViewReport(),
            },
            {
                value: 3,
                label: 'View Report - Internal',
                action: () => {
                    navigate(
                        getPath(ROUTES.ENGAGEMENT_DASHBOARD, {
                            engagementId,
                            dashboardType: 'internal',
                        }),
                    );
                },
                condition: canViewInternalReport(),
            },
            {
                value: 4,
                label: 'View All Comments',
                action: () => {
                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: survey.id }));
                },
                condition: canViewAllComments(),
            },
            {
                value: 5,
                label: 'Edit Settings',
                action: () => {
                    navigate(getPath(ROUTES.SURVEY_REPORT, { surveyId: survey.id }));
                },
                condition: canEditSurvey(),
            },
            {
                value: 6,
                label: 'Delete Survey',
                action: () => {
                    removeSurvey();
                },
                condition: roles.includes(USER_ROLES.SUPER_ADMIN) || roles.includes(USER_ROLES.EDIT_ALL_SURVEYS),
            },
        ],
        [engagementId],
    );

    return (
        <>
            {/* prevent user from accidentally deleting a survey */}
            <Modal open={deleteSurveyModalOpen} aria-describedby="delete-survey-modal-subtext">
                <ConfirmModal
                    style="danger"
                    header={`Are you sure you want to delete ${survey.name || 'this survey'}?`}
                    subHeader="This action cannot be undone."
                    subTextId="delete-survey-modal-subtext"
                    subText={[
                        {
                            text: 'You will not be able to delete a survey that is being used for a public engagement.',
                            bold: false,
                        },
                    ]}
                    handleConfirm={confirmRemoveSurvey}
                    handleClose={() => setDeleteSurveyModalOpen(false)}
                    confirmButtonText={'Delete Survey'}
                    cancelButtonText={'Cancel & Go Back'}
                />
            </Modal>

            <Select
                id={`action-drop-down-${survey.id}`}
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
