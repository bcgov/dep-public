import React, { useState } from 'react';
import { cloneDeep } from 'lodash';
import { Grid2 as Grid, Stack, TextField } from '@mui/material';
import { SurveyFormProps } from '../types';
import { useAppDispatch, useAppTranslation } from 'hooks';
import { updateSubmission } from 'services/submissionService';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useAsyncValue } from 'react-router';
import { SurveySubmission } from 'models/surveySubmission';
import { EmailVerification } from 'models/emailVerification';
import { Button } from 'components/common/Input/Button';
import { BodyText } from 'components/common/Typography/Body';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';

export const EditForm = ({ handleClose }: SurveyFormProps) => {
    const { t: translate } = useAppTranslation();
    const dispatch = useAppDispatch();
    const [verification, , , initialSubmission] = useAsyncValue() as [
        EmailVerification,
        unknown,
        unknown,
        SurveySubmission,
    ];

    const [submission, setSubmission] = useState<SurveySubmission>(initialSubmission);

    const isChanged = JSON.stringify(initialSubmission) !== JSON.stringify(submission);

    const token = verification?.verification_token;

    const handleSubmit = async () => {
        try {
            if (!token) throw new Error('Token not found');
            await updateSubmission(token, {
                comments: submission?.comments ?? [],
            });

            dispatch(
                openNotification({
                    severity: 'success',
                    text: translate('surveyEdit.surveyEditNotification.success'),
                }),
            );
            handleClose();
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: translate('surveyEdit.surveyEditNotification.updateSurveyError'),
                }),
            );
        }
    };

    const handleChange = (value: string, commentIndex: number) => {
        if (!submission) {
            return;
        }

        const updatedSubmission = cloneDeep(submission);
        if (updatedSubmission.comments?.[commentIndex]) updatedSubmission.comments[commentIndex].text = value;
        setSubmission(updatedSubmission);
    };

    return (
        <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            spacing={2}
            mt={2}
            p={'0 2em 2em 2em'}
        >
            <UnsavedWorkConfirmation blockNavigationWhen={isChanged} />
            {submission.comments?.map((comment, index) => {
                return (
                    <Grid size={12} key={index}>
                        <BodyText size="small">{comment.label}</BodyText>
                        <TextField
                            defaultValue={comment.text}
                            sx={{ width: '100%' }}
                            multiline={true}
                            rows={3}
                            onChange={(e) => {
                                handleChange(e.target.value, index);
                            }}
                        />
                    </Grid>
                );
            })}
            <Grid container size={12} direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: '1em' }}>
                <Stack
                    direction={{ md: 'column-reverse', lg: 'row' }}
                    spacing={1}
                    width="100%"
                    justifyContent="flex-end"
                >
                    <Button onClick={() => handleClose()}>{translate('surveyEdit.editForm.button.cancel')}</Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            if (submission) handleSubmit();
                        }}
                    >
                        {translate('surveyEdit.editForm.button.submit')}
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    );
};
