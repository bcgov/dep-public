import { Params } from 'react-router';
import { getEngagement } from 'services/engagementService';
import { getEngagementIdBySlug, getSlugByEngagementId } from 'services/engagementSlugService';
import { getWidgets } from 'services/widgetService';
import { getEngagementMetadata, getMetadataTaxa } from 'services/engagementMetadataService';
import { Engagement, EngagementMetadata, MetadataTaxon } from 'models/engagement';
import { Widget } from 'models/widget';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { getDetailsTabs } from 'services/engagementDetailsTabService';
import { getTenantLanguages } from 'services/languageService';
import { Language } from 'models/language';
import { SuggestedEngagementWithAttachment } from 'models/suggestedEngagement';

export type EngagementLoaderPublicData = {
    engagement: Promise<Engagement>;
    slug: Promise<string>;
    widgets: Promise<Widget[]>;
    details: Promise<EngagementDetailsTab[]>;
    metadata: Promise<EngagementMetadata[]>;
    taxa: Promise<MetadataTaxon[]>;
    languages: Promise<Language[]>;
    suggestions: Promise<SuggestedEngagementWithAttachment[]>;
};

export const engagementLoaderPublic = async ({ params }: { params: Params<string> }) => {
    const { slug: slugParam, engagementId } = params;

    const tenantId = globalThis?.sessionStorage?.getItem('tenantId') ?? null;
    const languages = tenantId ? getTenantLanguages(tenantId) : Promise.resolve([]);
    const slug = slugParam
        ? Promise.resolve(slugParam)
        : getSlugByEngagementId(Number(engagementId)).then((response) => response.slug);
    const engagement = slugParam
        ? getEngagementIdBySlug(slugParam).then((response) => getEngagement(response.engagement_id))
        : getEngagement(Number(engagementId));
    const widgets = engagement.then((response) => getWidgets(Number(response.id)));
    const details = engagement.then((response) => getDetailsTabs(response.id));
    const suggestions = engagement.then(
        (response) => response.suggested_engagements ?? ([] as SuggestedEngagementWithAttachment[]),
    );
    const engagementMetadata = engagement.then((response) => getEngagementMetadata(Number(response.id)));
    const taxaData = getMetadataTaxa();

    const metadata = Promise.all([engagementMetadata, taxaData]).then(([metaResponse, taxaResponse]) => {
        metaResponse.forEach((metaEntry) => {
            const taxon = taxaResponse[metaEntry.taxon_id];
            if (taxon) {
                taxon.entries ??= [];
                taxon.entries.push(metaEntry);
            }
        });
        return metaResponse;
    });

    const taxa = taxaData.then((taxa) => Object.values(taxa));

    return {
        engagement,
        slug,
        widgets,
        details,
        metadata,
        taxa,
        languages,
        suggestions,
    };
};

export default engagementLoaderPublic;
