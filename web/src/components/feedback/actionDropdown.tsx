import React, { useMemo } from 'react';
import { MenuItem, Select } from '@mui/material';
import { Feedback, FeedbackStatusEnum } from 'models/feedback';
import { useAppDispatch } from 'hooks';
import { updateFeedback, deleteFeedback } from 'services/feedbackService';
import { openNotification } from 'services/notificationService/notificationSlice';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';

interface ActionDropDownItem {
    value: number;
    label: string;
    action?: () => void;
    condition?: boolean;
}
export const ActionsDropDown = ({ feedback, reload }: { feedback: Feedback; reload: () => void }) => {
    const dispatch = useAppDispatch();
    const isArchived = feedback.status == FeedbackStatusEnum.Archived;
    const canEditFeedback = (): boolean => {
        return true;
    };

    const archiveFeedback = async () => {
        try {
            await updateFeedback(feedback.id, { ...feedback, status: FeedbackStatusEnum.Archived });
            dispatch(openNotification({ severity: 'success', text: 'Feedback has been archived.' }));
            reload();
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'Error occurred while archiving feedback.' }));
        }
    };

    const removeFeedback = async () => {
        dispatch(
            openNotificationModal({
                open: true,
                data: {
                    header: 'Delete Feedback',
                    subText: [
                        { text: 'You will be permanently deleting this feedback.' },
                        { text: 'Please click the Cancel or Confirm button to continue.', bold: true },
                    ],
                    handleConfirm: async () => {
                        try {
                            await deleteFeedback(feedback.id);
                            dispatch(openNotification({ severity: 'success', text: 'Feedback has been deleted.' }));
                            reload();
                        } catch {
                            dispatch(
                                openNotification({
                                    severity: 'error',
                                    text: 'Error occurred while deleting feedback.',
                                }),
                            );
                        }
                    },
                },
                type: 'confirm',
            }),
        );
    };

    const ITEMS: ActionDropDownItem[] = useMemo(
        () => [
            {
                value: 1,
                label: 'Archive',
                action: () => {
                    archiveFeedback();
                },
                condition: canEditFeedback() && !isArchived,
            },
            {
                value: 2,
                label: 'Delete Feedback',
                action: () => {
                    removeFeedback();
                },
                condition: canEditFeedback(),
            },
        ],
        [feedback.id],
    );

    return (
        <Select id={`action-drop-down-${feedback.id}`} value={0} fullWidth size="small">
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
