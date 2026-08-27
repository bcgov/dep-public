import { useEffect, useMemo, useState } from 'react';
import { Engagement } from 'models/engagement';
import { SUBMISSION_STATUS } from 'constants/engagementStatus';
import { getEngagement, getEngagementTranslationByCode, EngagementTranslation } from 'services/engagementService';
import {
    EngagementContentTranslations,
    getEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';
import { getDetailsTabs } from 'services/engagementDetailsTabService';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { AppConfig } from 'config';
import { useNavigate } from 'react-router';

export const AUTHORING_SECTION = {
    HERO_BANNER: 'Hero Banner',
    SUMMARY: 'Summary',
    DETAILS: 'Details',
    PROVIDE_FEEDBACK: 'Provide Feedback',
    VIEW_RESULTS: 'View Results',
    SUBSCRIBE: 'Subscribe',
    MORE_ENGAGEMENTS: 'More Engagements',
    SURVEY: 'Survey',
    THIRD_PARTY_FEEDBACK_METHOD_LINK: '3rd Party Feedback Method Link',
} as const;

export const AUTHORING_SECTION_NAMES = [
    AUTHORING_SECTION.HERO_BANNER,
    AUTHORING_SECTION.SUMMARY,
    AUTHORING_SECTION.DETAILS,
    AUTHORING_SECTION.PROVIDE_FEEDBACK,
    AUTHORING_SECTION.VIEW_RESULTS,
    AUTHORING_SECTION.SUBSCRIBE,
    AUTHORING_SECTION.MORE_ENGAGEMENTS,
    AUTHORING_SECTION.SURVEY,
    AUTHORING_SECTION.THIRD_PARTY_FEEDBACK_METHOD_LINK,
] as const;

export type AuthoringSectionName = (typeof AUTHORING_SECTION_NAMES)[number];

export type AuthoringSectionCompletion = Record<AuthoringSectionName, boolean>;
export type AuthoringSectionIncompleteLanguages = Record<AuthoringSectionName, string[]>;

export interface AuthoringSectionCompletionDebug {
    expectedFields: string[];
    completedFields: string[];
    isComplete: boolean;
}

export type AuthoringSectionCompletionDebugMap = Record<AuthoringSectionName, AuthoringSectionCompletionDebug>;

interface SectionFieldStatus {
    key: string;
    complete: boolean;
}

interface SectionComputationResult {
    complete: boolean;
    fields: SectionFieldStatus[];
}

interface CompletionComputationResult {
    completionBySection: AuthoringSectionCompletion;
    debugBySection: AuthoringSectionCompletionDebugMap;
}

type PerLanguageCompletion = Record<string, AuthoringSectionCompletion>;

export const REQUIRED_AUTHORING_SECTION_NAMES: readonly AuthoringSectionName[] = [
    AUTHORING_SECTION.HERO_BANNER,
    AUTHORING_SECTION.SUMMARY,
    AUTHORING_SECTION.DETAILS,
    AUTHORING_SECTION.PROVIDE_FEEDBACK,
];
const REQUIRED_SECTION_NAME_SET = new Set<AuthoringSectionName>(REQUIRED_AUTHORING_SECTION_NAMES);

const DEFAULT_SECTION_INCOMPLETE_LANGUAGES: AuthoringSectionIncompleteLanguages = {
    [AUTHORING_SECTION.HERO_BANNER]: [],
    [AUTHORING_SECTION.SUMMARY]: [],
    [AUTHORING_SECTION.DETAILS]: [],
    [AUTHORING_SECTION.PROVIDE_FEEDBACK]: [],
    [AUTHORING_SECTION.VIEW_RESULTS]: [],
    [AUTHORING_SECTION.SUBSCRIBE]: [],
    [AUTHORING_SECTION.MORE_ENGAGEMENTS]: [],
    [AUTHORING_SECTION.SURVEY]: [],
    [AUTHORING_SECTION.THIRD_PARTY_FEEDBACK_METHOD_LINK]: [],
};

const DEFAULT_SECTION_COMPLETION: AuthoringSectionCompletion = {
    [AUTHORING_SECTION.HERO_BANNER]: false,
    [AUTHORING_SECTION.SUMMARY]: false,
    [AUTHORING_SECTION.DETAILS]: false,
    [AUTHORING_SECTION.PROVIDE_FEEDBACK]: false,
    [AUTHORING_SECTION.VIEW_RESULTS]: false,
    [AUTHORING_SECTION.SUBSCRIBE]: false,
    [AUTHORING_SECTION.MORE_ENGAGEMENTS]: false,
    [AUTHORING_SECTION.SURVEY]: false,
    [AUTHORING_SECTION.THIRD_PARTY_FEEDBACK_METHOD_LINK]: false,
};

const DEFAULT_EXPECTED_FIELDS: Record<AuthoringSectionName, string[]> = {
    [AUTHORING_SECTION.HERO_BANNER]: ['name', 'banner_url', 'open_link'],
    [AUTHORING_SECTION.SUMMARY]: ['description_title', 'rich_description'],
    [AUTHORING_SECTION.DETAILS]: [
        'details_tabs.length',
        'details_tabs[n].label',
        'details_tabs[n].heading',
        'details_tabs[n].body',
    ],
    [AUTHORING_SECTION.PROVIDE_FEEDBACK]: ['feedback_heading', 'feedback_body'],
    [AUTHORING_SECTION.VIEW_RESULTS]: ['view_results_status_block_button_text', 'view_results_link'],
    [AUTHORING_SECTION.SUBSCRIBE]: [
        'subscribe_section_heading',
        'subscribe_section_description',
        'subscribe_consent_message',
    ],
    [AUTHORING_SECTION.MORE_ENGAGEMENTS]: ['more_engagements_heading'],
    [AUTHORING_SECTION.SURVEY]: ['survey'],
    [AUTHORING_SECTION.THIRD_PARTY_FEEDBACK_METHOD_LINK]: ['3rd_party_feedback_method_link'],
};

const DEFAULT_SECTION_DEBUG = AUTHORING_SECTION_NAMES.reduce((acc, sectionName) => {
    acc[sectionName] = {
        expectedFields: DEFAULT_EXPECTED_FIELDS[sectionName],
        completedFields: [],
        isComplete: false,
    };
    return acc;
}, {} as AuthoringSectionCompletionDebugMap);

const EMPTY_TRANSLATIONS: EngagementContentTranslations = {
    details_tabs: [],
    widgets: [],
    timeline_widgets: [],
    events_widgets: [],
    documents_widgets: [],
    image_widgets: [],
};

const hasText = (value: unknown): boolean => {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value !== 'string') {
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value).trim().length > 0;
        }

        try {
            // Handle rich text payloads that may arrive as objects instead of serialized JSON.
            const serialized = JSON.stringify(value);
            if (!serialized || serialized === '{}') {
                return false;
            }

            const parsed = JSON.parse(serialized);
            if (Array.isArray(parsed?.blocks)) {
                const combinedText = parsed.blocks
                    .map((block: { text?: string }) => (typeof block?.text === 'string' ? block.text : ''))
                    .join(' ')
                    .trim();
                return combinedText.length > 0;
            }

            return serialized.trim().length > 0;
        } catch {
            return false;
        }
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return false;
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed?.blocks)) {
            const combinedText = parsed.blocks
                .map((block: { text?: string }) => (typeof block?.text === 'string' ? block.text : ''))
                .join(' ')
                .trim();
            return combinedText.length > 0;
        }
    } catch {
        // If content is not DraftJS JSON, treat it as plain text.
    }

    return trimmed.length > 0;
};

