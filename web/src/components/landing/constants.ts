import { EngagementDisplayStatus } from 'constants/engagementStatus';

export const defaultLandingStatuses = [
    EngagementDisplayStatus.Open,
    EngagementDisplayStatus.Upcoming,
    EngagementDisplayStatus.Closed,
];

export const validSortOrders = ['asc', 'desc'];

export const defaultSearchFilters = {
    page: 1,
    size: 8,
    sort_key: 'engagement.created_date',
    sort_order: 'desc' as 'desc' | 'asc' | undefined,
    include_banner_url: true,
    metadata: [],
    engagement_status: defaultLandingStatuses,
    search_text: '',
};

export const defaultSearchParams = {
    page: String(defaultSearchFilters.page),
    size: String(defaultSearchFilters.size),
    sort_key: defaultSearchFilters.sort_key,
    sort_order: String(defaultSearchFilters.sort_order),
    include_banner_url: String(defaultSearchFilters.include_banner_url),
    metadata: JSON.stringify(defaultSearchFilters.metadata),
    engagement_status: defaultLandingStatuses.toString(),
    search_text: defaultSearchFilters.search_text,
};
