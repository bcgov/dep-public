import { ActionFunction, redirect } from 'react-router';
import {
    patchEngagement,
    getEngagementTranslationByCode,
    createEngagementTranslation,
    patchEngagementTranslation,
} from 'services/engagementService';
import { patchEngagementMetadata } from 'services/engagementMetadataService';
import { patchEngagementSettings } from 'services/engagementSettingService';
import { patchEngagementSlug } from 'services/engagementSlugService';
import { EngagementStatusBlock } from 'models/engagementStatusBlock';
import { getDetailsTabs, patchDetailsTabs } from 'services/engagementDetailsTabService';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { getLanguages } from 'services/languageService';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';
import { AppConfig } from 'config';

const ensureTranslation = async (engagementId: number, languageCode: string) => {
    let translation = await getEngagementTranslationByCode(engagementId, languageCode);
    if (translation) {
        return translation;
    }

    const languages = await getLanguages();
    const language = languages.find((lng) => lng.code === languageCode);
    if (!language) {
        throw new Error(`Invalid language code ${languageCode}`);
    }

    await createEngagementTranslation(engagementId, language.id);
    translation = await getEngagementTranslationByCode(engagementId, languageCode);
    if (!translation) {
        throw new Error('Failed to initialize translation for selected language');
    }

    return translation;
};

const patchTranslationForLanguage = async ({
    engagementId,
    languageCode,
    payload,
}: {
    engagementId: number;
    languageCode: string;
    payload: Record<string, unknown>;
}) => {
    const translation = await ensureTranslation(engagementId, languageCode);
    await patchEngagementTranslation(engagementId, translation.id, payload);
};

const getOptionalFormText = (formData: FormData, key: string): string | undefined => {
    const value = formData.get(key);
    if (typeof value !== 'string') {
        return undefined;
    }

    return value || undefined;
};

const toBodyString = (body: unknown): string => {
    if (!body) {
        return '';
    }

    return typeof body === 'string' ? body : JSON.stringify(body);
};

const runStep = async ({
    label,
    errors,
    task,
    shouldCollectError = true,
}: {
    label: string;
    errors: unknown[];
    task: () => Promise<void>;
    shouldCollectError?: boolean;
}) => {
    try {
        await task();
    } catch (e) {
        console.error(label, e);
        if (shouldCollectError) {
            errors.push(e);
        }
    }
};

const updateDetailsTabs = async ({
    engagementId,
    languageCode,
    defaultLanguageCode,
    detailsTabsRaw,
}: {
    engagementId: number;
    languageCode: string;
    defaultLanguageCode: string;
    detailsTabsRaw: string;
}) => {
    const parsedTabs = JSON.parse(detailsTabsRaw) as EngagementDetailsTab[];

    const existingBaseTabs = await getDetailsTabs(engagementId);
    const existingBaseTabsById = new Map(existingBaseTabs.map((tab) => [tab.id, tab]));

    const structuralTabs = parsedTabs?.map((tab) => {
        const parsedTabId = Number(tab.id);
        const isExistingTab = Number.isFinite(parsedTabId) && parsedTabId > 0;
        const existingBaseTab = isExistingTab ? existingBaseTabsById.get(parsedTabId) : undefined;

        const preserveBaseText = languageCode !== defaultLanguageCode && Boolean(existingBaseTab);

        let bodyString = '';
        if (!preserveBaseText && tab.body) {
            bodyString = toBodyString(tab.body);
        } else if (existingBaseTab?.body) {
            bodyString = toBodyString(existingBaseTab.body);
        }

        return {
            id: isExistingTab ? parsedTabId : -1,
            engagement_id: engagementId,
            // Slug is structural and remains shared across all languages.
            slug: tab.slug || existingBaseTab?.slug || undefined,
            sort_index: tab.sort_index || existingBaseTab?.sort_index || undefined,
            label: preserveBaseText ? existingBaseTab?.label : tab.label || existingBaseTab?.label || '',
            heading: preserveBaseText ? existingBaseTab?.heading : tab.heading || existingBaseTab?.heading || '',
            body: bodyString,
        };
    }) as unknown as EngagementDetailsTab[];

    await patchDetailsTabs(engagementId, structuralTabs);

    if (languageCode === defaultLanguageCode) {
        return;
    }

    const [latestBaseTabs, existingContentTranslations] = await Promise.all([
        getDetailsTabs(engagementId),
        getEngagementContentTranslationsByCode(engagementId, languageCode),
    ]);
    const existingTranslationsByTabId = new Map(
        existingContentTranslations.details_tabs.map((translation) => [
            translation.engagement_details_tab_id,
            translation,
        ]),
    );

    const parsedTabsById = new Map(parsedTabs.filter((tab) => Number(tab.id) > 0).map((tab) => [Number(tab.id), tab]));
    const parsedTabsBySlug = new Map(parsedTabs.map((tab) => [tab.slug, tab]));

    const translatedTabs = latestBaseTabs.map((baseTab) => {
        const incomingTab = parsedTabsById.get(baseTab.id) || parsedTabsBySlug.get(baseTab.slug) || baseTab;
        const existingTranslation = existingTranslationsByTabId.get(baseTab.id);

        let bodyString = '';
        if (incomingTab.body) {
            bodyString = toBodyString(incomingTab.body);
        } else if (baseTab.body) {
            bodyString = toBodyString(baseTab.body);
        }

        return {
            id: existingTranslation?.id,
            engagement_details_tab_id: baseTab.id,
            slug: baseTab.slug,
            label: incomingTab.label || baseTab.label,
            heading: incomingTab.heading || baseTab.heading,
            body: bodyString,
        };
    });

    await syncEngagementContentTranslationsByCode(engagementId, languageCode, {
        details_tabs: translatedTabs,
    });
};

