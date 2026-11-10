import React, { Suspense } from 'react';
import { useLoaderData, Await } from 'react-router';
import { Box, Skeleton } from '@mui/material';
import { Heading2 } from 'components/common/Typography';
import EngagementCarousel from 'components/engagement/EngagementCarousel';
import { Engagement } from 'models/engagement';
import LandingSection from './LandingSection';
import { LandingLoaderData } from './landingLoader';
import { useAppTranslation } from 'hooks';

export const LandingFeatured = () => {
    const { t: translate } = useAppTranslation();
    const loaderData = useLoaderData() as LandingLoaderData;
    return (
        <Suspense fallback={<FeaturedEngagementsSkeleton />}>
            <Await resolve={loaderData.featuredEngagements}>
                {(engagements: Engagement[]) => {
                    if (!engagements?.length) {
                        return null;
                    }
                    return (
                        <LandingSection>
                            <EngagementCarousel
                                engagements={engagements}
                                ariaLabel={translate('landing.featuredCarouselLabel').replace(
                                    '{0}',
                                    engagements.length.toString(),
                                )}
                                heading={
                                    <Heading2 decorated mt={4}>
                                        {translate('landing.featuredEngagements')}
                                    </Heading2>
                                }
                            />
                        </LandingSection>
                    );
                }}
            </Await>
        </Suspense>
    );
};

const FeaturedEngagementsSkeleton = () => {
    return (
        <LandingSection>
            <Heading2 decorated mt={4}>
                <Skeleton variant="text" width="280px" />
            </Heading2>
            <Box pt={3} pb={2} mb="44px">
                <Skeleton variant="rounded" width="100%" height="492px" sx={{ borderRadius: '24px' }} />
            </Box>
        </LandingSection>
    );
};

export default LandingFeatured;
