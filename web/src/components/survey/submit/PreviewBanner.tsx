import React, { Suspense } from 'react';
import { Box, Grid2 as Grid, Stack } from '@mui/material';
import { PermissionsGate } from 'components/permissionsGate';
import { USER_ROLES } from 'services/userService/constants';
import { Heading1 } from 'components/common/Typography';
import { Button } from 'components/common/Input';
import { ROUTES, getPath, useIsManagementRoute } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { useSurveyLoaderData } from '../useSurveyLoaderData';
import { Await } from 'react-router';

export const PreviewBanner = () => {
    const surveyLoaderData = useSurveyLoaderData();
    const isManagementPath = useIsManagementRoute();

    if (!isManagementPath) {
        // Only show the "preview" banner if we are an admin user previewing the survey on the management side.
        return null;
    }

    return (
        <Box sx={{ backgroundColor: 'secondary.light' }}>
            <Grid container direction="row" justifyContent="flex-end" alignItems="flex-start" padding={4}>
                <Grid size={12}>
                    <Heading1 sx={{ mb: 2 }}>Preview Survey</Heading1>
                </Grid>
                <Grid sx={{ pt: 2 }} size={12} container direction="row">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width="100%" justifyContent="flex-start">
                        <PermissionsGate scopes={[USER_ROLES.EDIT_ENGAGEMENT]} errorProps={{ disabled: true }}>
                            <Suspense
                                fallback={
                                    <Button loading disabled>
                                        Edit Survey
                                    </Button>
                                }
                            >
                                <Await resolve={surveyLoaderData.survey}>
                                    {(survey) => (
                                        <Button
                                            LinkComponent={RouterLinkRenderer}
                                            href={getPath(ROUTES.SURVEY_BUILD, { surveyId: survey.id })}
                                        >
                                            Edit Survey
                                        </Button>
                                    )}
                                </Await>
                            </Suspense>
                        </PermissionsGate>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};
