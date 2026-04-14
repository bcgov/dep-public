import { USER_ROLES } from 'services/userService/constants';
import { ROUTES, getPath } from 'routes/routes';

export interface AuthoringRoute {
    name: string;
    path: string;
    base: string;
    authenticated: boolean;
    allowedRoles: string[];
    required?: boolean;
}

export const getAuthoringRoutes = (engagementId: number): AuthoringRoute[] => [
    {
        name: 'Engagement Home',
        path: getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId }),
        base: `/engagements`,
        authenticated: false,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: 'Hero Banner',
        path: getPath(ROUTES.AUTHORING_BANNER, { engagementId }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: 'Summary',
        path: getPath(ROUTES.AUTHORING_SUMMARY, { engagementId }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: 'Details',
        path: getPath(ROUTES.AUTHORING_DETAILS, { engagementId }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: 'Provide Feedback',
        path: getPath(ROUTES.AUTHORING_FEEDBACK, { engagementId }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: true,
    },
    {
        name: 'View Results',
        path: getPath(ROUTES.AUTHORING_RESULTS, { engagementId }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: false,
    },
    {
        name: 'Subscribe',
        path: getPath(ROUTES.AUTHORING_SUBSCRIBE, { engagementId }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: false,
    },
    {
        name: 'More Engagements',
        path: getPath(ROUTES.AUTHORING_MORE, { engagementId }),
        base: `/engagements`,
        authenticated: true,
        allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
        required: false,
    },
];
