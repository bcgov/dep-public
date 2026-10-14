import { useContext } from 'react';
import { AuthoringFormContext } from 'components/engagement/admin/create/authoring/AuthoringFormContext';
import { getLanguageIdByCode } from 'services/engagementContentTranslationService';
import {
    acquireEngagementSectionLock,
    LOCK_TOKEN_HEADER,
    releaseLock,
    SECTION_AUTHORING_DETAILS,
    SECTION_AUTHORING_FEEDBACK,
    SECTION_AUTHORING_SUMMARY,
} from 'services/resourceLockService';
import { RequestHeaders } from 'services/type';
import { Widget, WidgetLocation } from 'models/widget';
import { WidgetDrawerContext } from './WidgetDrawerContext';

const getSectionKeyForWidget = (location: WidgetLocation): string => {
    switch (location) {
        case WidgetLocation.Summary:
            return SECTION_AUTHORING_SUMMARY;
        case WidgetLocation.Details:
            return SECTION_AUTHORING_DETAILS;
        case WidgetLocation.Feedback:
            return SECTION_AUTHORING_FEEDBACK;
        default:
            throw new Error(`Unsupported widget location ${location}`);
    }
};

export const useWidgetSectionLockRequest = (
    widget: Pick<Widget, 'id' | 'engagement_id' | 'location'> | null | undefined,
    languageCode: string,
) => {
    const authoringLock = useContext(AuthoringFormContext);
    const { widgets } = useContext(WidgetDrawerContext);
    const sectionWidgetIds = new Set([
        ...(widget ? [widget.id] : []),
        ...widgets.filter((candidate) => candidate.location === widget?.location).map((candidate) => candidate.id),
    ]);
    const filterWidgetTranslations = <T extends { widget_id: number }>(translations: T[]) => {
        if (!widget) {
            throw new Error('Cannot filter translations without a widget context');
        }
        return translations.filter((translation) => sectionWidgetIds.has(translation.widget_id));
    };

    const withWidgetLock = async <T>(request: (headers: RequestHeaders) => Promise<T>): Promise<T> => {
        if (!widget) {
            throw new Error('Cannot update a widget without its engagement context');
        }

        const sectionKey = getSectionKeyForWidget(widget.location);
        const languageId = authoringLock?.languageId ?? (await getLanguageIdByCode(languageCode));
        const hasMatchingActiveLock =
            typeof authoringLock?.activeLockToken === 'string' &&
            authoringLock.activeLockToken.length > 0 &&
            authoringLock.activeLockSectionKey === sectionKey &&
            authoringLock.activeLockLanguageId === languageId;
        let lockToken = hasMatchingActiveLock ? authoringLock.activeLockToken : undefined;

        if (!lockToken) {
            const lock = await acquireEngagementSectionLock({
                engagementId: widget.engagement_id,
                sectionKey,
                languageId,
            });
            lockToken = lock.lock_token;
        }

        const acquiredLockToken = hasMatchingActiveLock ? undefined : lockToken;
        try {
            return await request({ [LOCK_TOKEN_HEADER]: lockToken });
        } finally {
            if (acquiredLockToken) {
                try {
                    await releaseLock(acquiredLockToken);
                } catch (error) {
                    console.warn('Failed to release widget edit lock', error);
                }
            }
        }
    };

    return { filterWidgetTranslations, withWidgetLock };
};
