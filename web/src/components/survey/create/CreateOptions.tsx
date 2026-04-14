import React, { useContext, useState } from 'react';
import { TextField, Stack, FormControl, FormControlLabel, Switch, Autocomplete, Box } from '@mui/material';
import { CreateSurveyContext } from './CreateSurveyContext';
import { useNavigate } from 'react-router';
import { postSurvey } from 'services/surveyService';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { Disclaimer } from './Disclaimer';
import { FORMIO_FORM, FORMIO_WIZARD } from './constants';
import { Engagement } from 'models/engagement';
import { BodyText } from 'components/common/Typography';
import { Button, PrimaryButton } from 'components/common/Input/Button';
import { ROUTES, getPath } from 'routes/routes';

export const CreateOptions = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { surveyForm, handleSurveyFormChange, isDisclaimerChecked, setDisclaimerError, availableEngagements } =
        useContext(CreateSurveyContext);
    const initialFormError = {
        name: false,
        engagement_id: false,
    };
    const [multiPageSurvey, setMultiPageSurvey] = useState<boolean>(true);
    const [formError, setFormError] = useState(initialFormError);
    const [isSaving, setIsSaving] = useState(false);
    const getErrorMessage = () => {
        if (surveyForm.name.length > 50) {
            return 'Name must not exceed 50 characters';
        } else if (formError.name && !surveyForm.name) {
            return 'Name must be specified';
        }
        return '';
    };

    const surveyNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newForm = { ...surveyForm, name: e.target.value };
        handleSurveyFormChange(newForm);
    };

    const surveyEngagementChange = (engagement: Engagement) => {
        const newForm = { ...surveyForm, engagement_id: engagement.id };
        handleSurveyFormChange(newForm);
    };

    const validate = (newForm = surveyForm) => {
        setFormError({
            name: newForm.name.length === 0 || newForm.name.length > 50,
            engagement_id: newForm.engagement_id === -1,
        });
        return Object.values(formError).some((errorExists) => errorExists);
    };

    const handleSaveClick = async () => {
        if (validate()) {
            return;
        }

        if (!isDisclaimerChecked) {
            setDisclaimerError(true);
            return;
        }

        try {
            setIsSaving(true);
            const createdSurvey = await postSurvey({
                name: surveyForm.name,
                engagement_id: surveyForm.engagement_id?.toString(),
                display: multiPageSurvey ? FORMIO_WIZARD : FORMIO_FORM,
            });

            dispatch(
                openNotification({
                    severity: 'success',
                    text: 'Survey created, please proceed to building it',
                }),
            );
            navigate(getPath(ROUTES.SURVEY_BUILD, { surveyId: createdSurvey.id }));
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while attempting to save survey',
                }),
            );
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>
            <FormControl style={{ gap: '0.5rem' }}>
                <BodyText bold sx={{ marginBottom: '2px', display: 'flex' }}>
                    Select Engagement
                </BodyText>
                <Autocomplete<Engagement, false, true, false>
                    disableClearable
                    id="survey-engagement"
                    options={availableEngagements || []}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            name="engagement_id"
                            error={!!formError.engagement_id}
                            helperText={formError.engagement_id ? 'Engagement must be specified' : ''}
                            slotProps={{
                                inputLabel: {
                                    shrink: false,
                                },
                            }}
                            fullWidth
                        />
                    )}
                    size="small"
                    getOptionLabel={(engagement: Engagement) => engagement.name}
                    onChange={(_, v) => {
                        if (v) {
                            surveyEngagementChange(v);
                        }
                    }}
                />
            </FormControl>
            <FormControl style={{ gap: '0.5rem' }}>
                <BodyText bold>Enter Survey Name</BodyText>
                <TextField
                    id="survey-name"
                    size="small"
                    variant="outlined"
                    label=" "
                    slotProps={{
                        inputLabel: {
                            shrink: false,
                        },
                    }}
                    fullWidth
                    name="name"
                    value={surveyForm.name}
                    onChange={surveyNameChange}
                    error={formError.name}
                    helperText={getErrorMessage()}
                />
            </FormControl>
            <FormControl style={{ gap: '0.5rem' }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={multiPageSurvey}
                            onChange={(e) => {
                                setMultiPageSurvey(!multiPageSurvey);
                            }}
                        />
                    }
                    label="Multi-page"
                />
                <BodyText>
                    The multi-page option will enable you to add one, or many pages to a survey. It will also create a
                    progress bar. If you want to create a 1-page survey, turn off the multi-page toggle.
                </BodyText>
            </FormControl>
            <Disclaimer />
            <Stack direction="row" spacing={2}>
                <PrimaryButton onClick={handleSaveClick} loading={isSaving}>
                    {'Save & Continue'}
                </PrimaryButton>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Cancel
                </Button>
            </Stack>
        </Box>
    );
};
