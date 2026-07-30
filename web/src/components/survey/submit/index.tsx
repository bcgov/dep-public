import React, { Suspense } from 'react';
import { useAppTranslation, useAppSelector } from 'hooks';
import { Grid2 as Grid, Paper, Skeleton } from '@mui/material';
import { SurveyForm } from './SurveyForm';
import { InvalidTokenModal } from './InvalidTokenModal';
import { useSurveyLoaderData } from 'components/survey/useSurveyLoaderData';
import { SurveyBanner } from 'components/survey/common/SurveyBanner';
import { Link } from 'components/common/Navigation';
import { getPath, ROUTES } from 'routes/routes';
import { faArrowLeft } from '@fortawesome/pro-regular-svg-icons';
import { LanguageState } from 'reduxSlices/languageSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Await } from 'react-router';

const SurveySubmit = () => {
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const loaderData = useSurveyLoaderData();
    const language: LanguageState = useAppSelector((state) => state.language);
    const { t: translate } = useAppTranslation();

    return (
        <Grid container direction="row" justifyContent="flex-start" alignItems="flex-start" mt={isLoggedIn ? 13.5 : 0}>
            <SurveyBanner
                loaderData={loaderData}
                eyebrowText="Survey"
                errorText="Error loading survey details."
                alignContentToPublicPageBounds
                actions={
                    <Suspense
                        fallback={
                            <Skeleton variant="text">
                                <Link>Back to Engagement</Link>
                            </Skeleton>
                        }
                    >
                        <Await resolve={loaderData.engagement}>
                            {(engagement) => (
                                <Link
                                    to={getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                                        slug: engagement?.slug || '',
                                        language: language.id,
                                    })}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '0.5em' }} />
                                    {translate('surveySubmit.backToEngagement')}
                                </Link>
                            )}
                        </Await>
                    </Suspense>
                }
            />
            <Grid
                container
                size={12}
                direction="row"
                justifyContent="center"
                alignItems="flex-start"
                m={{ md: '0 2em', xs: '1em' }}
                mt={0}
            >
                <Grid container size={12} direction="row" justifyContent="center" alignItems="flex-start">
                    <Paper elevation={2} sx={{ maxWidth: '1120px' }}>
                        <Suspense>
                            <SurveyForm />
                        </Suspense>
                        <Suspense>
                            <InvalidTokenModal />
                        </Suspense>
                    </Paper>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default SurveySubmit;
