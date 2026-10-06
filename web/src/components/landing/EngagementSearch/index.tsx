import LandingSection from '../LandingSection';
import React, { createContext, useMemo, useState } from 'react';
import SearchAndFilterArea from './SearchAndFilterArea';
import ResultsArea from './ResultsArea';
import CountAndSortArea from './CountAndSortArea';
import { ThemeProvider } from '@mui/material';
import { DarkTheme } from 'styles/Theme';
import FilterDrawer from './FilterDrawer';
import { SortOrder } from '../types';
import { defaultSearchFilters } from '../constants';
import { updateSearchParams } from '../utils';
import { useRouteLoaderData, useSearchParams } from 'react-router';
import { useAppSelector } from 'hooks';
import { TenantState } from 'reduxSlices/tenantSlice';
import { MetadataFilter } from 'components/metadataManagement/types';
import { Engagement } from 'models/engagement';
import { Page } from 'services/type';

interface EngagementSearchData {
    searchParams: URLSearchParams;
    setSearchParams: (params: URLSearchParams) => void;
    filtersOpen: boolean;
    setFiltersOpen: (open: boolean) => void;
    engagements: Promise<Page<Engagement>>;
    allMetaFilters: Promise<MetadataFilter[]>;
    tenant: TenantState;
    loadingEngagements: boolean;
    setLoadingEngagements: (loading: boolean) => void;
}

const defaultSearchData = {
    searchParams: new URLSearchParams(),
    setSearchParams: () => {},
    filtersOpen: false,
    setFiltersOpen: () => {},
    engagements: Promise.resolve({ items: [], total: 0 }),
    allMetaFilters: Promise.resolve([]),
    tenant: {} as TenantState,
    loadingEngagements: false,
    setLoadingEngagements: () => {},
};

export const EngagementSearchDataContext = createContext<EngagementSearchData>(defaultSearchData);

/**
 * @deprecated This component will be replaced with the new search page
 */
const EngagementSearch = () => {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [loadingEngagements, setLoadingEngagements] = useState(false);
    const { engagements, allMetaFilters } = useRouteLoaderData('landingLoader');
    const tenant: TenantState = useAppSelector((state) => state.tenant);

    const engagementSearchData = useMemo(
        () => ({
            searchParams,
            setSearchParams,
            filtersOpen,
            setFiltersOpen,
            engagements,
            allMetaFilters,
            tenant,
            loadingEngagements,
            setLoadingEngagements,
        }),
        [searchParams, filtersOpen, engagements, allMetaFilters, tenant, loadingEngagements, setLoadingEngagements],
    );

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

    return (
        <EngagementSearchDataContext.Provider value={engagementSearchData}>
            <LandingSection>
                <ThemeProvider theme={DarkTheme}>
                    <FilterDrawer clearFilters={clearFilters} />
                </ThemeProvider>
                <SearchAndFilterArea clearFilters={clearFilters} />
                <CountAndSortArea />
                <ResultsArea />
            </LandingSection>
        </EngagementSearchDataContext.Provider>
    );
};

export default EngagementSearch;