const isBlockLinkComplete = (linkType?: string, internalLink?: string, externalLink?: string): boolean => {
    if (linkType === 'external') {
        return hasText(externalLink);
    }

    return hasText(internalLink);
};

const getLocalizedField = <K extends keyof EngagementTranslation>(
    base: string | undefined,
    translation: EngagementTranslation | null,
    key: K,
): string => {
    return (translation?.[key] as string | undefined) ?? base ?? '';
};

const getDetailsForLanguage = (
    detailsTabs: EngagementDetailsTab[],
    contentTranslations: EngagementContentTranslations,
    languageCode: string,
) => {
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    if (languageCode === defaultLanguageCode) {
        return detailsTabs;
    }

    const translationByTabId = new Map(
        contentTranslations.details_tabs.map((translation) => [translation.engagement_details_tab_id, translation]),
    );

    return detailsTabs.map((tab) => {
        const translated = translationByTabId.get(tab.id);

        if (!translated) {
            return {
                ...tab,
                label: '',
                heading: '',
                body: '',
            };
        }

        return {
            ...tab,
            label: translated.label ?? '',
            heading: translated.heading ?? '',
            body: translated.body ?? '',
        };
    });
};

const toDebug = (sectionResult: SectionComputationResult): AuthoringSectionCompletionDebug => {
    const expectedFields = sectionResult.fields.map((field) => field.key);
    const completedFields = sectionResult.fields.filter((field) => field.complete).map((field) => field.key);

    return {
        expectedFields,
        completedFields,
        isComplete: sectionResult.complete,
    };
};

