import { redirect, Params } from 'react-router';
import { getAvailableTranslationLanguages, getEngagement, getEngagementBySlug } from 'services/engagementService';
import { getWidgets } from 'services/widgetService';
import { getEngagementMetadata, getMetadataTaxa } from 'services/engagementMetadataService';
import { Engagement, EngagementMetadata, MetadataTaxon } from 'models/engagement';
import { Widget } from 'models/widget';
import { getTeamMembers } from 'services/membershipService';
import { EngagementTeamMember } from 'models/engagementTeamMember';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { getDetailsTabs } from 'services/engagementDetailsTabService';
import { Language } from 'models/language';
import { AppConfig } from 'config';
import { ROUTES, getPath } from 'routes/routes';

export type EngagementLoaderAdminData = {
    engagement: Promise<Engagement>;
    widgets: Promise<Widget[]>;
    details: Promise<EngagementDetailsTab[]>;
    metadata: Promise<EngagementMetadata[]>;
    taxa: Promise<MetadataTaxon[]>;
    teamMembers: Promise<EngagementTeamMember[]>;
    languages: Promise<Language[]>;
    hasDefaultLanguageTranslation: Promise<boolean>;
};

export const engagementLoaderAdmin = async ({ params }: { params: Params<string> }) => {
    const { slug: slugParam, engagementId } = params;
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const engagement = (slugParam ? getEngagementBySlug(slugParam) : getEngagement(Number(engagementId))).then(
        (resolvedEngagement) => {
            if (!resolvedEngagement.authorization?.can_edit) {
                throw redirect(getPath(ROUTES.UNAUTHORIZED));
            }
            return resolvedEngagement;
        },
    );

    const translationLanguages = engagement.then((response) => getAvailableTranslationLanguages(response.id));
    const hasDefaultLanguageTranslation = translationLanguages.then((availableLanguages) =>
        availableLanguages.some((language) => language.code === defaultLanguageCode),
    );
    const languages = translationLanguages.then((availableLanguages) => {
        const hasDefaultLanguage = availableLanguages.some((language) => language.code === defaultLanguageCode);
        if (hasDefaultLanguage) {
            return availableLanguages;
        }

        return [
            {
                id: 0,
                code: defaultLanguageCode,
                name: AppConfig.language.defaultLanguageName,
                right_to_left: false,
            },
            ...availableLanguages,
        ];
    });
    const widgets = engagement.then((response) => getWidgets(Number(response.id)));
    const details = engagement.then((response) => getDetailsTabs(response.id));
    const engagementMetadata = engagement.then((response) => getEngagementMetadata(Number(response.id)));
    const taxaData = getMetadataTaxa();
    const teamMembers = engagement.then((response) => getTeamMembers({ engagement_id: response.id }).catch(() => []));

    const metadata = Promise.all([engagementMetadata, taxaData]).then(([metaResponse, taxaResponse]) => {
        metaResponse.forEach((metaEntry) => {
            const taxon = taxaResponse[metaEntry.taxon_id];
            if (taxon) {
                const entries = taxon.entries ?? [];
                entries.push(metaEntry);
                taxon.entries = entries;
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
        teamMembers,
        languages,
        hasDefaultLanguageTranslation,
    };
};

export default engagementLoaderAdmin;
