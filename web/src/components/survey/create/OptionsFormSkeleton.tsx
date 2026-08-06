import { Grid2 as Grid, Skeleton, Stack, Typography } from '@mui/material';
import { RepeatedGrid } from 'components/common';
import React from 'react';

export const OptionsFormSkeleton = () => {
    return (
        <Grid container direction="row" alignItems="flex-start" justifyContent="flex-start" spacing={2}>
            <Grid size={12}>
                <Typography variant="h3">
                    <Skeleton />
                </Typography>
            </Grid>
            <Grid
                container
                size={{ lg: 6, xs: 12 }}
                direction="row"
                justifyContent="flex-start"
                alignItems="center"
                spacing={1}
            >
                <Grid size={12}>
                    <Typography variant="h6">
                        <Skeleton />
                    </Typography>
                </Grid>
                <RepeatedGrid times={3} size={12}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={30} height={30} />
                        <Typography variant="h6" width="100%">
                            <Skeleton />
                        </Typography>
                    </Stack>
                </RepeatedGrid>
            </Grid>
        </Grid>
    );
};
