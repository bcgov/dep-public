import { Engagement } from 'models/engagement';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { SuggestedEngagement } from 'models/suggestedEngagement';
import { Survey } from 'models/survey';
import { Params } from 'react-router';
import { getDetailsTabs } from 'services/engagementDetailsTabService';
import { getEngagement, getEngagements } from 'services/engagementService';
import { getSurveysPage } from 'services/surveyService';
import { Page } from 'services/type';
import { getEngagementContentTranslationsByCode } from 'services/engagementContentTranslationService';
import { AppConfig } from 'config';

export type SurveyData = {
    items: Survey[];
    total: number;
};

export type AuthoringLoaderData = {
    engagement: Promise<Engagement>;
    engagementList: Promise<Page<Engagement>>;
    detailsTabs: Promise<EngagementDetailsTab[]>;
    surveys: Promise<SurveyData>;
    suggestions: Promise<SuggestedEngagement[]>;
};

const authoringLoader = async ({ params }: { params: Params<string> }) => {
    const { engagementId, tenantId, languageCode } = params;
    const id = Number(engagementId);
    const tId = Number(tenantId);
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const activeLanguageCode = (languageCode ?? defaultLanguageCode).toLowerCase();

    const engagementPromise = getEngagement(id);
    // Retrieves a maximum of 1000 engagements
    const engagementListPromise = getEngagements({ size: 1000, tenant_id: tId });
    const detailsTabsPromise = Promise.all([
        getDetailsTabs(id),
        activeLanguageCode === defaultLanguageCode
            ? Promise.resolve({
                  details_tabs: [],
                  widgets: [],
                  timeline_widgets: [],
                  events_widgets: [],
                  documents_widgets: [],
                  image_widgets: [],
              })
            : getEngagementContentTranslationsByCode(id, activeLanguageCode).catch(() => ({
                  details_tabs: [],
                  widgets: [],
                  timeline_widgets: [],
                  events_widgets: [],
                  documents_widgets: [],
                  image_widgets: [],
              })),
    ]).then(([tabs, contentTranslations]) => {
        if (activeLanguageCode === defaultLanguageCode) {
            return tabs;
        }

        const detailTranslationsByTabId = new Map(
            contentTranslations.details_tabs.map((translation) => [translation.engagement_details_tab_id, translation]),
        );

        return tabs.map((tab) => {
            const translatedTab = detailTranslationsByTabId.get(tab.id);
            if (!translatedTab) {
                return {
                    ...tab,
                    // Slug remains structural and language-invariant.
                    slug: tab.slug,
                    label: '',
                    heading: '',
                    body: '',
                };
            }

            return {
                ...tab,
                // Slug remains structural and language-invariant.
                slug: tab.slug,
                label: translatedTab.label ?? '',
                heading: translatedTab.heading ?? '',
                body: translatedTab.body ?? '',
            };
        });
    });
    const surveysPromise = getSurveysPage();
    const suggestionsPromise = engagementPromise.then((response) => response.suggested_engagements ?? []);

    return {
        engagement: engagementPromise,
        engagementList: engagementListPromise,
        detailsTabs: detailsTabsPromise,
        surveys: surveysPromise,
        suggestions: suggestionsPromise,
    };
};

export default authoringLoader;
