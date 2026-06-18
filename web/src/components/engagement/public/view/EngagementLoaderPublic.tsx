import { Params } from 'react-router';
import { getAvailableTranslationLanguages, getEngagement, getEngagementBySlug } from 'services/engagementService';
import { getWidgets } from 'services/widgetService';
import { getEngagementMetadata, getMetadataTaxa } from 'services/engagementMetadataService';
import { Engagement, EngagementMetadata, MetadataTaxon } from 'models/engagement';
import { Widget } from 'models/widget';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { getDetailsTabs } from 'services/engagementDetailsTabService';
import { getTenantLanguages } from 'services/languageService';
import { Language } from 'models/language';
import { SuggestedEngagementWithAttachment } from 'models/suggestedEngagement';
import { AppConfig } from 'config';
import { buildTranslationBundle, TranslationBundle } from './engagementTranslationResolution';

export type EngagementLoaderPublicData = {
    engagement: Promise<Engagement>;
    widgets: Promise<Widget[]>;
    details: Promise<EngagementDetailsTab[]>;
    metadata: Promise<EngagementMetadata[]>;
    taxa: Promise<MetadataTaxon[]>;
    languages: Promise<Language[]>;
    translationLanguages?: Promise<Language[]>;
    suggestions: Promise<SuggestedEngagementWithAttachment[]>;
    translationBundle: Promise<TranslationBundle>;
};

export const engagementLoaderPublic = async ({ params }: { params: Params<string> }) => {
    const { slug: slugParam, engagementId, language } = params;
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const activeLanguageCode = (language ?? defaultLanguageCode).toLowerCase();

    const tenantId = globalThis?.sessionStorage?.getItem('tenantId') ?? null;
    const engagement = slugParam ? getEngagementBySlug(slugParam) : getEngagement(Number(engagementId));
    const widgets = engagement.then((response) => getWidgets(Number(response.id)));
    const details = engagement.then((response) => getDetailsTabs(response.id));
    const translationLanguages = engagement.then((response) =>
        getAvailableTranslationLanguages(response.id).catch(() => []),
    );
    const suggestions = engagement.then(
        (response) => response.suggested_engagements ?? ([] as SuggestedEngagementWithAttachment[]),
    );
    const engagementMetadata = engagement.then((response) => getEngagementMetadata(Number(response.id)));
    const taxaData = getMetadataTaxa();
    const translationBundle = engagement.then((response) =>
        buildTranslationBundle({
            engagementId: Number(response.id),
            activeLanguageCode,
            defaultLanguageCode,
        }),
    );

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
        widgets,
        details,
        metadata,
        taxa,
        languages: tenantId ? getTenantLanguages(tenantId) : Promise.resolve([]),
        translationLanguages,
        suggestions,
        translationBundle,
    };
};

export default engagementLoaderPublic;
