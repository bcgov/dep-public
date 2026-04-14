import React, { useContext, useState } from 'react';
import { Grid2 as Grid, TextField, Stack, Autocomplete, FormControl } from '@mui/material';
import { CreateSurveyContext } from './CreateSurveyContext';
import { useNavigate } from 'react-router';
import { cloneSurvey } from 'services/surveyService';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { Survey } from 'models/survey';
import { Engagement } from 'models/engagement';
import { Disclaimer } from './Disclaimer';
import { BodyText } from 'components/common/Typography';
import { Button, PrimaryButton } from 'components/common/Input/Button';
import { ROUTES, getPath } from 'routes/routes';

export type EngagementParams = {
    engagementId: string;
};

const CloneOptions = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isSaving, setIsSaving] = useState(false);
    const {
        surveyForm,
        handleSurveyFormChange,
        availableSurveys,
        availableEngagements,
        isDisclaimerChecked,
        setDisclaimerError,
    } = useContext(CreateSurveyContext);
    const initialFormError = {
        name: false,
        engagement_id: false,
        survey_id: false,
    };
    const [formError, setFormError] = useState(initialFormError);

    const surveyNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newForm = { ...surveyForm, name: e.target.value };
        handleSurveyFormChange(newForm);
    };

    const surveyEngagementChange = (engagement: Engagement | null) => {
        if (engagement) {
            const newForm = { ...surveyForm, engagement_id: engagement.id };
            handleSurveyFormChange(newForm);
        }
    };

    const surveyCloneChange = (survey: Survey | null) => {
        if (survey) {
            const newForm = { ...surveyForm, survey_id: survey.id };
            handleSurveyFormChange(newForm);
        }
    };

    const validate = (newForm = surveyForm) => {
        setFormError({
            name: newForm.name.length === 0 || newForm.name.length > 50,
            engagement_id: newForm.engagement_id === -1,
            survey_id: newForm.survey_id === -1,
        });
        return Object.values(formError).some((errorExists) => errorExists);
    };

    const getErrorMessage = () => {
        if (surveyForm.name.length > 50) {
            return 'Name must not exceed 50 characters';
        } else if (formError.name && !surveyForm.name) {
            return 'Name must be specified';
        }
        return '';
    };

    const handleSave = async () => {
        if (!surveyForm.survey_id) {
            dispatch(openNotification({ severity: 'error', text: 'Please select a survey first' }));
            return;
        }
        if (validate()) {
            return;
        }

        if (!isDisclaimerChecked) {
            setDisclaimerError(true);
            return;
        }

        setIsSaving(true);
        try {
            const createdSurvey = await cloneSurvey({
                name: surveyForm.name,
                engagement_id: String(surveyForm.engagement_id),
                survey_id: surveyForm.survey_id,
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
        <Grid sx={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>
            <FormControl sx={{ gap: '0.5rem' }}>
                <BodyText bold mb="2px">
                    Select Survey to Clone
                </BodyText>
                <Autocomplete
                    disableClearable
                    id="survey-selector"
                    options={availableSurveys || []}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label=" "
                            error={!!formError.survey_id}
                            helperText={formError.survey_id ? 'Survey must be specified' : ''}
                            slotProps={{
                                inputLabel: {
                                    shrink: false,
                                },
                            }}
                            fullWidth
                        />
                    )}
                    size="small"
                    getOptionLabel={(survey: Survey) => survey.name}
                    onChange={(_e: React.SyntheticEvent<Element, Event>, survey: Survey | null) =>
                        surveyCloneChange(survey)
                    }
                />
            </FormControl>
            <FormControl sx={{ gap: '0.5rem' }}>
                <BodyText bold sx={{ marginBottom: '2px', display: 'flex' }}>
                    Select Engagement
                </BodyText>

                <Autocomplete
                    disableClearable
                    id="engagement-selector"
                    options={availableEngagements || []}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label=" "
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
                    onChange={(_e: React.SyntheticEvent<Element, Event>, engagement: Engagement | null) => {
                        surveyEngagementChange(engagement);
                    }}
                />
            </FormControl>
            <FormControl sx={{ gap: '0.5rem' }}>
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
            <FormControl>
                <Disclaimer />
            </FormControl>
            <Stack direction="row" sx={{ mt: '1rem' }} spacing={2}>
                <PrimaryButton onClick={handleSave} loading={isSaving}>
                    {'Save & Continue'}
                </PrimaryButton>
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Cancel
                </Button>
            </Stack>
        </Grid>
    );
};

export default CloneOptions;
