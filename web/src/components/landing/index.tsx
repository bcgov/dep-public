import React, { useEffect, useState } from 'react';
import { MetadataFilter } from 'components/metadataManagement/types';
import { SearchFilters } from './types';
import { defaultLandingStatuses, defaultSearchFilters, defaultSearchParams } from './constants';
import { useLoaderData, useSearchParams } from 'react-router';
import { ThemeProvider } from '@mui/material';
import FilterDrawer from './FilterDrawer';
import { DarkTheme } from 'styles/Theme';
import { LandingHero } from './LandingHero';
import { TenantState } from 'reduxSlices/tenantSlice';
import { useAppSelector } from 'hooks';
import { Engagement } from 'models/engagement';
import { Page } from 'services/type';
import LandingIntro from './LandingIntro';
import EngagementSearch from './EngagementSearch';

export const Landing = () => {
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [totalEngagements, setTotalEngagements] = useState(0);
    const [metadataFilters, setMetadataFilters] = useState<MetadataFilter[]>([]);
    const [searchFilters, setSearchFilters] = useState<SearchFilters>(defaultSearchFilters);
    const [loadingEngagements, setLoadingEngagements] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [, setSearchParams] = useSearchParams(); // Pass filter updates to loader via search params
    const loaderData = useLoaderData();

    const tenant: TenantState = useAppSelector((state) => state.tenant);

    useEffect(() => {
        loaderData.engagements.then((engagements: Page<Engagement>) => {
            if (engagements?.items && engagements.items.length > 0) {
                setEngagements(engagements.items);
                setTotalEngagements(engagements.total);
            }
            setLoadingEngagements(false);
        });
    }, [loaderData.engagements]);

    useEffect(() => {
        loaderData.filters.then((filters: MetadataFilter[]) => {
            if (filters && filters.length > 0) {
                setMetadataFilters(filters);
            }
        });
    }, [loaderData.filters]);

    useEffect(() => {
        updateSearchParams(searchFilters);
    }, [searchFilters]);

    const updateSearchParams = (newFilters: SearchFilters) => {
        // New Filter State > Existing Filter State > Default Value
        const newSearchParams = new URLSearchParams({
            engagement_status: JSON.stringify(
                newFilters.engagement_status ?? searchFilters.engagement_status ?? defaultLandingStatuses,
            ),
            page: String(newFilters.page ?? searchFilters.page ?? defaultSearchParams.page),
            sort_key: newFilters.sort_key ?? searchFilters.sort_key ?? defaultSearchParams.sort_key,
            sort_order: newFilters.sort_order ?? searchFilters.sort_order ?? defaultSearchParams.sort_order,
            metadata: JSON.stringify(newFilters.metadata ?? searchFilters.metadata ?? defaultSearchParams.metadata),
            search_text: newFilters.search_text ?? searchFilters.search_text ?? defaultSearchParams.search_text,
            include_banner_url: defaultSearchParams.include_banner_url,
            size: defaultSearchParams.size,
        });
        setSearchParams(newSearchParams);
    };

    const clearFilters = () => {
        setMetadataFilters([]);
        setSearchFilters(defaultSearchFilters);
    };

    // Define the props for the subcomponents in an orderly way

    const filterProps = {
        searchFilters,
        setSearchFilters,
        metadataFilters,
        clearFilters,
        filtersOpen,
        setFiltersOpen,
    };

    const engSearchProps = {
        ...filterProps,
        engagements,
        loadingEngagements,
        totalEngagements,
        searchFilters,
        setSearchFilters,
    };

    return (
        <>
            <ThemeProvider theme={DarkTheme}>
                <FilterDrawer {...filterProps} />
            </ThemeProvider>
            <LandingHero tenant={tenant} />
            <LandingIntro />
            <EngagementSearch {...engSearchProps} />
        </>
    );
};

export default Landing;
