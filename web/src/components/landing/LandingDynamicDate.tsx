import { Heading2 } from 'components/common/Typography/Headings';
import React, { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router';
import LandingSection from './LandingSection';
import { useAppTranslation } from 'hooks';
import EngagementCarousel, { EngagementCarouselPage } from 'components/engagement/EngagementCarousel';
import { EngagementCarouselSkeleton } from 'components/engagement/EngagementCarouselSkeleton';
import { LandingLoaderData } from './landingLoader';

export const LandingDate = ({ variant = 'new' }: { variant?: 'closingSoon' | 'new' }) => {
    const { t: translate } = useAppTranslation();
    const loaderData = useLoaderData() as LandingLoaderData;
    const engagements = variant === 'new' ? loaderData.newEngagements : loaderData.closingSoonEngagements;
    return (
        <Suspense
            fallback={
                <LandingSection>
                    <EngagementCarouselSkeleton />
                </LandingSection>
            }
        >
            <Await resolve={engagements}>
                {(page: EngagementCarouselPage) =>
                    page.engagements.length ? (
                        <LandingSection>
                            <EngagementCarousel
                                heading={
                                    <Heading2 decorated mt={4}>
                                        {translate(`landing.dynamicDateSection.${variant}`)}
                                    </Heading2>
                                }
                                ariaLabel={translate(`landing.dynamicDateSection.${variant}Aria`).replace(
                                    '{0}',
                                    page.engagements.length.toString(),
                                )}
                                engagements={page.engagements}
                                loadNextPage={page.loadNextPage}
                            />
                        </LandingSection>
                    ) : null
                }
            </Await>
        </Suspense>
    );
};

export const LandingDynamicDate = () => {
    /* TODO: Connect to tenant config page once implemented */
    const enabledSections = { new: true, closingSoon: true };
    return (
        <>
            {enabledSections.new && <LandingDate variant="new" />}
            {enabledSections.closingSoon && <LandingDate variant="closingSoon" />}
        </>
    );
};

export default LandingDynamicDate;
