import { useEffect, useMemo, useState } from 'react';
import {
    ResourceLockRecord,
    ResourceLocks,
    findScopedSectionLock,
    SECTION_AUTHORING_BANNER,
    SECTION_AUTHORING_DETAILS,
    SECTION_AUTHORING_FEEDBACK,
    SECTION_AUTHORING_MORE,
    SECTION_AUTHORING_SUBSCRIBE,
    SECTION_AUTHORING_SUMMARY,
} from 'services/resourceLockService';
import { useResourceLocks } from 'services/resourceLockService/useResourceLocks';
import { getLanguageIdByCode } from 'services/engagementContentTranslationService';
import { Language } from 'models/language';
import {
    AUTHORING_SECTION,
    AUTHORING_SECTION_NAMES,
    AuthoringSectionName,
} from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';

const LOCK_POLL_INTERVAL_MS = 15000;

type LockTarget = {
    sectionKey: string;
    languageScoped: boolean;
};

const LOCK_TARGET_BY_SECTION: Record<AuthoringSectionName, LockTarget | null> = {
    [AUTHORING_SECTION.HERO_BANNER]: { sectionKey: SECTION_AUTHORING_BANNER, languageScoped: true },
    [AUTHORING_SECTION.SUMMARY]: { sectionKey: SECTION_AUTHORING_SUMMARY, languageScoped: true },
    [AUTHORING_SECTION.DETAILS]: { sectionKey: SECTION_AUTHORING_DETAILS, languageScoped: true },
    [AUTHORING_SECTION.PROVIDE_FEEDBACK]: { sectionKey: SECTION_AUTHORING_FEEDBACK, languageScoped: true },
    // View Results currently has no independently lock-scoped fields.
    [AUTHORING_SECTION.VIEW_RESULTS]: null,
    [AUTHORING_SECTION.SUBSCRIBE]: { sectionKey: SECTION_AUTHORING_SUBSCRIBE, languageScoped: true },
    [AUTHORING_SECTION.MORE_ENGAGEMENTS]: { sectionKey: SECTION_AUTHORING_MORE, languageScoped: true },
    // Survey and third-party link are configured in the feedback section and share its lock scope.
    [AUTHORING_SECTION.SURVEY]: { sectionKey: SECTION_AUTHORING_FEEDBACK, languageScoped: true },
    [AUTHORING_SECTION.THIRD_PARTY_FEEDBACK_METHOD_LINK]: {
        sectionKey: SECTION_AUTHORING_FEEDBACK,
        languageScoped: true,
    },
};

const SECTION_BY_PAGE: Record<string, AuthoringSectionName> = {
    banner: AUTHORING_SECTION.HERO_BANNER,
    summary: AUTHORING_SECTION.SUMMARY,
    details: AUTHORING_SECTION.DETAILS,
    feedback: AUTHORING_SECTION.PROVIDE_FEEDBACK,
    results: AUTHORING_SECTION.VIEW_RESULTS,
    subscribe: AUTHORING_SECTION.SUBSCRIBE,
    more: AUTHORING_SECTION.MORE_ENGAGEMENTS,
};

export const getAuthoringSectionNameByPage = (pageName?: string): AuthoringSectionName | null => {
    if (!pageName) {
        return null;
    }

    return SECTION_BY_PAGE[pageName] ?? null;
};

export const getLockTargetBySectionName = (sectionName: AuthoringSectionName): LockTarget | null => {
    return LOCK_TARGET_BY_SECTION[sectionName];
};

export const findSectionLock = ({
    locks,
    sectionName,
    languageId,
}: {
    locks?: ResourceLocks | null;
    sectionName: AuthoringSectionName;
    languageId?: number;
}): ResourceLockRecord | null => {
    if (!locks?.locks?.length) {
        return null;
    }

    const target = getLockTargetBySectionName(sectionName);
    if (!target) {
        return null;
    }

    return findScopedSectionLock({
        locks,
        sectionKey: target.sectionKey,
        languageId,
        languageScoped: target.languageScoped,
    });
};

export const useResourceSectionLocks = ({
    engagementId,
    languageCode,
    languageOptions,
    initialLocksPromise,
    surveyUsesDedicatedLock = false,
    pollIntervalMs = LOCK_POLL_INTERVAL_MS,
}: {
    engagementId: number;
    languageCode: string;
    languageOptions?: Pick<Language, 'id' | 'code'>[];
    initialLocksPromise?: Promise<ResourceLocks>;
    surveyUsesDedicatedLock?: boolean;
    pollIntervalMs?: number;
}) => {
    const [languageId, setLanguageId] = useState<number | undefined>(undefined);
    const { locks, isLoading, refreshLocks } = useResourceLocks({
        resourceId: engagementId,
        initialLocksPromise,
        pollIntervalMs,
    });

    useEffect(() => {
        let cancelled = false;

        if (languageOptions !== undefined) {
            const normalizedLanguageCode = languageCode.toLowerCase();
            const selectedLanguage = languageOptions.find(
                (language) => language.code.toLowerCase() === normalizedLanguageCode,
            );

            if (selectedLanguage && selectedLanguage.id > 0) {
                setLanguageId(selectedLanguage.id);
                return () => {
                    cancelled = true;
                };
            }
        }

        const resolveLanguageId = async () => {
            try {
                const resolvedLanguageId = await getLanguageIdByCode(languageCode);
                if (!cancelled) {
                    setLanguageId(resolvedLanguageId);
                }
            } catch {
                if (!cancelled) {
                    setLanguageId(undefined);
                }
            }
        };

        void resolveLanguageId();

        return () => {
            cancelled = true;
        };
    }, [languageCode, languageOptions]);

    const locksBySection = useMemo(() => {
        const entries = AUTHORING_SECTION_NAMES.map((sectionName) => {
            if (sectionName === AUTHORING_SECTION.SURVEY && surveyUsesDedicatedLock) {
                return [sectionName, null] as const;
            }
            return [
                sectionName,
                findSectionLock({
                    locks,
                    sectionName,
                    languageId,
                }),
            ] as const;
        });

        return Object.fromEntries(entries) as Record<AuthoringSectionName, ResourceLockRecord | null>;
    }, [languageId, locks, surveyUsesDedicatedLock]);

    return {
        locks,
        isLoading,
        languageId,
        locksBySection,
        refreshLocks,
    };
};
