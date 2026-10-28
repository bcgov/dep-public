import { MetadataFilter } from 'components/metadataManagement/types';
import { MetadataTaxon } from 'models/engagement';
import { getMetadataFilters, getMetadataTaxa } from 'services/engagementMetadataService';

export type LandingLoaderData = {
    regionFilter: Promise<MetadataFilter | null>;
};

export const landingLoader = () => {
    const regionFilter = Promise.all([getMetadataTaxa(), getMetadataFilters()]).then(([taxa, filters]) => {
        const requiredRegion = taxa.find(
            (taxon: MetadataTaxon) => taxon.is_required && taxon.name?.trim().toLowerCase() === 'region',
        );
        return requiredRegion ? (filters.find((filter) => filter.taxon_id === requiredRegion.id) ?? null) : null;
    });

    return { regionFilter };
};

export default landingLoader;
