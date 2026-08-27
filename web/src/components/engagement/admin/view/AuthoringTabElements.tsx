import { AuthoringTabValue } from './types';
import { getPath, ROUTES } from 'routes/routes';
import { AUTHORING_SECTION } from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';

export const getDefaultAuthoringTabValues = (
    type: 'sections' | 'feedback',
    engagementId: number | string,
    languageCode: string = 'en',
): AuthoringTabValue[] => {
    if ('sections' === type) {
        // Return the default "section" items
        return [
            {
                id: 1,
                title: AUTHORING_SECTION.HERO_BANNER,
                link: getPath(ROUTES.AUTHORING_BANNER, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 2,
                title: AUTHORING_SECTION.SUMMARY,
                link: getPath(ROUTES.AUTHORING_SUMMARY, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 3,
                title: AUTHORING_SECTION.DETAILS,
                link: getPath(ROUTES.AUTHORING_DETAILS, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 4,
                title: AUTHORING_SECTION.PROVIDE_FEEDBACK,
                link: getPath(ROUTES.AUTHORING_FEEDBACK, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 5,
                title: AUTHORING_SECTION.VIEW_RESULTS,
                link: getPath(ROUTES.AUTHORING_RESULTS, { engagementId, languageCode }),
                required: false,
                completed: false,
            },
            {
                id: 6,
                title: AUTHORING_SECTION.SUBSCRIBE,
                link: getPath(ROUTES.AUTHORING_SUBSCRIBE, { engagementId, languageCode }),
                required: false,
                completed: false,
            },
            {
                id: 7,
                title: AUTHORING_SECTION.MORE_ENGAGEMENTS,
                link: getPath(ROUTES.AUTHORING_MORE, { engagementId, languageCode }),
                required: false,
                completed: false,
            },
        ];
    } else {
        // Return the default "feedback" items
        return [
            {
                id: 101,
                title: AUTHORING_SECTION.SURVEY,
                link: getPath(ROUTES.AUTHORING_FEEDBACK, { engagementId, languageCode }) + '#survey',
                required: true,
                completed: false,
            },
            {
                id: 102,
                title: AUTHORING_SECTION.THIRD_PARTY_FEEDBACK_METHOD_LINK,
                link: getPath(ROUTES.AUTHORING_FEEDBACK, { engagementId, languageCode }) + '#third-party-feedback',
                required: true,
                completed: false,
            },
        ];
    }
};
