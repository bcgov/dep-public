import { MetadataFilter } from 'components/metadataManagement/types';
import { Engagement, MetadataTaxon } from 'models/engagement';
import { getEngagementSearchCounts, getPublicEngagementSearch } from 'services/engagementService';
import { getMetadataFilters, getMetadataTaxa } from 'services/engagementMetadataService';
import { metadataCountKey, metadataParam } from 'components/engagement/search/engagementSearchLoader';

export type LandingLoaderData = {
    regionFilter: Promise<MetadataFilter | null>;
    regions: Promise<Array<{ name: string; count: number; searchParam: string }>>;
    featuredEngagements: Promise<Engagement[]>;
};

const FEATURED_ENGAGEMENT_LIMIT = 24;

export const landingLoader = () => {
    const regionData = Promise.all([getMetadataTaxa(), getMetadataFilters()]).then(([taxa, filters]) => {
        const requiredRegion = taxa.find(
            (taxon: MetadataTaxon) => taxon.is_required && taxon.name?.trim().toLowerCase() === 'region',
        );
        const filter = requiredRegion ? (filters.find((item) => item.taxon_id === requiredRegion.id) ?? null) : null;
        return { filter, searchParam: filter ? metadataParam(filter.taxon_id, filters) : null };
    });
    const regionFilter = regionData.then(({ filter }) => filter);

    const regions = regionData.then(async ({ filter, searchParam }) => {
        if (!filter || !searchParam) return [];
        const counts = await getEngagementSearchCounts({
            published_from_date: '1970-01-01',
            engagement_status: ['open'],
            metadata: [],
        });
        return filter.values.flatMap((value) => {
            const key = metadataCountKey(filter.taxon_id, value);
            const total = counts.metadata_total_counts[key];
            const count = counts.metadata_counts[key];
            if (typeof total !== 'number' || typeof count !== 'number') {
                throw new TypeError(`Missing engagement counts for region: ${value}`);
            }
            return total > 0 ? [{ name: value, count, searchParam }] : [];
        });
    });

    const featuredEngagements = getPublicEngagementSearch({
        is_featured: true,
        // Only include engagements that have been published
        published_from_date: '1970-01-01',
        filterable_metadata: true,
        include_banner_url: true,
        page: 1,
        size: FEATURED_ENGAGEMENT_LIMIT,
        sort_key: 'newest',
    })
        .then((page) => page.items)
        // The featured section is optional; a failure should hide it rather than break the landing page.
        .catch(() => [] as Engagement[]);

    return { regionFilter, regions, featuredEngagements };
};

export default landingLoader;
