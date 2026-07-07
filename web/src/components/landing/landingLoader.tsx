import { getEngagements } from 'services/engagementService';
import { defaultLandingStatuses, defaultSearchFilters, defaultSearchParams, validSortOrders } from './constants';
import { getMetadataFilters } from 'services/engagementMetadataService';
import { LandingLoaderData, SortOrder } from './types';
import { LoaderFunctionArgs } from 'react-router';
import { tryParse } from 'engagements/admin/create/authoring/utils';

const landingLoader = ({ request }: LoaderFunctionArgs): LandingLoaderData => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const searchText = searchParams.get('search_text');
    const page = searchParams.get('page');
    const metadata = searchParams.get('metadata') as string;
    const engagementStatus = searchParams.get('engagement_status') as string;
    const sortKey = searchParams.get('sort_key');
    const sortOrder = searchParams.get('sort_order') as SortOrder;

    const filtersPromise = getMetadataFilters();
    const engagementsPromise = getEngagements({
        search_text: searchText ?? defaultSearchFilters.search_text,
        page: Number(page ?? defaultSearchFilters.page),
        metadata: tryParse(metadata) ? JSON.parse(metadata) : defaultSearchParams.metadata,
        engagement_status: tryParse(engagementStatus) ? JSON.parse(engagementStatus) : defaultLandingStatuses,
        sort_key: sortKey ?? defaultSearchFilters.sort_key,
        sort_order: sortOrder && validSortOrders.includes(sortOrder) ? sortOrder : defaultSearchFilters.sort_order,
        size: defaultSearchFilters.size,
        include_banner_url: defaultSearchFilters.include_banner_url,
    });

    return { engagements: engagementsPromise, filters: filtersPromise };
};

export default landingLoader;
