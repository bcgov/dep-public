import React, { Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import LandingSection from './LandingSection';
import { Heading2 } from 'components/common/Typography';
import { Await, useLoaderData } from 'react-router';
import { LandingLoaderData } from './landingLoader';
import { Chip, Skeleton, Stack } from '@mui/material';
import { Link } from 'components/common/Navigation';
import { getPath, ROUTES } from 'routes/routes';
import { colors } from 'styles/Theme';

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
                                        region={region.name}
                                        linkTo={`${getPath(ROUTES.PUBLIC_SEARCH)}?${new URLSearchParams({
                                            [region.searchParam]: region.name,
                                            status: 'open',
                                        })}`}
                                        count={region.count}
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

const FilterChip = ({ region, linkTo, count = 0 }: { region: string; linkTo?: string; count?: number }) => (
    <Link
        to={count > 0 && linkTo ? linkTo : undefined}
        sx={{
            borderRadius: '24px',
            '&:focus-visible': {
                background: 'gray.20',
                color: 'blue.90',
                outline: '2px solid #2E5DD7',
                outlineOffset: '5px',
            },
            '&:hover .MuiChip-root:not(.Mui-disabled)': {
                boxShadow:
                    '0 5px 6px 0 rgba(0, 0, 0, 0.20), 0 9px 12px 0 rgba(0, 0, 0, 0.14), 0 3px 16px 0 rgba(0, 0, 0, 0.12)',
            },
            '&:active .MuiChip-root:not(.Mui-disabled)': {
                boxShadow: '0 0 8px 12px rgba(0, 0, 0, 0.10) inset',
            },
        }}
    >
        <Chip
            disabled={count < 1 || linkTo === undefined}
            variant="outlined"
            label={`${region} (${count ?? 0})`}
            sx={{
                background: 'white',
                color: 'blue.90',
                border: '1px solid',
                borderColor: 'blue.90',
                height: '44px',
                padding: '0 5px',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '24px',
                fontSize: '16px',
                boxShadow:
                    '0 12px 10px 0 rgba(0, 0, 0, 0.01), 0 7px 9px 0 rgba(0, 0, 0, 0.05), 0 3px 6px 0 rgba(0, 0, 0, 0.09), 0 1px 3px 0 rgba(0, 0, 0, 0.10)',

                '&.Mui-disabled, &.Mui-disabled:hover': {
                    opacity: '1',
                    background: 'gray.10',
                    color: colors.type.regular.disabled,
                    cursor: 'not-allowed',
                    boxShadow:
                        '0 12px 10px 0 rgba(0, 0, 0, 0.01), 0 7px 9px 0 rgba(0, 0, 0, 0.05), 0 3px 6px 0 rgba(0, 0, 0, 0.09), 0 1px 3px 0 rgba(0, 0, 0, 0.10);',
                },
            }}
        />
    </Link>
);

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
