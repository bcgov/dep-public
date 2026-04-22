import { getPath, ROUTES } from './routes';
import { ViewSwitcherHandle } from './ViewSwitcherHandle';

const adminCommentsByIdViewSwitcher: ViewSwitcherHandle = async (data, params, languageId) => {
    const loaderData = data as { slug: Promise<string> };
    const slug = await loaderData.slug;
    return {
        label: 'View Public Page',
        href: getPath(ROUTES.PUBLIC_COMMENTS_BY_SLUG, {
            slug,
            dashboardType: params.dashboardType || '',
            language: languageId,
        }),
    };
};

const adminDashboardByIdViewSwitcher: ViewSwitcherHandle = async (data, params, languageId) => {
    const loaderData = data as { slug: Promise<string> };
    const slug = await loaderData.slug;
    return {
        label: 'View Public Page',
        href: getPath(ROUTES.PUBLIC_DASHBOARD_BY_SLUG, {
            slug,
            dashboardType: params.dashboardType || '',
            language: languageId,
        }),
    };
};

const adminCommentsBySlugViewSwitcher: ViewSwitcherHandle = async (_data, params, languageId) => {
    return {
        label: 'View Public Page',
        href: getPath(ROUTES.PUBLIC_COMMENTS_BY_SLUG, {
            slug: params.slug || '',
            dashboardType: params.dashboardType || '',
            language: languageId,
        }),
    };
};

const adminDashboardBySlugViewSwitcher: ViewSwitcherHandle = async (_data, params, languageId) => {
    return {
        label: 'View Public Page',
        href: getPath(ROUTES.PUBLIC_DASHBOARD_BY_SLUG, {
            slug: params.slug || '',
            dashboardType: params.dashboardType || '',
            language: languageId,
        }),
    };
};

export const adminCommentsByIdHandle = { viewSwitcher: adminCommentsByIdViewSwitcher };
export const adminDashboardByIdHandle = { viewSwitcher: adminDashboardByIdViewSwitcher };
export const adminCommentsBySlugHandle = { viewSwitcher: adminCommentsBySlugViewSwitcher };
export const adminDashboardBySlugHandle = { viewSwitcher: adminDashboardBySlugViewSwitcher };
