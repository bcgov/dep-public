import React from 'react';
import { Grid2 as Grid, Paper, Skeleton } from '@mui/material';

export const UserDetailsSkeleton = () => {
    return (
        <Grid container spacing={3} size={12} mt={2}>
            <Grid container size={12} p={3} component={Paper}>
                <Grid container size={12} spacing={2} mb={2} alignItems="center">
                    <Grid size={12}>
                        <Skeleton variant="text" width={320} height={56} />
                    </Grid>
                </Grid>

                <Grid container size={{ xs: 12, lg: 6 }} direction="column" spacing={3}>
                    <Grid size={12}>
                        <Skeleton variant="text" width={220} height={40} />
                    </Grid>

                    <Grid container size={12} direction="column">
                        <Grid
                            container
                            size={12}
                            spacing={2}
                            alignItems="center"
                            sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                        >
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Skeleton variant="text" width={96} height={28} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <Skeleton variant="text" width="100%" height={28} />
                            </Grid>
                        </Grid>

                        <Grid
                            container
                            size={12}
                            spacing={2}
                            alignItems="center"
                            sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                        >
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Skeleton variant="text" width={96} height={28} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <Skeleton variant="text" width={160} height={28} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid container size={{ xs: 12, lg: 6 }} direction="column" spacing={3}>
                    <Grid size={12}>
                        <Skeleton variant="text" width={220} height={40} />
                    </Grid>

                    <Grid container size={12} direction="column" spacing={2}>
                        <Grid
                            container
                            size={12}
                            spacing={2}
                            alignItems="center"
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 2,
                                bgcolor: '#F8F8F8',
                            }}
                        >
                            <Grid size={{ xs: 12, md: 'grow' }}>
                                <Skeleton variant="text" width={72} height={24} />
                                <Skeleton variant="rounded" width={140} height={24} sx={{ mt: 1 }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 'auto' }}>
                                <Skeleton variant="rounded" width={180} height={36} />
                            </Grid>
                        </Grid>

                        <Grid
                            container
                            size={12}
                            spacing={2}
                            alignItems="center"
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 2,
                                bgcolor: '#F8F8F8',
                            }}
                        >
                            <Grid size={{ xs: 12, md: 'grow' }}>
                                <Skeleton variant="text" width={72} height={24} />
                                <Skeleton variant="rounded" width={108} height={24} sx={{ mt: 1 }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 'auto' }}>
                                <Grid container direction="column" spacing={1}>
                                    <Grid size={12}>
                                        <Skeleton variant="rounded" width={180} height={36} />
                                    </Grid>
                                    <Grid size={12}>
                                        <Skeleton variant="rounded" width={180} height={36} />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Grid container size={12} alignItems="center" justifyContent="space-between" sx={{ mt: 3 }}>
                <Grid size="auto">
                    <Skeleton variant="text" width={220} height={40} />
                </Grid>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                    <Skeleton variant="rounded" width={200} height={40} />
                </Grid>
            </Grid>

            <Grid size={12}>
                <Skeleton variant="rectangular" height={480} width="100%" />
            </Grid>
        </Grid>
    );
};

export default UserDetailsSkeleton;
