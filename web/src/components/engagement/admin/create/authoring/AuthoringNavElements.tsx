import { USER_ROLES } from 'services/userService/constants';
import { ROUTES, getPath } from 'routes/routes';
import { AUTHORING_SECTION, AuthoringSectionName } from './useAuthoringSectionCompletion';

type AuthoringRouteName = 'Engagement Home' | AuthoringSectionName;

export interface AuthoringRoute {
    name: AuthoringRouteName;
    path: string;
    base: string;
    authenticated: boolean;
    allowedRoles: string[];
    required?: boolean;
}

export const getAuthoringRoutes = (engagementId: number, languageCode: string = 'en'): AuthoringRoute[] => [
    {
        name: 'Engagement Home',
        path: getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId }),
        base: `/engagements`,
        authenticated: false,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: AUTHORING_SECTION.HERO_BANNER,
        path: getPath(ROUTES.AUTHORING_BANNER, { engagementId, languageCode }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: AUTHORING_SECTION.SUMMARY,
        path: getPath(ROUTES.AUTHORING_SUMMARY, { engagementId, languageCode }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: AUTHORING_SECTION.DETAILS,
        path: getPath(ROUTES.AUTHORING_DETAILS, { engagementId, languageCode }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: AUTHORING_SECTION.PROVIDE_FEEDBACK,
        path: getPath(ROUTES.AUTHORING_FEEDBACK, { engagementId, languageCode }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: AUTHORING_SECTION.VIEW_RESULTS,
        path: getPath(ROUTES.AUTHORING_RESULTS, { engagementId, languageCode }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: false,
    },
    {
        name: AUTHORING_SECTION.SUBSCRIBE,
        path: getPath(ROUTES.AUTHORING_SUBSCRIBE, { engagementId, languageCode }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: false,
    },
    {
        name: AUTHORING_SECTION.MORE_ENGAGEMENTS,
        path: getPath(ROUTES.AUTHORING_MORE, { engagementId, languageCode }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: false,
    },
];
