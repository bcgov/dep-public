import React from 'react';

import { Grid2 as Grid } from '@mui/material';
import { ResponsiveContainer } from 'components/common/Layout';
import { Heading1, Heading2, BodyText } from 'components/common/Typography/';
import { TenantForm } from './TenantForm';
import { createTenant } from 'services/tenantService';
import { SubmitHandler } from 'react-hook-form';
import { Tenant } from 'models/tenant';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useNavigate, useRevalidator } from 'react-router';
import { ROUTES, getPath } from 'routes/routes';
// Prevents page load fail due to waiting for engagement title on refresh
const AutoBreadcrumbs = React.lazy(() =>
    import('components/common/Navigation/Breadcrumb').then((m) => ({ default: m.AutoBreadcrumbs })),
);

const TenantCreationPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const revalidator = useRevalidator();

    const onSubmit: SubmitHandler<Tenant> = async (data) => {
        try {
            await createTenant(data);
            dispatch(openNotification({ text: 'Tenant created successfully!', severity: 'success' }));
            revalidator.revalidate();
            navigate(getPath(ROUTES.TENANT_ADMIN));
        } catch (error) {
            dispatch(openNotification({ text: 'Unknown error while creating tenant', severity: 'error' }));
            console.error(error);
        }
    };

    const onCancel = () => {
        navigate(getPath(ROUTES.TENANT_ADMIN));
    };

    return (
        <ResponsiveContainer>
            <AutoBreadcrumbs />
            <Grid size={12}>
                <Heading1>Create Tenant Instance</Heading1>
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
            <TenantForm onSubmit={onSubmit} submitText="Create Instance" onCancel={onCancel} />
        </ResponsiveContainer>
    );
};

export default TenantCreationPage;
