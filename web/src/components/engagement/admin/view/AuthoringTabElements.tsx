import { AuthoringValue } from './types';
import { getPath, ROUTES } from 'routes/routes';

export const getDefaultAuthoringTabValues = (
    type: string,
    engagementId: number | string,
    languageCode: string = 'en',
): AuthoringValue[] => {
    if ('sections' === type) {
        // Return the default "section" items
        return [
            {
                id: 1,
                title: 'Hero Banner',
                link: getPath(ROUTES.AUTHORING_BANNER, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 2,
                title: 'Summary',
                link: getPath(ROUTES.AUTHORING_SUMMARY, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 3,
                title: 'Details',
                link: getPath(ROUTES.AUTHORING_DETAILS, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 4,
                title: 'Provide Feedback',
                link: getPath(ROUTES.AUTHORING_FEEDBACK, { engagementId, languageCode }),
                required: true,
                completed: false,
            },
            {
                id: 5,
                title: 'View Results',
                link: getPath(ROUTES.AUTHORING_RESULTS, { engagementId, languageCode }),
                required: false,
                completed: false,
            },
            {
                id: 6,
                title: 'Subscribe',
                link: getPath(ROUTES.AUTHORING_SUBSCRIBE, { engagementId, languageCode }),
                required: false,
                completed: false,
            },
            {
                id: 7,
                title: 'More Engagements',
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
                title: 'Survey',
                link: `#`,
                required: true,
                completed: false,
            },
            {
                id: 102,
                title: '3rd Party Feedback Method Link',
                link: `#`,
                required: true,
                completed: false,
            },
        ];
    }
};
