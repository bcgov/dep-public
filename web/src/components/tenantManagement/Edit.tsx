import React, { Suspense } from 'react';

import { Grid2 as Grid } from '@mui/material';
import { ResponsiveContainer } from 'components/common/Layout';
import { Heading1, Heading2, BodyText } from 'components/common/Typography/';
import { TenantForm } from './TenantForm';
import { updateTenant } from 'services/tenantService';
import { SubmitHandler } from 'react-hook-form';
import { Tenant } from 'models/tenant';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useRouteLoaderData, useNavigate, Await, useRevalidator } from 'react-router';
import { MidScreenLoader } from 'components/common';
import { ROUTES, getPath } from 'routes/routes';
// Prevents page load fail due to waiting for engagement title on refresh
const AutoBreadcrumbs = React.lazy(() =>
    import('components/common/Navigation/Breadcrumb').then((m) => ({ default: m.AutoBreadcrumbs })),
);

const TenantEditPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const tenant = useRouteLoaderData('tenant') as Promise<Tenant>;

    return (
        <Suspense fallback={<MidScreenLoader />}>
            <Await resolve={tenant}>
                {(resolvedTenant) => {
                    const shortName = resolvedTenant?.short_name;
                    const onCancel = () => {
                        navigate(getPath(ROUTES.TENANT_ADMIN_DETAIL, { tenantShortName: shortName }));
                    };
                    const onSubmit: SubmitHandler<Tenant> = async (data) => {
                        try {
                            await updateTenant(data, shortName);
                            dispatch(openNotification({ text: 'Tenant updated successfully!', severity: 'success' }));
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
                        <ResponsiveContainer>
                            <AutoBreadcrumbs />

                            <Grid size={12}>
                                <Heading1>Edit Tenant Instance</Heading1>
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
                            <TenantForm
                                initialTenant={resolvedTenant}
                                onSubmit={onSubmit}
                                submitText="Update"
                                onCancel={onCancel}
                            />
                        </ResponsiveContainer>
                    );
                }}
            </Await>
        </Suspense>
    );
};

export default TenantEditPage;