const computeSectionCompletion = async (
    engagementId: number,
    languageCode: string,
    engagementPromise?: Promise<Engagement>,
    detailsTabsPromise?: Promise<EngagementDetailsTab[]>,
): Promise<CompletionComputationResult> => {
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const normalizedLanguageCode = languageCode || defaultLanguageCode;

    const engagement = await (engagementPromise ?? getEngagement(engagementId));

    const [translation, detailsTabs, contentTranslations] = await Promise.all([
        getEngagementTranslationByCode(engagementId, normalizedLanguageCode).catch(() => null),
        detailsTabsPromise ?? getDetailsTabs(engagementId).catch(() => []),
        normalizedLanguageCode === defaultLanguageCode
            ? Promise.resolve(EMPTY_TRANSLATIONS)
            : getEngagementContentTranslationsByCode(engagementId, normalizedLanguageCode).catch(
                  () => EMPTY_TRANSLATIONS,
              ),
    ]);

    const openBlock = engagement.status_block?.find((block) => block.survey_status === SUBMISSION_STATUS.OPEN);
    const viewResultsBlock = engagement.status_block?.find(
        (block) => block.survey_status === SUBMISSION_STATUS.VIEW_RESULTS,
    );

    const localizedDetails = getDetailsForLanguage(detailsTabs, contentTranslations, normalizedLanguageCode);

    const sectionFields: Record<AuthoringSectionName, SectionFieldStatus[]> = {
        [AUTHORING_SECTION.HERO_BANNER]: [
            {
                key: 'name',
                complete: hasText(getLocalizedField(engagement.name, translation, 'name')),
            },
            {
                key: 'banner_url',
                complete: hasText(engagement.banner_url),
            },
            {
                key: 'open_link',
                complete: isBlockLinkComplete(openBlock?.link_type, openBlock?.internal_link, openBlock?.external_link),
            },
        ],
        [AUTHORING_SECTION.SUMMARY]: [
            {
                key: 'description_title',
                complete: hasText(getLocalizedField(engagement.description_title, translation, 'description_title')),
            },
            {
                key: 'rich_description',
                complete: hasText(getLocalizedField(engagement.rich_description, translation, 'rich_description')),
            },
        ],
        [AUTHORING_SECTION.DETAILS]:
            localizedDetails.length > 0
                ? localizedDetails.flatMap((tab, index) => [
                      {
                          key: `details_tabs[${index}].label`,
                          complete: hasText(tab.label),
                      },
                      {
                          key: `details_tabs[${index}].heading`,
                          complete: hasText(tab.heading),
                      },
                      {
                          key: `details_tabs[${index}].body`,
                          complete: hasText(tab.body),
                      },
                  ])
                : [
                      {
                          key: 'details_tabs.length',
                          complete: false,
                      },
                  ],
        [AUTHORING_SECTION.PROVIDE_FEEDBACK]: [
            {
                key: 'feedback_heading',
                complete: hasText(getLocalizedField(engagement.feedback_heading, translation, 'feedback_heading')),
            },
            {
                key: 'feedback_body',
                complete: hasText(getLocalizedField(engagement.feedback_body, translation, 'feedback_body')),
            },
        ],
        [AUTHORING_SECTION.VIEW_RESULTS]: [
            {
                key: 'view_results_status_block_button_text',
                complete: hasText(
                    getLocalizedField(
                        viewResultsBlock?.button_text,
                        translation,
                        'view_results_status_block_button_text',
                    ),
                ),
            },
            {
                key: 'view_results_link',
                complete: isBlockLinkComplete(
                    viewResultsBlock?.link_type,
                    viewResultsBlock?.internal_link,
                    viewResultsBlock?.external_link,
                ),
            },
        ],
        [AUTHORING_SECTION.SUBSCRIBE]: [
            {
                key: 'subscribe_section_heading',
                complete: hasText(
                    getLocalizedField(engagement.subscribe_section_heading, translation, 'subscribe_section_heading'),
                ),
            },
            {
                key: 'subscribe_section_description',
                complete: hasText(
                    getLocalizedField(
                        engagement.subscribe_section_description,
                        translation,
                        'subscribe_section_description',
                    ),
                ),
            },
            {
                key: 'subscribe_consent_message',
                complete: hasText(
                    getLocalizedField(
                        engagement.subscribe_consent_message ?? engagement.consent_message,
                        translation,
                        'subscribe_consent_message',
                    ) ||
                        getLocalizedField(
                            engagement.subscribe_consent_message ?? engagement.consent_message,
                            translation,
                            'consent_message',
                        ),
                ),
            },
        ],
        [AUTHORING_SECTION.MORE_ENGAGEMENTS]: [
            {
                key: 'more_engagements_heading',
                complete: hasText(
                    getLocalizedField(engagement.more_engagements_heading, translation, 'more_engagements_heading'),
                ),
            },
        ],
        [AUTHORING_SECTION.SURVEY]: [
            {
                key: 'survey',
                complete: engagement.surveys.length > 0,
            },
        ],
        [AUTHORING_SECTION.THIRD_PARTY_FEEDBACK_METHOD_LINK]: [
            {
                key: '3rd_party_feedback_method_link',
                complete: false,
            },
        ],
    };

    const sectionComputation: Record<AuthoringSectionName, SectionComputationResult> = AUTHORING_SECTION_NAMES.reduce(
        (acc, sectionName) => {
            const fields = sectionFields[sectionName];
            const complete =
                sectionName === AUTHORING_SECTION.DETAILS
                    ? localizedDetails.length > 0 && fields.every((field) => field.complete)
                    : fields.every((field) => field.complete);

            acc[sectionName] = {
                complete,
                fields,
            };

            return acc;
        },
        {} as Record<AuthoringSectionName, SectionComputationResult>,
    );

    const completionBySection: AuthoringSectionCompletion = AUTHORING_SECTION_NAMES.reduce((acc, sectionName) => {
        acc[sectionName] = sectionComputation[sectionName].complete;
        return acc;
    }, {} as AuthoringSectionCompletion);

    const debugBySection: AuthoringSectionCompletionDebugMap = AUTHORING_SECTION_NAMES.reduce((acc, sectionName) => {
        acc[sectionName] = toDebug(sectionComputation[sectionName]);
        return acc;
    }, {} as AuthoringSectionCompletionDebugMap);

    return {
        completionBySection,
        debugBySection,
    };
};

