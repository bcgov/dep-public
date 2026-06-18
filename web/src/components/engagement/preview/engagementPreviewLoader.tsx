import { Params } from 'react-router';
import { getAvailableTranslationLanguages, getEngagement } from 'services/engagementService';
import { getWidgets } from 'services/widgetService';
import { getEngagementMetadata, getMetadataTaxa } from 'services/engagementMetadataService';
import { Engagement, EngagementMetadata, MetadataTaxon } from 'models/engagement';
import { Widget } from 'models/widget';
import { getTeamMembers } from 'services/membershipService';
import { EngagementTeamMember } from 'models/engagementTeamMember';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { getDetailsTabs } from 'services/engagementDetailsTabService';
import { getTenantLanguages } from 'services/languageService';
import { Language } from 'models/language';
import { Tenant } from 'models/tenant';
import { fetchVersion } from 'services/versionService';
import { getMyTenants } from 'services/tenantService';
import { SuggestedEngagementWithAttachment } from 'models/suggestedEngagement';
import { AppConfig } from 'config';
import {
    buildTranslationBundle,
    TranslationBundle,
} from 'components/engagement/public/view/engagementTranslationResolution';

export type EngagementPreviewLoaderData = {
    engagement: Promise<Engagement>;
    widgets: Promise<Widget[]>;
    details: Promise<EngagementDetailsTab[]>;
    metadata: Promise<EngagementMetadata[]>;
    taxa: Promise<MetadataTaxon[]>;
    teamMembers: Promise<EngagementTeamMember[]>;
    languages: Promise<Language[]>;
    translationLanguages: Promise<Language[]>;
    tenants: Promise<Tenant[]>;
    apiVersion: Promise<string>;
    suggestions: Promise<SuggestedEngagementWithAttachment[]>;
    translationBundle: Promise<TranslationBundle>;
};

/**
 * Loader for the engagement preview page.
 * Loads all necessary data for previewing an engagement.
 * Similar to the public engagement loader but uses engagement ID instead of slug.
 */
export const engagementPreviewLoader = async ({ params }: { params: Params<string> }) => {
    const { engagementId, languageCode } = params;

    if (!engagementId) {
        throw new Error('Engagement ID is required');
    }

    const tenantId = globalThis?.sessionStorage?.getItem('tenantId') || null;
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const activeLanguageCode = (
        languageCode ??
        globalThis?.sessionStorage?.getItem('languageId') ??
        defaultLanguageCode
    ).toLowerCase();

    const languages = tenantId ? getTenantLanguages(tenantId) : Promise.resolve([]);
    const engagement = getEngagement(Number(engagementId));
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
    const teamMembers = engagement.then((response) => getTeamMembers({ engagement_id: response.id }).catch(() => []));
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
    const myTenants = getMyTenants();
    const apiVersion = fetchVersion();

    return {
        engagement,
        widgets,
        details,
        metadata,
        taxa,
        teamMembers,
        languages,
        translationLanguages,
        tenants: myTenants,
        apiVersion,
        suggestions,
        translationBundle,
    };
};

export default engagementPreviewLoader;
