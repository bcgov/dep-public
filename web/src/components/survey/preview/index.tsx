import React, { Suspense } from 'react';
import { useParams } from 'react-router';
import { Grid2 as Grid, Paper, Skeleton } from '@mui/material';
import { ROUTES, getPath } from 'routes/routes';
import { useSurveyLoaderData } from 'components/survey/useSurveyLoaderData';
import { SurveyForm } from 'components/survey/submit/SurveyForm';
import { PermissionsGate } from 'components/permissionsGate';
import { USER_ROLES } from 'services/userService/constants';
import { Button } from 'components/common/Input';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { ResponsiveContainer } from 'components/common/Layout';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faPen } from '@fortawesome/pro-regular-svg-icons';
import { SurveyBanner } from 'components/survey/common/SurveyBanner';

const SurveyPreview = () => {
    const loaderData = useSurveyLoaderData();
    const surveyId = useParams<{ surveyId: string }>().surveyId ?? 0;

    return (
        <ResponsiveContainer direction="row" justifyContent="flex-start" alignItems="flex-start">
            <Grid size={12} mb={1}>
                <AutoBreadcrumbs />
            </Grid>
            <Grid container size={12} maxWidth="1120px">
                <SurveyBanner
                    loaderData={loaderData}
                    eyebrowText="Survey Preview"
                    errorText="Error loading survey preview data."
                    showUnlinkedFallback
                    actions={
                        <>
                            <PermissionsGate scopes={[USER_ROLES.EDIT_ENGAGEMENT]} errorProps={{ disabled: true }}>
                                <Button
                                    icon={<FontAwesomeIcon icon={faPen} />}
                                    LinkComponent={RouterLinkRenderer}
                                    variant="primary"
                                    disabled={!surveyId}
                                    href={getPath(ROUTES.SURVEY_BUILD, { surveyId })}
                                >
                                    Edit Survey
                                </Button>
                            </PermissionsGate>
                            <Button
                                icon={<FontAwesomeIcon icon={faCog} />}
                                href={getPath(ROUTES.SURVEY_REPORT, { surveyId })}
                                LinkComponent={RouterLinkRenderer}
                                disabled={!surveyId}
                            >
                                Survey Report Settings
                            </Button>
                        </>
                    }
                />
                <Grid size={12}>
                    <Paper elevation={2}>
                        <Suspense fallback={<SurveyFormSkeleton />}>
                            <SurveyForm />
                        </Suspense>
                    </Paper>
                </Grid>
            </Grid>
        </ResponsiveContainer>
    );
};

const SurveyFormSkeleton = () => {
    return (
        <Grid size={12}>
            {/* Skeleton for the survey form */}
            <Skeleton variant="rectangular" height={600} sx={{ borderRadius: '4px' }} />
        </Grid>
    );
};

export default SurveyPreview;