interface UseAuthoringSectionCompletionOptions {
    engagementId: number;
    languageCode: string;
    selectedLanguageCodes?: string[];
    engagementPromise?: Promise<Engagement>;
    detailsTabsPromise?: Promise<EngagementDetailsTab[]>;
    refreshToken?: unknown;
}

const normalizeLanguageCodes = (languageCode: string, selectedLanguageCodes?: string[]) => {
    const fallback = (languageCode || 'en').toLowerCase();
    const sourceCodes = selectedLanguageCodes && selectedLanguageCodes.length > 0 ? selectedLanguageCodes : [fallback];
    return Array.from(new Set(sourceCodes.map((code) => code.toLowerCase()).filter((code) => code.length > 0)));
};

const aggregateSectionCompletion = (
    perLanguageCompletion: PerLanguageCompletion,
    currentLanguageCode: string,
    normalizedLanguageCodes: string[],
) => {
    const completionBySection: AuthoringSectionCompletion = { ...DEFAULT_SECTION_COMPLETION };
    const incompleteLanguageCodesBySection: AuthoringSectionIncompleteLanguages = {
        ...DEFAULT_SECTION_INCOMPLETE_LANGUAGES,
    };

    for (const sectionName of AUTHORING_SECTION_NAMES) {
        const incompleteLanguageCodes = normalizedLanguageCodes.filter(
            (code) => perLanguageCompletion[code]?.[sectionName] !== true,
        );

        incompleteLanguageCodesBySection[sectionName] = incompleteLanguageCodes;

        if (REQUIRED_SECTION_NAME_SET.has(sectionName)) {
            completionBySection[sectionName] = incompleteLanguageCodes.length === 0;
            continue;
        }

        completionBySection[sectionName] = perLanguageCompletion[currentLanguageCode]?.[sectionName] ?? false;
    }

    return {
        completionBySection,
        incompleteLanguageCodesBySection,
    };
};

