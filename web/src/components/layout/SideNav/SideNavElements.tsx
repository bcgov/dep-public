import { USER_ROLES } from 'services/userService/constants';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import {
    faHouse,
    faPeopleArrows,
    faSquarePollHorizontal,
    faTags,
    faGlobe,
    faUserGear,
    faHouseUser,
    faMessagePen,
} from '@fortawesome/pro-regular-svg-icons';
import { ROUTES, getPath } from 'routes/routes';
export interface Route {
    name: string;
    path: string;
    base: string;
    authenticated: boolean;
    allowedRoles: string[];
    icon?: IconDefinition;
    customComponent?: React.ReactNode;
}

export const Routes: Route[] = [
    { name: 'Home', path: getPath(ROUTES.HOME), base: '/', authenticated: false, allowedRoles: [], icon: faHouse },
    {
        name: 'Engagements',
        path: getPath(ROUTES.ENGAGEMENTS),
        base: getPath(ROUTES.ENGAGEMENTS),
        authenticated: false,
        allowedRoles: [],
        icon: faPeopleArrows,
    },
    {
        name: 'Surveys',
        path: getPath(ROUTES.SURVEYS),
        base: getPath(ROUTES.SURVEYS),
        authenticated: false,
        allowedRoles: [],
        icon: faSquarePollHorizontal,
    },
    {
        name: 'Metadata',
        path: getPath(ROUTES.METADATA_MANAGEMENT),
        base: getPath(ROUTES.METADATA_MANAGEMENT),
        authenticated: true,
        allowedRoles: [USER_ROLES.MANAGE_METADATA],
        icon: faTags,
    },
    {
        name: 'Languages',
        path: getPath(ROUTES.LANGUAGES),
        base: 'languages',
        authenticated: true,
        allowedRoles: [USER_ROLES.VIEW_LANGUAGES],
        icon: faGlobe,
    },
    {
        name: 'User Admin',
        path: getPath(ROUTES.USER_MANAGEMENT),
        base: 'usermanagement',
        authenticated: true,
        allowedRoles: [USER_ROLES.VIEW_USERS],
        icon: faUserGear,
    },
    {
        name: 'Tenant Admin',
        path: getPath(ROUTES.TENANT_ADMIN),
        base: 'tenantadmin',
        authenticated: true,
        allowedRoles: [USER_ROLES.SUPER_ADMIN],
        icon: faHouseUser,
    },
    {
        name: 'Site Feedback',
        path: getPath(ROUTES.FEEDBACK),
        base: 'feedback',
        authenticated: true,
        allowedRoles: [USER_ROLES.VIEW_FEEDBACKS],
        icon: faMessagePen,
    },
];
