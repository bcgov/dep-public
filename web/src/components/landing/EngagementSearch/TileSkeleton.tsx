import React from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Grid2 as Grid, Skeleton, Link, Stack } from '@mui/material';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import { Heading2, BodyText } from 'components/common/Typography';
import { StatusChipSkeleton } from 'components/common/Indicators/StatusChip';
import { colors } from 'styles/Theme';
import { ResponsiveStyleValue } from '@mui/system';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { mapOrientation } from './EngagementTile';

export const TileSkeleton = ({
    orientation = 'vertical',
}: {
    orientation?: ResponsiveStyleValue<'horizontal' | 'vertical'>;
}) => {
    const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min; //NOSONAR: non-cryptographically secure random() for UI purposes only

    const cardWidth = mapOrientation(orientation, '704px', '343px');
    const mediaHeight = mapOrientation(orientation, '289px', '147px');
    const mediaWidth = mapOrientation(orientation, '230px', '343px');
    const contentHeight = mapOrientation(orientation, '289px', '300px');
    return (
        <Card
            sx={{
                borderRadius: '24px',
                width: cardWidth,
                '& button': {
                    display: 'flex',
                    flexDirection: mapOrientation(orientation, 'row', 'column'),
                    justifyContent: 'flex-start',
                },
            }}
        >
            <CardActionArea sx={{ cursor: 'progress' }}>
                <CardMedia sx={{ height: mediaHeight }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            zIndex: 2,
                            margin: '0.75rem 1.5rem',
                        }}
                    >
                        <StatusChipSkeleton />
                    </Box>
                    <Skeleton
                        variant="rectangular"
                        sx={{ bgcolor: colors.surface.blue[30], height: mediaHeight, width: mediaWidth }}
                    />
                </CardMedia>
                <CardContent
                    sx={{
                        height: contentHeight,
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
                            <Skeleton height="30px" width={randomBetween(170, 290)} />
                            <Skeleton height="30px" width={randomBetween(100, 220)} />
                        </Heading2>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" maxHeight="64px" overflow="clip">
                            {/* Between 0 and 4 tags of varying width */}
                            {Array.from({ length: randomBetween(0, 4) }).map((_, index) => (
                                <Skeleton
                                    key={index} // NOSONAR: intentional use of static key for UI skeletons
                                    variant="rectangular"
                                    sx={{
                                        borderRadius: '4px',
                                        width: randomBetween(40, 120),
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
