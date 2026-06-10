import { EngagementTranslation, getEngagementTranslationByCode } from 'services/engagementService';
import {
    EngagementContentTranslations,
    EngagementDetailsTabTranslation,
    getEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';

const emptyContentTranslations = (): EngagementContentTranslations => ({
    details_tabs: [],
    widgets: [],
    timeline_widgets: [],
    events_widgets: [],
    documents_widgets: [],
    image_widgets: [],
});

export type TranslationSource = 'translated' | 'default' | 'base' | 'literal' | 'empty';

export type TranslationResolver<T> = {
    value: T | null;
    source: TranslationSource;
};

export interface TranslationBundle {
    engagementId: number;
    activeLanguageCode: string;
    defaultLanguageCode: string;
    currentTranslation: EngagementTranslation | null;
    defaultTranslation: EngagementTranslation | null;
    currentContentTranslations: EngagementContentTranslations;
    defaultContentTranslations: EngagementContentTranslations;
    hasCurrentTranslation: boolean;
    hasDefaultTranslation: boolean;
}

const hasValue = <T>(value: T | null | undefined): boolean => {
    if (value === null || value === undefined) {
        return false;
    }
    return typeof value === 'string' ? value.trim().length > 0 : true;
};

export const resolveTranslationValue = <T>({
    translatedValue,
    defaultValue,
    baseValue,
    literalFallback,
}: {
    translatedValue?: T | null;
    defaultValue?: T | null;
    baseValue?: T | null;
    literalFallback?: T | null;
}): TranslationResolver<T> => {
    if (hasValue(translatedValue)) {
        return { value: translatedValue ?? null, source: 'translated' };
    }

    if (hasValue(defaultValue)) {
        return { value: defaultValue ?? null, source: 'default' };
    }

    if (hasValue(baseValue)) {
        return { value: baseValue ?? null, source: 'base' };
    }

    if (hasValue(literalFallback)) {
        return { value: literalFallback ?? null, source: 'literal' };
    }

    return { value: null, source: 'empty' };
};

export const buildTranslationBundle = async ({
    engagementId,
    activeLanguageCode,
    defaultLanguageCode,
}: {
    engagementId: number;
    activeLanguageCode: string;
    defaultLanguageCode: string;
}): Promise<TranslationBundle> => {
    const normalizedActiveLanguageCode = activeLanguageCode.toLowerCase();
    const normalizedDefaultLanguageCode = defaultLanguageCode.toLowerCase();

    const currentTranslationPromise = getEngagementTranslationByCode(engagementId, normalizedActiveLanguageCode).catch(
        () => null,
    );
    const currentContentTranslationsPromise = getEngagementContentTranslationsByCode(
        engagementId,
        normalizedActiveLanguageCode,
    ).catch(() => emptyContentTranslations());

    const defaultTranslationPromise =
        normalizedActiveLanguageCode === normalizedDefaultLanguageCode
            ? currentTranslationPromise
            : getEngagementTranslationByCode(engagementId, normalizedDefaultLanguageCode).catch(() => null);
    const defaultContentTranslationsPromise =
        normalizedActiveLanguageCode === normalizedDefaultLanguageCode
            ? currentContentTranslationsPromise
            : getEngagementContentTranslationsByCode(engagementId, normalizedDefaultLanguageCode).catch(() =>
                  emptyContentTranslations(),
              );

    const [currentTranslation, defaultTranslation, currentContentTranslations, defaultContentTranslations] =
        await Promise.all([
            currentTranslationPromise,
            defaultTranslationPromise,
            currentContentTranslationsPromise,
            defaultContentTranslationsPromise,
        ]);

    return {
        engagementId,
        activeLanguageCode: normalizedActiveLanguageCode,
        defaultLanguageCode: normalizedDefaultLanguageCode,
        currentTranslation,
        defaultTranslation,
        currentContentTranslations,
        defaultContentTranslations,
        hasCurrentTranslation: Boolean(currentTranslation),
        hasDefaultTranslation: Boolean(defaultTranslation),
    };
};

const getDetailsTabTranslation = ({
    byId,
    bySlug,
    tab,
}: {
    byId: Map<number, EngagementDetailsTabTranslation>;
    bySlug: Map<string, EngagementDetailsTabTranslation>;
    tab: EngagementDetailsTab;
}) => {
    return byId.get(tab.id) ?? bySlug.get(tab.slug);
};

export const resolveDetailsTabs = ({
    tabs,
    translationBundle,
}: {
    tabs: EngagementDetailsTab[];
    translationBundle: TranslationBundle;
}): EngagementDetailsTab[] => {
    const currentTranslations = translationBundle.currentContentTranslations.details_tabs ?? [];
    const defaultTranslations = translationBundle.defaultContentTranslations.details_tabs ?? [];

    const currentById = new Map(
        currentTranslations.map((translation) => [translation.engagement_details_tab_id, translation]),
    );
    const currentBySlug = new Map(
        currentTranslations
            .filter((translation) => Boolean(translation.slug))
            .map((translation) => [translation.slug as string, translation]),
    );

    const defaultById = new Map(
        defaultTranslations.map((translation) => [translation.engagement_details_tab_id, translation]),
    );
    const defaultBySlug = new Map(
        defaultTranslations
            .filter((translation) => Boolean(translation.slug))
            .map((translation) => [translation.slug as string, translation]),
    );

    return tabs
        .map((tab) => {
            const currentTranslation = getDetailsTabTranslation({ byId: currentById, bySlug: currentBySlug, tab });
            const defaultTranslation = getDetailsTabTranslation({ byId: defaultById, bySlug: defaultBySlug, tab });

            const resolvedLabel = currentTranslation?.label ?? defaultTranslation?.label ?? tab.label;

            const resolvedHeading = currentTranslation?.heading ?? defaultTranslation?.heading ?? tab.heading;

            const resolvedBody = currentTranslation?.body ?? defaultTranslation?.body ?? tab.body;

            return {
                ...tab,
                label: resolvedLabel ?? '',
                heading: resolvedHeading ?? '',
                body: resolvedBody ?? '',
            };
        })
        .sort((left, right) => left.sort_index - right.sort_index);
};
