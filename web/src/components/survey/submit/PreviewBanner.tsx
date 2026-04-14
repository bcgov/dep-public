import React from 'react';
import { Box, Grid2 as Grid, Stack } from '@mui/material';
import { useRouteLoaderData } from 'react-router';
import { useAppSelector } from 'hooks';
import { PermissionsGate } from 'components/permissionsGate';
import { USER_ROLES } from 'services/userService/constants';
import { Heading1 } from 'components/common/Typography';
import { Button } from 'components/common/Input';
import { ROUTES, getPath } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';

export const PreviewBanner = () => {
    const { survey } = useRouteLoaderData('survey');
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);

    if (!isLoggedIn || !survey) {
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
                            <Button
                                LinkComponent={RouterLinkRenderer}
                                href={getPath(ROUTES.SURVEY_BUILD, { surveyId: survey.id })}
                            >
                                Edit Survey
                            </Button>
                        </PermissionsGate>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};
