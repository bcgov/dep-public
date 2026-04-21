import React, { useRef, useState } from 'react';
import { Grid2 as Grid, Stack } from '@mui/material';
import FormSubmit from 'components/Form/FormSubmit';
import { FormSubmissionData } from 'components/Form/types';
import { useAppDispatch, useAppSelector, useAppTranslation } from 'hooks';
import { When } from 'react-if';
import { submitSurvey } from 'services/submissionService';
import { useNavigate } from 'react-router';
import { Button } from 'components/common/Input/Button';
import { openNotification } from 'services/notificationService/notificationSlice';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import { getPath, ROUTES } from 'routes/routes';
import { AppConfig } from 'config';
import { useSurveyLoaderData } from './useSurveyLoaderData';

export const SurveyForm = () => {
    const { t: translate } = useAppTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const language = sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId;
    const [submissionData, setSubmissionData] = useState<unknown>(null);

    const initialSet = useRef(false); // Track if the initial state has been set
    const [isValid, setIsValid] = useState(false);
    const [isChanged, setIsChanged] = useState(false);

    const { survey, verification, slug } = useSurveyLoaderData();

    const token = verification?.verification_token;

    const handleChange = (filledForm: FormSubmissionData) => {
        if (!initialSet.current) {
            initialSet.current = true;
        } else {
            setIsChanged(true);
        }
        setSubmissionData(filledForm.data);
        setIsValid(filledForm.isValid);
    };

    const navigateToEngagement = () => {
        if (slug) {
            navigate(
                getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                    slug: slug.slug,
                    language,
                }),
            );
        }
    };

    const handleSubmit = async (submissionData: unknown) => {
        try {
            await submitSurvey({
                survey_id: survey.id,
                submission_json: submissionData,
                verification_token: token ?? '',
            });

            try {
                window.snowplow('trackSelfDescribingEvent', {
                    schema: 'iglu:ca.bc.gov.dep/submit-survey/jsonschema/1-0-0',
                    data: { survey_id: survey.id, engagement_id: survey.engagement_id },
                });
            } catch (error) {
                console.log('Error while firing snowplow event for survey submission:', error);
            }
            dispatch(
                openNotification({
                    severity: 'success',
                    text: translate('surveySubmit.surveySubmitNotification.success'),
                }),
            );
            if (slug) {
                navigate(
                    getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                        slug: slug.slug,
                        language,
                    }),
                    { state: { open: true } },
                );
            }
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: translate('surveySubmit.surveySubmitNotification.submissionError'),
                }),
            );
        }
    };

    return (
        <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            spacing={1}
            padding={'2em 2em 1em 2em'}
        >
            <UnsavedWorkConfirmation blockNavigationWhen={isChanged && !isLoggedIn} />
            <Grid size={12}>
                <FormSubmit
                    savedForm={survey.form_json}
                    handleFormChange={handleChange}
                    handleFormSubmit={handleSubmit}
                />
            </Grid>
            <When condition={survey.form_json?.display === 'form'}>
                <Grid container size={12} direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: '1em' }}>
                    <Stack
                        direction={{ md: 'column-reverse', lg: 'row' }}
                        spacing={1}
                        width="100%"
                        justifyContent="flex-end"
                    >
                        <Button onClick={() => navigateToEngagement()}>
                            {translate('surveySubmit.surveyForm.button.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!isValid || isLoggedIn}
                            onClick={() => handleSubmit(submissionData)}
                        >
                            {translate('surveySubmit.surveyForm.button.submit')}
                        </Button>
                    </Stack>
                </Grid>
            </When>
        </Grid>
    );
};
