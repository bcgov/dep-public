import React, { Suspense } from 'react';

import { Grid2 as Grid, Skeleton } from '@mui/material';
import { Heading1, Heading2, BodyText } from 'components/common/Typography/';
import { TenantForm } from './TenantForm';
import { updateTenant } from 'services/tenantService';
import { SubmitHandler } from 'react-hook-form';
import { Tenant } from 'models/tenant';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useRouteLoaderData, useNavigate, Await, useRevalidator } from 'react-router';
import { ROUTES, getPath } from 'routes/routes';

const TenantEditPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const loaderData = useRouteLoaderData('tenant');

    return (
        <Grid container>
            <Grid size={12}>
                <Heading1 mt={0}>Edit Tenant Instance</Heading1>
            </Grid>
            <Grid container spacing={0} direction="column" mb="0.5em" size={12}>
                <Grid size={12}>
                    <Heading2 decorated sx={{ mb: 0 }}>
                        Tenant Details
                    </Heading2>
                </Grid>
                <Grid size={12}>
                    <BodyText size="small">* Required fields</BodyText>
                </Grid>
            </Grid>
            <Suspense
                fallback={<Skeleton data-testid="loading-skeleton" variant="rectangular" width="100%" height={400} />}
            >
                <Await resolve={loaderData.tenant}>
                    {(resolvedTenant) => {
                        const shortName = resolvedTenant?.short_name;
                        const onCancel = () => {
                            navigate(getPath(ROUTES.TENANT_ADMIN_DETAIL, { tenantShortName: shortName }));
                        };
                        const onSubmit: SubmitHandler<Tenant> = async (data) => {
                            try {
                                await updateTenant(data, shortName);
                                dispatch(
                                    openNotification({ text: 'Tenant updated successfully!', severity: 'success' }),
                                );
                                revalidator.revalidate();
                                navigate(getPath(ROUTES.TENANT_ADMIN_DETAIL, { tenantShortName: shortName }));
                            } catch (error) {
                                dispatch(
                                    openNotification({ text: 'Unknown error while saving tenant', severity: 'error' }),
                                );
                                console.error(error);
                            }
                        };
                        return (
                            <TenantForm
                                initialTenant={resolvedTenant}
                                onSubmit={onSubmit}
                                submitText="Update"
                                onCancel={onCancel}
                            />
                        );
                    }}
                </Await>
            </Suspense>
        </Grid>
    );
};

export default TenantEditPage;
