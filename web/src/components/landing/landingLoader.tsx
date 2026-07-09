import { getEngagements } from 'services/engagementService';
import { defaultLandingStatuses, defaultSearchFilters, validSortOrders } from './constants';
import { getMetadataFilters } from 'services/engagementMetadataService';
import { LandingLoaderData, SortOrder } from './types';
import { LoaderFunctionArgs } from 'react-router';
import { tryParse } from 'engagements/admin/create/authoring/utils';
import { EngagementStatus } from 'constants/engagementStatus';

const landingLoader = ({ request }: LoaderFunctionArgs): LandingLoaderData => {
    // Retrieve params
    const url = new URL(request.url);
    const searchParams = url?.searchParams;
    const searchText = searchParams.get('search_text');
    const page = searchParams.get('page');
    const metaFilters = searchParams.get('meta_filters') as string;
    const engagementStatus = searchParams.get('engagement_status') as string;
    const sortKey = searchParams.get('sort_key');
    const sortOrder = searchParams.get('sort_order') as SortOrder;

    // Request data
    const metaFiltersPromise = getMetadataFilters();
    const engagementsPromise = getEngagements({
        search_text: searchText ?? defaultSearchFilters.search_text,
        page: Number(page ?? defaultSearchFilters.page),
        metadata: metaFilters && tryParse(metaFilters) ? JSON.parse(metaFilters) : defaultSearchFilters.meta_filters,
        engagement_status: translateEngagementStatus(engagementStatus),
        sort_key: sortKey ?? defaultSearchFilters.sort_key,
        sort_order: (sortOrder && validSortOrders.includes(sortOrder)
            ? sortOrder
            : defaultSearchFilters.sort_order) as SortOrder,
        size: defaultSearchFilters.size,
        include_banner_url: defaultSearchFilters.include_banner_url,
    });

    console.log({
        search_text: searchText ?? defaultSearchFilters.search_text,
        page: Number(page ?? defaultSearchFilters.page),
        metadata: metaFilters && tryParse(metaFilters) ? JSON.parse(metaFilters) : defaultSearchFilters.meta_filters,
        engagement_status: translateEngagementStatus(engagementStatus),
        sort_key: sortKey ?? defaultSearchFilters.sort_key,
        sort_order: (sortOrder && validSortOrders.includes(sortOrder)
            ? sortOrder
            : defaultSearchFilters.sort_order) as SortOrder,
        size: defaultSearchFilters.size,
        include_banner_url: defaultSearchFilters.include_banner_url,
    });

    return { engagements: engagementsPromise, allMetaFilters: metaFiltersPromise };
};

const translateEngagementStatus = (es: string): EngagementStatus[] => {
    if (es && tryParse(es)) {
        const parsed = JSON.parse(es);
        console.log(parsed);
        if (Object.keys(defaultLandingStatuses) === Object.keys(parsed) || parsed?.includes(-1)) {
            return [];
        }
        return parsed;
    }
    return [];
};

export default landingLoader;
