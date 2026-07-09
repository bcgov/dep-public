import { EngagementDisplayStatus } from 'constants/engagementStatus';
import { initialTenantState } from 'reduxSlices/tenantSlice';
import { LandingData, SortOrder } from './types';

export const defaultLandingStatuses = [
    EngagementDisplayStatus.Open,
    EngagementDisplayStatus.Upcoming,
    EngagementDisplayStatus.Closed,
];

export const validSortOrders = ['asc', 'desc'];

export const defaultLandingData: LandingData = {
    tenant: initialTenantState,
    engagements: Promise.resolve({ items: [], total: 0 }),
    allMetaFilters: Promise.resolve([]),
    searchParams: new URLSearchParams(),
    setSearchParams: () => {},
    filtersOpen: false,
    setFiltersOpen: () => {},
    loadingEngagements: false,
    setLoadingEngagements: () => {},
    clearFilters: () => {},
};

export const defaultSearchFilters = {
    page: 1,
    size: 8,
    sort_key: 'engagement.created_date',
    sort_order: 'desc' as SortOrder,
    include_banner_url: true,
    meta_filters: [],
    engagement_status: [-1], // All engagements
    search_text: '',
};

export const defaultSearchParams = {
    page: String(defaultSearchFilters.page),
    size: String(defaultSearchFilters.size),
    sort_key: defaultSearchFilters.sort_key,
    sort_order: defaultSearchFilters.sort_order as SortOrder,
    include_banner_url: String(defaultSearchFilters.include_banner_url),
    meta_filters: JSON.stringify(defaultSearchFilters.meta_filters),
    engagement_status: JSON.stringify(defaultSearchFilters.engagement_status),
    search_text: defaultSearchFilters.search_text,
};
