import React, { Suspense } from 'react';
import { useLoaderData, Await } from 'react-router';
import { Heading2 } from 'components/common/Typography';
import EngagementCarousel from 'components/engagement/EngagementCarousel';
import LandingSection from './LandingSection';
import { LandingLoaderData } from './landingLoader';
import { useAppTranslation } from 'hooks';
import { EngagementCarouselSkeleton } from 'components/engagement/EngagementCarouselSkeleton';

export const LandingFeatured = () => {
    const { t: translate } = useAppTranslation();
    const loaderData = useLoaderData() as LandingLoaderData;
    return (
        <Suspense
            fallback={
                <LandingSection innerStyles={{ pt: 3 }}>
                    <EngagementCarouselSkeleton />
                </LandingSection>
            }
        >
            <Await resolve={loaderData.featuredEngagements}>
                {(page) =>
                    page.engagements.length ? (
                        <LandingSection>
                            <EngagementCarousel
                                engagements={page.engagements}
                                loadNextPage={page.loadNextPage}
                                ariaLabel={translate('landing.featuredCarouselLabel').replace(
                                    '{0}',
                                    page.engagements.length.toString(),
                                )}
                                heading={
                                    <Heading2 decorated mt={4}>
                                        {translate('landing.featuredEngagements')}
                                    </Heading2>
                                }
                            />
                        </LandingSection>
                    ) : null
                }
            </Await>
        </Suspense>
    );
};

export default LandingFeatured;
