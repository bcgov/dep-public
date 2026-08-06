import React from 'react';
import { MidScreenLoader } from 'components/common';
import { Grid2 as Grid } from '@mui/material';
import WidgetsBlock from './EngagementWidgets';
import { useRouteLoaderData } from 'react-router';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';

const EngagementFormWrapper = () => {
    const savedEngagement = React.use(
        (useRouteLoaderData('single-engagement') as EngagementLoaderAdminData)?.engagement,
    );

    if (!savedEngagement?.id) {
        return <MidScreenLoader data-testid="loader" />;
    }

    return (
        <Grid size={{ xs: 12, lg: 4 }}>
            <WidgetsBlock />
        </Grid>
    );
};

export default EngagementFormWrapper;
