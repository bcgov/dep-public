import React, { createContext, useEffect, useMemo, useState } from 'react';
import { LandingData } from './types';
import { defaultLandingData, defaultSearchFilters } from './constants';
import { useLoaderData, useRevalidator, useSearchParams } from 'react-router';
import { ThemeProvider } from '@mui/material';
import FilterDrawer from './FilterDrawer';
import { DarkTheme } from 'styles/Theme';
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
    const revalidator = useRevalidator();

    useEffect(() => {
        revalidator.revalidate();
    }, [searchParams]);

    const clearFilters = () => {
        const newSearchParams = updateSearchParams(defaultSearchFilters, new URLSearchParams());
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
            <ThemeProvider theme={DarkTheme}>
                <FilterDrawer />
            </ThemeProvider>
            <LandingHero />
            <LandingIntro />
            <EngagementSearch />
        </LandingDataContext.Provider>
    );
};

export default Landing;