export const useAuthoringSectionCompletion = ({
    engagementId,
    languageCode,
    selectedLanguageCodes,
    engagementPromise,
    detailsTabsPromise,
    refreshToken,
}: UseAuthoringSectionCompletionOptions) => {
    const [completionBySection, setCompletionBySection] =
        useState<AuthoringSectionCompletion>(DEFAULT_SECTION_COMPLETION);
    const [debugBySection, setDebugBySection] = useState<AuthoringSectionCompletionDebugMap>(DEFAULT_SECTION_DEBUG);
    const [incompleteLanguageCodesBySection, setIncompleteLanguageCodesBySection] =
        useState<AuthoringSectionIncompleteLanguages>(DEFAULT_SECTION_INCOMPLETE_LANGUAGES);
    const [isLoading, setIsLoading] = useState(true);
    const normalizedCurrentLanguageCode = (languageCode || 'en').toLowerCase();
    const normalizedLanguageCodesKey = useMemo(
        () => normalizeLanguageCodes(normalizedCurrentLanguageCode, selectedLanguageCodes).join('|'),
        [normalizedCurrentLanguageCode, selectedLanguageCodes],
    );
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        if (!Number.isFinite(engagementId) || engagementId <= 0) {
            setCompletionBySection(DEFAULT_SECTION_COMPLETION);
            setDebugBySection(DEFAULT_SECTION_DEBUG);
            setIncompleteLanguageCodesBySection(DEFAULT_SECTION_INCOMPLETE_LANGUAGES);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const normalizedLanguageCodes =
            normalizedLanguageCodesKey.length > 0
                ? normalizedLanguageCodesKey.split('|')
                : [normalizedCurrentLanguageCode];
        const sharedDetailsTabsPromise = detailsTabsPromise ?? getDetailsTabs(engagementId).catch(() => []);

        void Promise.all(
            normalizedLanguageCodes.map(async (code) => {
                const result = await computeSectionCompletion(
                    engagementId,
                    code,
                    engagementPromise,
                    sharedDetailsTabsPromise,
                );
                return [code, result] as const;
            }),
        )
            .then((entries) => {
                if (!cancelled) {
                    const perLanguageCompletion = Object.fromEntries(
                        entries.map(([code, result]) => [code, result.completionBySection]),
                    ) as PerLanguageCompletion;

                    const currentLanguageResult =
                        entries.find(([code]) => code === normalizedCurrentLanguageCode)?.[1] ?? entries[0]?.[1];

                    const {
                        completionBySection: aggregatedCompletion,
                        incompleteLanguageCodesBySection: aggregatedIncomplete,
                    } = aggregateSectionCompletion(
                        perLanguageCompletion,
                        normalizedCurrentLanguageCode,
                        normalizedLanguageCodes,
                    );

                    setCompletionBySection(aggregatedCompletion);
                    setDebugBySection(currentLanguageResult?.debugBySection ?? DEFAULT_SECTION_DEBUG);
                    setIncompleteLanguageCodesBySection(aggregatedIncomplete);
                }
            })
            .catch((error: unknown) => {
                if (
                    error instanceof Response &&
                    error.status === 302 &&
                    error.headers.get('Location') === '/manage/unauthorized'
                ) {
                    navigate('/manage/unauthorized', { replace: true });
                }
                console.debug('[AuthoringSectionCompletionDebug] compute failed', {
                    engagementId,
                    languageCode,
                    error: error instanceof Error ? error.message : String(error),
                });
                if (!cancelled) {
                    setCompletionBySection(DEFAULT_SECTION_COMPLETION);
                    setDebugBySection(DEFAULT_SECTION_DEBUG);
                    setIncompleteLanguageCodesBySection(DEFAULT_SECTION_INCOMPLETE_LANGUAGES);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        engagementId,
        normalizedCurrentLanguageCode,
        normalizedLanguageCodesKey,
        engagementPromise,
        detailsTabsPromise,
        refreshToken,
    ]);

    const requiredSectionsComplete = useMemo(
        () => REQUIRED_AUTHORING_SECTION_NAMES.every((sectionName) => completionBySection[sectionName]),
        [completionBySection],
    );

    return {
        completionBySection,
        debugBySection,
        incompleteLanguageCodesBySection,
        isLoading,
        requiredSectionsComplete,
    };
};
