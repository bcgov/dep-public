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

export const authoringUpdateAction: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const errors = [];
    const requestType = formData.get('request_type') as string;
    const engagementId = Number(formData.get('id'));
    const languageCode = ((formData.get('language_code') as string) || 'en').toLowerCase();
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
    if (formData.get('form_source') === 'banner' || formData.get('form_source') === 'summary') {
        try {
            const translation = await ensureTranslation(engagementId, languageCode);
            await patchEngagementTranslation(engagementId, translation.id, {
                name: (formData.get('name') as string) || undefined,
                sponsor_name: (formData.get('eyebrow') as string) || undefined,
                description: (formData.get('description') as string) || undefined,
                rich_description: (formData.get('rich_description') as string) || undefined,
                description_title: (formData.get('description_title') as string) || undefined,
                upcoming_status_block_text: (formData.get('upcoming_message') as string) || undefined,
                closed_status_block_text: (formData.get('closed_message') as string) || undefined,
                open_status_block_button_text: (formData.get('open_cta') as string) || undefined,
                view_results_status_block_button_text: (formData.get('view_results_cta') as string) || undefined,
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
        } catch (e) {
            console.error('Error updating engagement', e);
            errors.push(e);
        }
    }

    // Update engagement details tabs if necessary.
    if (formData.get('form_source') === 'details' && formData.get('details_tabs') !== '[]') {
        try {
            const tabs = formData.get('details_tabs') as unknown as string;
            const parsedTabs = JSON.parse(tabs) as unknown as EngagementDetailsTab[];

            const existingBaseTabs = await getDetailsTabs(engagementId);
            const existingBaseTabsById = new Map(existingBaseTabs.map((tab) => [tab.id, tab]));

            const structuralTabs = parsedTabs?.map((tab) => {
                const parsedTabId = Number(tab.id);
                const isExistingTab = Number.isFinite(parsedTabId) && parsedTabId > 0;
                const existingBaseTab = isExistingTab ? existingBaseTabsById.get(parsedTabId) : undefined;

                const preserveBaseText = languageCode !== 'en' && Boolean(existingBaseTab);

                // Ensure body is properly serialized as JSON string
                let bodyString = '';
                if (!preserveBaseText && tab.body) {
                    bodyString = typeof tab.body === 'string' ? tab.body : JSON.stringify(tab.body);
                } else if (existingBaseTab?.body) {
                    bodyString =
                        typeof existingBaseTab.body === 'string'
                            ? existingBaseTab.body
                            : JSON.stringify(existingBaseTab.body);
                }

                return {
                    id: isExistingTab ? parsedTabId : -1,
                    engagement_id: engagementId,
                    // Slug is structural and remains shared across all languages.
                    slug: tab.slug || existingBaseTab?.slug || undefined,
                    sort_index: tab.sort_index || existingBaseTab?.sort_index || undefined,
                    label: preserveBaseText ? existingBaseTab?.label : tab.label || existingBaseTab?.label || '',
                    heading: preserveBaseText
                        ? existingBaseTab?.heading
                        : tab.heading || existingBaseTab?.heading || '',
                    body: bodyString,
                };
            }) as unknown as EngagementDetailsTab[];
            await patchDetailsTabs(engagementId, structuralTabs);

            if (languageCode !== 'en') {
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

                const parsedTabsById = new Map(
                    parsedTabs.filter((tab) => Number(tab.id) > 0).map((tab) => [Number(tab.id), tab]),
                );
                const parsedTabsBySlug = new Map(parsedTabs.map((tab) => [tab.slug, tab]));

                const translatedTabs = latestBaseTabs.map((baseTab) => {
                    const incomingTab = parsedTabsById.get(baseTab.id) || parsedTabsBySlug.get(baseTab.slug) || baseTab;
                    const existingTranslation = existingTranslationsByTabId.get(baseTab.id);

                    // Ensure body is properly serialized as JSON string
                    let bodyString = '';
                    if (incomingTab.body) {
                        bodyString =
                            typeof incomingTab.body === 'string' ? incomingTab.body : JSON.stringify(incomingTab.body);
                    } else if (baseTab.body) {
                        bodyString = typeof baseTab.body === 'string' ? baseTab.body : JSON.stringify(baseTab.body);
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
            }
        } catch (e) {
            console.error('Error updating engagement details tabs', e);
            errors.push(e);
        }
    }

    // Update engagement feedback and survey settings
    if (formData.get('form_source') === 'feedback') {
        try {
            const selectedSurvey = formData.get('selected_survey_id');
            const numericSelectedSurvey = selectedSurvey ? Number(selectedSurvey) : undefined;
            const translation = await ensureTranslation(engagementId, languageCode);
            await patchEngagementTranslation(engagementId, translation.id, {
                feedback_heading: (formData.get('feedback_heading') as string) || undefined,
                feedback_body: (formData.get('feedback_body') as string) || undefined,
            });
            await patchEngagement({
                id: engagementId,
                selected_survey_id: numericSelectedSurvey || undefined,
            });
        } catch (e) {
            console.error('Error updating engagement', e);
            errors.push(e);
        }
    }

    // Update more engagements section if necesssary
    if (formData.get('form_source') === 'more') {
        try {
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

            const translation = await ensureTranslation(engagementId, languageCode);
            await patchEngagementTranslation(engagementId, translation.id, {
                more_engagements_heading: moreEngagementsHeading || undefined,
            });
            // suggested_engagements is structural (cross-language), stays on base engagement.
            await patchEngagement({
                id: engagementId,
                suggested_engagements: suggestions,
            });
        } catch (e) {
            console.error('Error updating more engagements section', e);
        }
    }

    // Update engagement subscribe section settings
    if (formData.get('form_source') === 'subscribe') {
        try {
            const translation = await ensureTranslation(engagementId, languageCode);
            await patchEngagementTranslation(engagementId, translation.id, {
                subscribe_section_heading: (formData.get('subscribe_section_heading') as string) || undefined,
                subscribe_section_description: (formData.get('subscribe_section_description') as string) || undefined,
                subscribe_consent_message: (formData.get('subscribe_consent_message') as string) || undefined,
            });
        } catch (e) {
            console.error('Error updating engagement subscribe section', e);
            errors.push(e);
        }
    }

    // Update engagement metadata if necessary.
    if (formData.get('metadata_value') && formData.get('taxon_id')) {
        try {
            await patchEngagementMetadata({
                value: formData.get('metadata_value') as string,
                taxon_id: Number(formData.get('taxon_id')),
                engagement_id: engagementId,
            });
        } catch (e) {
            console.error('Error updating engagement metadata', e);
            errors.push(e);
        }
    }

    // Update engagement settings if necessary.
    if (formData.get('send_report')) {
        try {
            await patchEngagementSettings({
                engagement_id: engagementId,
                send_report: 'true' === formData.get('send_report'),
            });
        } catch (e) {
            console.error('Error updating engagement settings', e);
            errors.push(e);
        }
    }

    // Update engagement slug if necessary.
    if (formData.get('slug')) {
        try {
            await patchEngagementSlug({
                engagement_id: engagementId,
                slug: formData.get('slug') as string,
            });
        } catch (e) {
            console.error('Error updating engagement slug', e);
            errors.push(e);
        }
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
