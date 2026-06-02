import { Grid2 as Grid } from '@mui/material';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import React, { useDeferredValue, useEffect, useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import { StatusLabel } from './StatusLabel';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';
import { Engagement } from 'models/engagement';

export const AuthoringHeader = () => {
    const loaderData = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData | undefined;
    const deferredEngagement = useDeferredValue(loaderData?.engagement);

    const [currentEngagement, setCurrentEngagement] = useState<Engagement | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!deferredEngagement) return;

        Promise.resolve(deferredEngagement).then((resolvedEngagement) => {
            if (!cancelled) {
                setCurrentEngagement(resolvedEngagement);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [deferredEngagement]);

    return (
        <Grid container>
            <AutoBreadcrumbs />
            <Grid mt="2rem" size={12}>
                {currentEngagement && <StatusLabel status={currentEngagement.status_id} />}
            </Grid>
        </Grid>
    );
};
