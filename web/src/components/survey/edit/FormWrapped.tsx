import React, { Suspense } from 'react';
import { Grid2 as Grid, Paper } from '@mui/material';
import { Banner } from 'components/banner/Banner';
import { EditForm } from './EditForm';
import { InvalidTokenModal } from '../submit/InvalidTokenModal';
import { When } from 'react-if';
import EngagementInfoSection from 'components/publicDashboard/EngagementInfoSection';
import { Await, useAsyncValue, useNavigate } from 'react-router';
import { EmailVerification } from 'models/emailVerification';
import { Engagement } from 'models/engagement';
import { SurveySubmission } from 'models/surveySubmission';
import { getPath, ROUTES } from 'routes/routes';
import { AppConfig } from 'config';

const FormWrapped = () => {
    const navigate = useNavigate();
    const [verification, slug, engagement, submission] = useAsyncValue() as [
        EmailVerification | null,
        { slug: string },
        Engagement,
        SurveySubmission,
    ];
    const isTokenValid = !!verification;
    const language = sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId;
    const engagementPath = getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
        slug: slug.slug,
        language: language,
    });

    return (
        <Grid container direction="row" justifyContent="flex-start" alignItems="flex-start">
            <Grid size={12}>
                <Banner imageUrl={engagement.banner_url}>
                    <EngagementInfoSection savedEngagement={engagement} />
                </Banner>
            </Grid>
            <Grid
                container
                size={12}
                direction="row"
                justifyContent={'flex-start'}
                alignItems="flex-start"
                m={{ lg: '0 8em 1em 3em', md: '2em', xs: '1em' }}
            >
                <When condition={isTokenValid && !!submission}>
                    <Grid size={12}>
                        <Paper elevation={2}>
                            <EditForm
                                handleClose={() => {
                                    navigate(engagementPath);
                                }}
                            />
                        </Paper>
                    </Grid>
                </When>

                <Suspense>
                    <Await resolve={Promise.allSettled([verification, slug])}>
                        <InvalidTokenModal />
                    </Await>
                </Suspense>
            </Grid>
        </Grid>
    );
};

export default FormWrapped;
