import { MetadataFilter } from 'components/metadataManagement/types';
import { MetadataTaxon } from 'models/engagement';
import {
    EngagementSearchParams,
    getEngagementSearchCounts,
    getPublicEngagementSearch,
} from 'services/engagementService';
import { getMetadataFilters, getMetadataTaxa } from 'services/engagementMetadataService';
import { metadataCountKey, metadataParam } from 'components/engagement/search/engagementSearchLoader';
import type { EngagementCarouselPage } from 'components/engagement/EngagementCarousel';

export type LandingLoaderData = {
    regionFilter: Promise<MetadataFilter | null>;
    regions: Promise<{
        hasOpenEngagements: boolean;
        items: Array<{ name: string; count: number; searchParam: string }>;
    }>;
    categories: Promise<Array<MetadataFilter | null>>;
    taxa: Promise<MetadataTaxon[]>;
    featuredEngagements: Promise<EngagementCarouselPage>;
    newEngagements: Promise<EngagementCarouselPage>;
    closingSoonEngagements: Promise<EngagementCarouselPage>;
};

const DYNAMIC_ENGAGEMENT_PAGE_SIZE = 6;

// Bundle each promise result with another promise for the next page if available
const loadCarouselPage = async (params: EngagementSearchParams, page: number): Promise<EngagementCarouselPage> => {
    const result = await getPublicEngagementSearch({ ...params, page, size: DYNAMIC_ENGAGEMENT_PAGE_SIZE });
    let pending: Promise<EngagementCarouselPage> | undefined;
    const loadNextPage =
        result.items.length > 0 && page * DYNAMIC_ENGAGEMENT_PAGE_SIZE < result.total
            ? () => {
                  if (!pending) {
                      pending = loadCarouselPage(params, page + 1).catch((error: unknown) => {
                          pending = undefined;
                          throw error;
                      });
                  }
                  return pending;
              }
            : undefined;
    return { engagements: result.items, loadNextPage };
};

export const landingLoader = () => {
    const metadataFilters = getMetadataFilters();
    const taxa = getMetadataTaxa();
    const regionData = Promise.all([taxa, metadataFilters]).then(([taxa, filters]) => {
        const requiredRegion = taxa.find(
            (taxon: MetadataTaxon) => taxon.is_required && taxon.name?.trim().toLowerCase() === 'region',
        );
        const filter = requiredRegion ? (filters.find((item) => item.taxon_id === requiredRegion.id) ?? null) : null;
        return { filter, searchParam: filter ? metadataParam(filter.taxon_id, filters) : null };
    });
    const regionFilter = regionData.then(({ filter }) => filter);

    const regions = regionData.then(async ({ filter, searchParam }) => {
        if (!filter || !searchParam) return { hasOpenEngagements: false, items: [] };
        const counts = await getEngagementSearchCounts({
            published_from_date: '1970-01-01',
            engagement_status: ['open'],
            metadata: [],
        });
        if (typeof counts.status_counts.open !== 'number') {
            throw new TypeError('Missing open engagement count');
        }
        const hasOpenEngagements = counts.status_counts.open > 0;
        const items = filter.values.flatMap((value) => {
            const key = metadataCountKey(filter.taxon_id, value);
            const total = counts.metadata_total_counts[key];
            const count = counts.metadata_counts[key];
            if (typeof total !== 'number' || typeof count !== 'number') {
                throw new TypeError(`Missing engagement counts for region: ${value}`);
            }
            return total > 0 ? [{ name: value, count: hasOpenEngagements ? count : total, searchParam }] : [];
        });
        return { hasOpenEngagements, items };
    });

    const categories = Promise.all([taxa, metadataFilters]).then(([taxa, filters]) => {
        return taxa
            .filter((taxon: MetadataTaxon) => taxon.is_required && taxon.name?.trim().toLowerCase() !== 'region')
            .map((taxon: MetadataTaxon) => {
                const filter = filters.find((item) => item.taxon_id === taxon.id) ?? null;
                return filter;
            });
    });

    const publicSearchParams = {
        // Only include engagements that have been published
        published_from_date: '1970-01-01',
        filterable_metadata: true,
        include_banner_url: true,
        sort_key: 'newest',
    };

    const featuredEngagements = loadCarouselPage(
        {
            ...publicSearchParams,
            is_featured: true,
        },
        1,
    );

    const newEngagements = loadCarouselPage(
        {
            ...publicSearchParams,
            engagement_status: ['published', 'closed'],
            date_window: 'recently_opened',
        },
        1,
    );
    const closingSoonEngagements = loadCarouselPage(
        {
            ...publicSearchParams,
            engagement_status: ['open'],
            date_window: 'closing_soon',
        },
        1,
    );

    return { regionFilter, regions, featuredEngagements, newEngagements, closingSoonEngagements, categories, taxa };
};

export default landingLoader;