export const authoringUpdateAction: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const errors: unknown[] = [];
    const requestType = formData.get('request_type') as string;
    const formSource = formData.get('form_source');
    const engagementId = Number(formData.get('id'));
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const languageCode = ((formData.get('language_code') as string) || defaultLanguageCode).toLowerCase();
    const statusBlock = [
        {
            survey_status: 'Open',
            button_text: formData.get('open_cta') as string,
            link_type: formData.get('open_cta_link_type') as string,
            internal_link: formData.get('open_section_link') as string,
            external_link: formData.get('open_external_link') as string,
        },
        {
            survey_status: 'ViewResults',
            button_text: formData.get('view_results_cta') as string,
            link_type: formData.get('view_results_link_type') as string,
            internal_link: formData.get('view_results_section_link') as string,
            external_link: formData.get('view_results_external_link') as string,
        },
        {
            survey_status: 'Closed',
            block_text: formData.get('closed_message') as string,
            link_type: 'none',
        },
        {
            survey_status: 'Upcoming',
            block_text: formData.get('upcoming_message') as string,
            link_type: 'none',
        },
    ] as EngagementStatusBlock[];

    // Update engagement if necessary.
    if (formSource === 'banner' || formSource === 'summary') {
        await runStep({
            label: 'Error updating engagement',
            errors,
            task: async () => {
                await patchTranslationForLanguage({
                    engagementId,
                    languageCode,
                    payload: {
                        name: getOptionalFormText(formData, 'name'),
                        sponsor_name: getOptionalFormText(formData, 'eyebrow'),
                        description: getOptionalFormText(formData, 'description'),
                        rich_description: getOptionalFormText(formData, 'rich_description'),
                        description_title: getOptionalFormText(formData, 'description_title'),
                        upcoming_status_block_text: getOptionalFormText(formData, 'upcoming_message'),
                        closed_status_block_text: getOptionalFormText(formData, 'closed_message'),
                        open_status_block_button_text: getOptionalFormText(formData, 'open_cta'),
                        view_results_status_block_button_text: getOptionalFormText(formData, 'view_results_cta'),
                    },
                });
                // Structural fields always stay on base engagement.
                await patchEngagement({
                    id: Number(formData.get('id')),
                    start_date: (formData.get('start_date') as string) || undefined,
                    status_id: Number(formData.get('status_id')) || undefined,
                    end_date: (formData.get('end_date') as string) || undefined,
                    banner_filename: (formData.get('banner_filename') as string) || undefined,
                    status_block: statusBlock,
                });
            },
        });
    }

    // Update engagement details tabs if necessary.
    if (formSource === 'details' && formData.get('details_tabs') !== '[]') {
        await runStep({
            label: 'Error updating engagement details tabs',
            errors,
            task: async () => {
                await updateDetailsTabs({
                    engagementId,
                    languageCode,
                    defaultLanguageCode,
                    detailsTabsRaw: formData.get('details_tabs') as string,
                });
            },
        });
    }

    // Update engagement feedback and survey settings
    if (formSource === 'feedback') {
        await runStep({
            label: 'Error updating engagement',
            errors,
            task: async () => {
                const selectedSurvey = formData.get('selected_survey_id');
                const numericSelectedSurvey = selectedSurvey ? Number(selectedSurvey) : undefined;
                await patchTranslationForLanguage({
                    engagementId,
                    languageCode,
                    payload: {
                        feedback_heading: getOptionalFormText(formData, 'feedback_heading'),
                        feedback_body: getOptionalFormText(formData, 'feedback_body'),
                    },
                });
                await patchEngagement({
                    id: engagementId,
                    selected_survey_id: numericSelectedSurvey || undefined,
                });
            },
        });
    }

    // Update more engagements section if necesssary
    if (formSource === 'more') {
        await runStep({
            label: 'Error updating more engagements section',
            errors,
            shouldCollectError: false,
            task: async () => {
                const moreEngagementsHeading = formData.get('more_engagements_heading') as string;
                // 3 Engagement Suggestion Slots
                const suggestions = Array.from({ length: 3 })
                    .map((_, i) => {
                        const raw = formData.get(`more_engagements_${i + 1}`) as unknown as number;
                        const suggested = Number(raw);
                        if (!Number.isFinite(suggested) || suggested <= 0) return undefined;
                        return {
                            sort_index: i + 1,
                            suggested_engagement_id: suggested,
                        };
                    })
                    .filter((v) => v !== undefined);

                await patchTranslationForLanguage({
                    engagementId,
                    languageCode,
                    payload: {
                        more_engagements_heading: moreEngagementsHeading || undefined,
                    },
                });
                // suggested_engagements is structural (cross-language), stays on base engagement.
                await patchEngagement({
                    id: engagementId,
                    suggested_engagements: suggestions,
                });
            },
        });
    }

    // Update engagement subscribe section settings
    if (formSource === 'subscribe') {
        await runStep({
            label: 'Error updating engagement subscribe section',
            errors,
            task: async () => {
                await patchTranslationForLanguage({
                    engagementId,
                    languageCode,
                    payload: {
                        subscribe_section_heading: getOptionalFormText(formData, 'subscribe_section_heading'),
                        subscribe_section_description: getOptionalFormText(formData, 'subscribe_section_description'),
                        subscribe_consent_message: getOptionalFormText(formData, 'subscribe_consent_message'),
                    },
                });
            },
        });
    }

    // Update engagement metadata if necessary.
    if (formData.get('metadata_value') && formData.get('taxon_id')) {
        await runStep({
            label: 'Error updating engagement metadata',
            errors,
            task: async () => {
                await patchEngagementMetadata({
                    value: formData.get('metadata_value') as string,
                    taxon_id: Number(formData.get('taxon_id')),
                    engagement_id: engagementId,
                });
            },
        });
    }

    // Update engagement settings if necessary.
    if (formData.get('send_report')) {
        await runStep({
            label: 'Error updating engagement settings',
            errors,
            task: async () => {
                await patchEngagementSettings({
                    engagement_id: engagementId,
                    send_report: 'true' === formData.get('send_report'),
                });
            },
        });
    }

    // Update engagement slug if necessary.
    if (formData.get('slug')) {
        await runStep({
            label: 'Error updating engagement slug',
            errors,
            task: async () => {
                await patchEngagementSlug({
                    engagement_id: engagementId,
                    slug: formData.get('slug') as string,
                });
            },
        });
    }

    if (0 === errors.length && 'preview' === requestType) {
        return redirect(`../../../old-view`);
    } else if (0 === errors.length && 'update' === requestType) {
        return 'success';
    } else {
        return 'failure';
    }
};

export default authoringUpdateAction;
