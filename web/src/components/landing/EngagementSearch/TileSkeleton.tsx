import React from 'react';
import { Card, CardActionArea, CardContent, Grid2 as Grid, Skeleton } from '@mui/material';
import { Heading2, BodyText } from 'components/common/Typography';
import { StatusChipSkeleton } from 'components/common/Indicators/StatusChip';
import { colors } from 'styles/Theme';

export const TileSkeleton = () => {
    return (
        <Card sx={{ borderRadius: '24px', width: '320px' }}>
            <CardActionArea sx={{ cursor: 'progress' }}>
                <Skeleton height="172px" variant="rectangular" sx={{ bgcolor: colors.surface.blue[30] }} />
                <CardContent sx={{ height: '180px', p: '40px 32px' }}>
                    <Heading2
                        weight="thin"
                        component="p"
                        sx={{
                            height: '96px',
                            mb: '32px',
                            m: 0,
                            lineHeight: 'normal',
                        }}
                    >
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                    </Heading2>
                    <Grid container flexDirection="row" alignItems="center" columnSpacing={2} mt={3}>
                        <Grid size="auto">
                            <StatusChipSkeleton />
                        </Grid>
                        <Grid size="auto" container flexDirection="column">
                            <Skeleton>
                                <BodyText bold size="small">
                                    Feb 02, 2022 to
                                </BodyText>
                            </Skeleton>
                            <Skeleton>
                                <BodyText bold size="small">
                                    Feb 02, 2022
                                </BodyText>
                            </Skeleton>
                        </Grid>
                    </Grid>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};
