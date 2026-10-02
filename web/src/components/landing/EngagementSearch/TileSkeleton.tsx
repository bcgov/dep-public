import React from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Grid2 as Grid, Skeleton, Link, Stack } from '@mui/material';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import { Heading2, BodyText } from 'components/common/Typography';
import { StatusChipSkeleton } from 'components/common/Indicators/StatusChip';
import { colors } from 'styles/Theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const TileSkeleton = () => {
    return (
        <Card sx={{ borderRadius: '24px', width: '343px' }}>
            <CardActionArea sx={{ cursor: 'progress' }}>
                <CardMedia sx={{ height: '147px' }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            zIndex: 2,
                            margin: '0.75rem 1.5rem',
                        }}
                    >
                        <StatusChipSkeleton />
                    </Box>
                    <Skeleton height="147px" variant="rectangular" sx={{ bgcolor: colors.surface.blue[30] }} />
                </CardMedia>
                <CardContent
                    sx={{
                        height: '300px',
                        p: 3,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <Grid container spacing={3} flexDirection="column">
                        <Grid size={12} container>
                            <BodyText size="small" sx={{ lineHeight: 1, textWrap: 'nowrap' }}>
                                <Skeleton width="160px" />
                            </BodyText>
                        </Grid>
                        <Heading2 weight="thin" component="p" sx={{ fontSize: '22px', m: 0, lineHeight: 'normal' }}>
                            {/* non-cryptographically secure random() for UI purposes only */}
                            <Skeleton height="30px" width={Math.floor(/*NOSONAR*/ Math.random() * 120) + 170} />
                            <Skeleton height="30px" width={Math.floor(/*NOSONAR*/ Math.random() * 120) + 100} />
                        </Heading2>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" maxHeight="64px" overflow="clip">
                            {/* Between 0 and 4 tags of varying width */}
                            {Array.from({ length: Math.floor(/*NOSONAR*/ Math.random() * 5) }).map((_, index) => (
                                <Skeleton
                                    key={index} // NOSONAR: intentional use of static key for UI skeletons
                                    variant="rectangular"
                                    sx={{
                                        borderRadius: '4px',
                                        width: Math.floor(/*NOSONAR*/ Math.random() * 80) + 40,
                                        height: '28px',
                                    }}
                                />
                            ))}
                        </Stack>
                    </Grid>
                    <Grid container>
                        <Link component="p" sx={{ color: 'gray.50' }} display="flex" gap="8px" alignItems="center">
                            <Skeleton width="120px" height="22px" />
                            <FontAwesomeIcon fontSize="16px" icon={faArrowRight} />
                        </Link>
                    </Grid>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};
