import { Grid2 as Grid, Skeleton, Stack, Typography } from '@mui/material';
import { BodyText } from 'components/common/Typography';
import { RepeatedGrid } from 'components/common';
import React from 'react';

export const CommentReviewSkeleton = () => {
    return (
        <Grid
            padding="3em"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            rowSpacing={2}
            columnSpacing={4}
        >
            <RepeatedGrid times={6} size={5}>
                <BodyText bold width="100%">
                    <Skeleton />
                </BodyText>
            </RepeatedGrid>
            <Grid container direction="row" size={5}>
                <BodyText bold width="100%">
                    <Skeleton />
                </BodyText>
            </Grid>

            <Grid container direction="row" size={12}>
                <Skeleton width="100%" height="6em" />
            </Grid>

            <Grid container size={12} direction="row">
                <Grid size={4}>
                    <Typography variant="h6">
                        <Skeleton />
                    </Typography>
                </Grid>
            </Grid>
            <RepeatedGrid container times={2} size={12}>
                <Grid size={4}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={30} height={30} />
                        <Typography variant="h6" width="100%">
                            <Skeleton />
                        </Typography>
                    </Stack>
                </Grid>
            </RepeatedGrid>
        </Grid>
    );
};
