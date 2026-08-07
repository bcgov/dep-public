import React, { createContext, useEffect, useMemo, useState } from 'react';
import { LandingData, SortOrder } from './types';
import { defaultLandingData, defaultSearchFilters } from './constants';
import { useLoaderData, useSearchParams } from 'react-router';
import { LandingHero } from './LandingHero';
import { TenantState } from 'reduxSlices/tenantSlice';
import { useAppSelector } from 'hooks';
import LandingIntro from './LandingIntro';
import EngagementSearch from './EngagementSearch';
import { updateSearchParams } from './utils';

export const LandingDataContext = createContext<LandingData>(defaultLandingData);

export const Landing = () => {
    const [loadingEngagements, setLoadingEngagements] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const tenant: TenantState = useAppSelector((state) => state.tenant);
    const [searchParams, setSearchParams] = useSearchParams(); // Pass filter updates to loader via search params
    const { engagements, allMetaFilters } = useLoaderData();

    useEffect(() => {
        if (searchParams.size === 0) {
            // Set default filters if none are found
            clearFilters();
        }
    }, [searchParams]);

    const clearFilters = () => {
        const sortOrder = searchParams.get('sort_order') as SortOrder | undefined;
        const dsf = defaultSearchFilters;
        const newSearchParams = updateSearchParams(
            {
                // Retain search and sort, just remove filters
                ...dsf,
                search_text: searchParams.get('search_text') ?? dsf.search_text,
                sort_key: searchParams.get('sort_key') ?? dsf.sort_key,
                sort_order: sortOrder ?? dsf.sort_order,
            },
            new URLSearchParams(),
        );
        setSearchParams(newSearchParams);
    };

    const landingData = useMemo(
        () => ({
            tenant,
            engagements,
            allMetaFilters,
            searchParams,
            setSearchParams,
            filtersOpen,
            setFiltersOpen,
            loadingEngagements,
            setLoadingEngagements,
            clearFilters,
        }),
        [
            tenant,
            engagements,
            allMetaFilters,
            searchParams,
            setSearchParams,
            filtersOpen,
            loadingEngagements,
            clearFilters,
        ],
    );

    return (
        <LandingDataContext.Provider value={landingData}>
            <LandingHero />
            <LandingIntro />
            <EngagementSearch />
        </LandingDataContext.Provider>
    );
};

export default Landing;
