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

export const LandingRegions = () => {
    const loaderData = useLoaderData() as LandingLoaderData;
    return (
        <Suspense fallback={<RegionsSkeleton />}>
            <Await resolve={loaderData.regions}>
                {(regions) => {
                    if (!regions.length) return null;
                    return (
                        <LandingSection innerStyles={{ flexDirection: 'row' }}>
                            <Heading2 decorated>Find open engagements near an area</Heading2>
                            <Stack direction="row" gap={2} flexWrap="wrap" mb={3}>
                                {regions.map((region) => (
                                    <FilterChip
                                        key={region.name}
                                        label={`${region.name} (${region.count})`}
                                        linkTo={`${getPath(ROUTES.PUBLIC_SEARCH)}?${new URLSearchParams({
                                            [region.searchParam]: region.name,
                                            status: 'open',
                                        })}`}
                                        disabled={!region.count}
                                    />
                                ))}
                            </Stack>
                            <Link width="auto" to={getPath(ROUTES.PUBLIC_SEARCH)}>
                                View all of B.C.
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
    </LandingSection>
);

export default LandingRegions;
