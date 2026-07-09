import { EngagementLoaderPublicData } from 'components/engagement/public/view/EngagementLoaderPublic';
import { getPath, ROUTES } from './routes';
import { ViewSwitcherHandle } from './ViewSwitcherHandle';

const publicEngagementViewSwitcher: ViewSwitcherHandle = async (data, _params, currentLanguageId) => {
    const loaderData = data as EngagementLoaderPublicData;
    const engagement = await loaderData.engagement;
    return {
        label: 'Edit Engagement',
        href: getPath(ROUTES.AUTHORING_DETAILS, { engagementId: engagement.id, languageCode: currentLanguageId }),
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

export const publicEngagementHandle = {
    viewSwitcher: publicEngagementViewSwitcher,
    crumb: async (data: EngagementLoaderPublicData) => {
        const translationBundle = await data.translationBundle;
        const engagement = await data.engagement;
        return {
            name:
                translationBundle.currentTranslation?.name ??
                translationBundle.defaultTranslation?.name ??
                engagement.name ??
                'Engagement',
        };
    },
};
export const publicDashboardHandle = {
    viewSwitcher: publicDashboardViewSwitcher,
    crumb: () => ({ name: 'Dashboard' }),
};
export const publicCommentsHandle = {
    viewSwitcher: publicCommentsViewSwitcher,
    crumb: () => ({ name: 'Comments' }),
};
