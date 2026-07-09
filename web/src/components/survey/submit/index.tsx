import React, { Suspense } from 'react';
import { Grid2 as Grid, Paper } from '@mui/material';
import { SurveyBanner } from './SurveyBanner';
import { SurveyForm } from './SurveyForm';
import { InvalidTokenModal } from './InvalidTokenModal';
import { PreviewBanner } from './PreviewBanner';
import { Link } from 'components/common/Navigation';
import { getPath, ROUTES, useIsManagementRoute } from 'routes/routes';
import { faArrowLeftLong } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SurveySubmit = () => {
    return (
        <Grid container direction="row" justifyContent="flex-start" alignItems="flex-start">
            <Grid size={12}>
                <PreviewBanner />
            </Grid>
            <Grid size={12}>
                <SurveyBanner />
            </Grid>
            <Grid
                container
                size={12}
                direction="row"
                justifyContent={'flex-start'}
                alignItems="flex-start"
                m={{ lg: '2em 8em 1em 3em', md: '2em', xs: '1em' }}
            >
                <Grid container size={12} direction="row" justifyContent="flex-end">
                    {useIsManagementRoute() && (
                        <Link to={getPath(ROUTES.SURVEYS)}>
                            <FontAwesomeIcon icon={faArrowLeftLong} /> Back to Surveys
                        </Link>
                    )}
                </Grid>
                <Grid size={12}>
                    <Paper elevation={2}>
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
