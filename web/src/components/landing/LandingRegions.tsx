import React, { Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import LandingSection from './LandingSection';
import { Heading2 } from 'components/common/Typography';
import { Await, useLoaderData } from 'react-router';
import { LandingLoaderData } from './landingLoader';
import { Skeleton, Stack } from '@mui/material';
import { Link } from 'components/common/Navigation';
import { getPath, ROUTES } from 'routes/routes';
import { FilterChip } from './FilterChip';
import { useAppTranslation } from 'hooks';

export const LandingRegions = () => {
    const { t: translate } = useAppTranslation();
    const loaderData = useLoaderData() as LandingLoaderData;
    return (
        <Suspense fallback={<RegionsSkeleton />}>
            <Await resolve={loaderData.regions} errorElement={<RegionsSkeleton />}>
                {({ items: regions, hasOpenEngagements }) => {
                    if (!regions.length) return null;
                    return (
                        <LandingSection>
                            <Heading2 decorated>
                                {translate(
                                    hasOpenEngagements
                                        ? 'landing.regionSection.titleOpen'
                                        : 'landing.regionSection.title',
                                )}
                            </Heading2>
                            <Stack direction="row" gap={2} flexWrap="wrap" mb={3}>
                                {regions.map((region) => (
                                    <FilterChip
                                        key={region.name}
                                        label={`${region.name} (${region.count})`}
                                        linkTo={`${getPath(ROUTES.PUBLIC_SEARCH)}?${new URLSearchParams({
                                            [region.searchParam]: region.name,
                                            ...(hasOpenEngagements ? { status: 'open' } : {}),
                                        })}`}
                                        disabled={!region.count}
                                    />
                                ))}
                            </Stack>
                            <Link size="large" to={getPath(ROUTES.PUBLIC_SEARCH)}>
                                {translate('landing.regionSection.viewAll')}
                                <FontAwesomeIcon icon={faArrowRight} style={{ marginInlineStart: '8px' }} />
                            </Link>
                        </LandingSection>
                    );
                }}
            </Await>
        </Suspense>
    );
};

const RegionsSkeleton = () => (
    <LandingSection>
        <Heading2 decorated>
            <Skeleton variant="text" width="300px" />
        </Heading2>
        <Stack direction="row" gap={2} flexWrap="wrap" mb={3}>
            {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton
                    key={index}
                    sx={{ borderRadius: '24px' }}
                    variant="rounded"
                    width={Math.random() * 100 + 100}
                    height="44px"
                />
            ))}
        </Stack>
        <Link size="large" to={getPath(ROUTES.PUBLIC_SEARCH)}>
            <Skeleton variant="text" width="120px" />
        </Link>
    </LandingSection>
);

export default LandingRegions;
