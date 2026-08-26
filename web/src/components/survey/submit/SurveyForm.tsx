import React, { Suspense, useRef, useState } from 'react';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import FormSubmit from 'components/Form/FormSubmit';
import { FormSubmissionData } from 'components/Form/types';
import { useAppDispatch, useAppTranslation } from 'hooks';
import { When } from 'react-if';
import { submitSurvey } from 'services/submissionService';
import { Await, useNavigate, useParams } from 'react-router';
import { Button } from 'components/common/Input/Button';
import { openNotification } from 'services/notificationService/notificationSlice';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import { getPath, ROUTES, useIsManagementRoute } from 'routes/routes';
import { AppConfig } from 'config';
import { useSurveyLoaderData } from '../useSurveyLoaderData';

export const SurveyForm = () => {
    const { t: translate } = useAppTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const params = useParams<{ token: string }>();
    const language = sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId;
    const [submissionData, setSubmissionData] = useState<object>({});

    const initialDataRef = useRef<object | null>(null);
    const [isValid, setIsValid] = useState(false);
    const [isChanged, setIsChanged] = useState(false);
    const isManagementRoute = useIsManagementRoute();
    const loaderData = useSurveyLoaderData();

    const token = params.token;

    const handleChange = (filledForm: FormSubmissionData) => {
        if (!initialDataRef.current) {
            // First call – store a *copy* of the initial data
            initialDataRef.current = { ...filledForm.data };
            setSubmissionData(filledForm.data);
            setIsValid(filledForm.isValid);
            // isChanged remains false (initial load)
            return;
        }
        const currentData = filledForm.data;
        // Stringify both objects for comparison; since we cannot use equality operators on objects directly
        const isEqual = JSON.stringify(currentData) === JSON.stringify(initialDataRef.current);
        setIsChanged(!isEqual);

        setSubmissionData(currentData);
        setIsValid(filledForm.isValid);
    };

    const navigateToEngagement = async (open: boolean = true) => {
        const engagement = await loaderData.engagement;
        if (engagement) {
            navigate(
                getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                    slug: engagement.slug,
                    language,
                }),
                { state: { open } },
            );
        } else {
            navigate(getPath(ROUTES.PUBLIC_LANDING));
        }
    };

    const handleSubmit = async (submissionData: object) => {
        if (isManagementRoute) {
            return;
        }
        const survey = await loaderData.survey;
        try {
            await submitSurvey({
                survey_id: survey.id,
                submission_json: submissionData,
                verification_token: token ?? '',
            });
            setIsChanged(false); // Clear the unsaved work flag so the prompt doesn't block us

            try {
                globalThis.snowplow('trackSelfDescribingEvent', {
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
            await navigateToEngagement();
        } catch (error) {
            console.error(error);
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
            <UnsavedWorkConfirmation blockNavigationWhen={isChanged && !isManagementRoute} />
            <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={50} />}>
                <Await resolve={loaderData.survey}>
                    {(survey) => (
                        <>
                            <Grid size={12}>
                                <FormSubmit
                                    savedForm={survey.form_json}
                                    handleFormChange={handleChange}
                                    handleFormSubmit={handleSubmit}
                                    handleFormCancel={() => navigateToEngagement(false)}
                                    verificationToken={token}
                                />
                            </Grid>

                            <When condition={survey.form_json?.display === 'form'}>
                                <Grid
                                    container
                                    size={12}
                                    direction="row"
                                    justifyContent="flex-end"
                                    spacing={1}
                                    sx={{ mt: '1em' }}
                                >
                                    <Grid
                                        container
                                        direction={{ md: 'column-reverse', lg: 'row' }}
                                        spacing={1}
                                        width="100%"
                                        justifyContent="flex-end"
                                    >
                                        <Suspense
                                            fallback={
                                                <Button disabled>
                                                    {translate('surveySubmit.surveyForm.button.cancel')}
                                                </Button>
                                            }
                                        >
                                            <Await resolve={loaderData.engagement}>
                                                {(engagement) => (
                                                    <Button
                                                        href={
                                                            isManagementRoute
                                                                ? getPath(ROUTES.SURVEYS)
                                                                : getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                                                                      slug: engagement?.slug || '',
                                                                      language,
                                                                  })
                                                        }
                                                        variant="secondary"
                                                    >
                                                        {translate('surveySubmit.surveyForm.button.cancel')}
                                                    </Button>
                                                )}
                                            </Await>
                                        </Suspense>
                                        <Button
                                            variant="primary"
                                            disabled={!isValid || isManagementRoute}
                                            onClick={() => handleSubmit(submissionData)}
                                        >
                                            {translate('surveySubmit.surveyForm.button.submit')}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </When>
                        </>
                    )}
                </Await>
            </Suspense>
        </Grid>
    );
};
