import { EngagementLoaderPublicData } from 'components/engagement/public/view/EngagementLoaderPublic';
import { getPath, ROUTES } from './routes';
import { ViewSwitcherHandle } from './ViewSwitcherHandle';

const publicEngagementViewSwitcher: ViewSwitcherHandle = async (data) => {
    const loaderData = data as EngagementLoaderPublicData;
    const engagement = await loaderData.engagement;
    return {
        label: 'Edit Engagement',
        href: getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId: engagement.id }),
    };
};

const publicDashboardViewSwitcher: ViewSwitcherHandle = async (_data, params) => {
    return {
        label: 'Admin Dashboard View',
        href: getPath(ROUTES.SLUG_DASHBOARD, {
            slug: params.slug || '',
            dashboardType: params.dashboardType || '',
        }),
    };
};

const publicCommentsViewSwitcher: ViewSwitcherHandle = async (_data, params) => {
    return {
        label: 'Admin Comments View',
        href: getPath(ROUTES.SLUG_COMMENTS_DASHBOARD, {
            slug: params.slug || '',
            dashboardType: params.dashboardType || '',
        }),
    };
};

export const publicEngagementHandle = { viewSwitcher: publicEngagementViewSwitcher };
export const publicDashboardHandle = { viewSwitcher: publicDashboardViewSwitcher };
export const publicCommentsHandle = { viewSwitcher: publicCommentsViewSwitcher };
