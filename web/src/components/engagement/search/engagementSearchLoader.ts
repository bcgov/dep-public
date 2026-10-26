import { getPublicEngagementSearch, getEngagementSearchCounts } from 'services/engagementService';
import { Engagement } from 'models/engagement';
import { getMetadataFilters } from 'services/engagementMetadataService';
// import { defaultLandingStatuses, defaultSearchFilters } from '../constants';
import { Page } from 'services/type';
import { MetadataFilter } from 'components/metadataManagement/types';

export type EngagementSearchLoaderData = {
    q?: string;
    page?: string;
    perPage?: string;
    engagements: Promise<Page<Engagement>>;
    sortBy?: string;
    sortDirection?: string;
    engagementStatuses: string[];
    statusCounts: Promise<Record<string, number>>;
    metadataFilters: Promise<MetadataFilter[]>;
    metadataCounts: Promise<Record<string, number>>;
    metadataTotalCounts: Promise<Record<string, number>>;
};

const metadataNameSlug = (name?: string) =>
    (name ?? '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

export const metadataParam = (taxonId: number, filters: MetadataFilter[]) => {
    const filter = filters.find((item) => item.taxon_id === taxonId);
    const slug = metadataNameSlug(filter?.name);
    if (!slug) {
        return `meta-${taxonId}`;
    }
    const duplicateName = filters.filter((item) => metadataNameSlug(item.name) === slug).length > 1;
    return duplicateName ? `meta-${slug}-${taxonId}` : `meta-${slug}`;
};

export const metadataParamValues = (params: URLSearchParams, taxonId: number, filters: MetadataFilter[]) => {
    const key = metadataParam(taxonId, filters);
    const values = params.getAll(key) || params.getAll(`meta-${taxonId}`);
    const filter = filters.find((item) => item.taxon_id === taxonId);
    const legacyRegionValues = filter?.name?.trim().toLowerCase() === 'region' ? params.getAll('region') : [];
    return values.length > 0 ? values : legacyRegionValues;
};

export const metadataCountKey = (taxonId: number, value: string) => `${taxonId}:${value}`;

export const validSortOrders = ['asc' as const, 'desc' as const];
export type SortDirection = (typeof validSortOrders)[number];

export const engagementSearchLoader = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const queryParams = url.searchParams;
    const query = queryParams.get('q') ?? undefined;
    const page = queryParams.get('page') ?? undefined;
    const perPage = queryParams.get('perPage') ?? undefined;
    const sortBy = queryParams.get('sortBy') ?? undefined;
    const sortDirection = (queryParams.get('sortDirection') as SortDirection) ?? undefined;
    const engagementStatuses = queryParams.getAll('status');

    const metadataFiltersPromise = getMetadataFilters();
    const metadataPromise = metadataFiltersPromise.then((availableFilters) =>
        availableFilters
            .map((filter) => ({
                taxon_id: filter.taxon_id,
                filter_type: filter.filter_type,
                values: metadataParamValues(queryParams, filter.taxon_id, availableFilters).filter((v) =>
                    filter.values.includes(v),
                ),
            }))
            .filter((criterion) => criterion.values.length > 0),
    );

    const searchCountsPromise = metadataPromise.then((metadata) =>
        getEngagementSearchCounts({
            search_text: query ?? '',
            published_from_date: '1970-01-01',
            engagement_status: engagementStatuses,
            metadata,
        }),
    );

    const engagementsPromise = metadataPromise.then((metadata) => {
        const baseParams = {
            // Only get publicly shared metadata for the landing page, even if logged in
            filterable_metadata: true,
            // Only include engagements that have been published
            published_from_date: '1970-01-01',
            search_text: query ?? '',
            metadata: JSON.stringify(metadata),
        };
        return getPublicEngagementSearch({
            ...baseParams,
            page: Number(page ?? 1),
            engagement_status: engagementStatuses,
            sort_key: sortBy,
            sort_order: (sortDirection && validSortOrders.includes(sortDirection)
                ? sortDirection
                : 'asc') as SortDirection,
            size: 6,
            include_banner_url: true,
        });
    });

    return {
        q: query,
        sortBy: sortBy,
        page: page ?? 1,
        perPage: perPage ?? 6,
        sortDirection: sortDirection,
        engagements: engagementsPromise,
        engagementStatuses: engagementStatuses,
        metadataFilters: metadataFiltersPromise,
        statusCounts: searchCountsPromise.then((counts) => counts.status_counts),
        metadataCounts: searchCountsPromise.then((counts) => counts.metadata_counts),
        metadataTotalCounts: searchCountsPromise.then((counts) => counts.metadata_total_counts),
    } as EngagementSearchLoaderData;
};

export default engagementSearchLoader;
