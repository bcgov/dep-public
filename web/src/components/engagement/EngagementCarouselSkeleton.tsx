import React from 'react';
import { Box, Grid2 as Grid, Skeleton } from '@mui/material';
import { Heading2 } from 'components/common/Typography';
import { TileSkeleton } from './TileSkeleton';
import { MAX_ITEMS_PER_SLIDE, useCarouselLayout } from './useCarouselLayout';

export const EngagementCarouselSkeleton = () => {
    const { setViewportRef, itemsPerSlide, tileWidth } = useCarouselLayout();
    return (
        <Box aria-hidden inert sx={{ width: '100%', minWidth: 0 }}>
            <Heading2 decorated>
                <Skeleton variant="text" width="280px" sx={{ maxWidth: '100%' }} />
            </Heading2>
            <Grid ref={setViewportRef} size={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: '1.5rem', pb: '1rem', mb: '44px' }}>
                    {Array.from({ length: itemsPerSlide }, (_, index) => (
                        <Box key={index} sx={{ width: tileWidth, flex: '0 0 auto' }}>
                            <TileSkeleton fullWidth={itemsPerSlide < MAX_ITEMS_PER_SLIDE} />
                        </Box>
                    ))}
                </Box>
            </Grid>
        </Box>
    );
};
