import { MetadataFilter } from 'components/metadataManagement/types';
import { Engagement, MetadataTaxon } from 'models/engagement';
import { getPublicEngagementSearch } from 'services/engagementService';
import { getMetadataFilters, getMetadataTaxa } from 'services/engagementMetadataService';

export type LandingLoaderData = {
    regionFilter: Promise<MetadataFilter | null>;
    featuredEngagements: Promise<Engagement[]>;
};

const FEATURED_ENGAGEMENT_LIMIT = 24;

export const landingLoader = () => {
    const regionFilter = Promise.all([getMetadataTaxa(), getMetadataFilters()]).then(([taxa, filters]) => {
        const requiredRegion = taxa.find(
            (taxon: MetadataTaxon) => taxon.is_required && taxon.name?.trim().toLowerCase() === 'region',
        );
        return requiredRegion ? (filters.find((filter) => filter.taxon_id === requiredRegion.id) ?? null) : null;
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

    return { regionFilter, featuredEngagements };
};

export default landingLoader;
