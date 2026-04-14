import { generatePath } from 'react-router';

export const ROUTES = {
    // Public routes
    PUBLIC_LANDING: '/',
    PUBLIC_ENGAGEMENT_BY_SLUG: '/:slug/:language',
    PUBLIC_DASHBOARD_BY_SLUG: '/:slug/dashboard/:dashboardType/:language',
    PUBLIC_COMMENTS_BY_SLUG: '/:slug/comments/:dashboardType/:language',
    PUBLIC_SURVEY_EDIT_BY_SLUG: '/:slug/edit/:token/:language',
    PUBLIC_MANAGE_SUBSCRIPTION: '/engagements/:engagementId/:subscriptionStatus/:scriptionKey/:language',
    PUBLIC_SURVEY_SUBMIT: '/surveys/submit/:surveyId/:token/:language',
    PUBLIC_NOT_AVAILABLE: '/not-available',
    PUBLIC_NOT_FOUND: '/not-found',

    // Admin routes
    ADMIN_ENGAGEMENT_PREVIEW: '/engagements/:engagementId/preview',
    HOME: '/home',
    SURVEYS: '/surveys',
    SURVEY_CREATE: '/surveys/create',
    SURVEY_BUILD: '/surveys/:surveyId/build',
    SURVEY_REPORT: '/surveys/:surveyId/report',
    SURVEY_ADMIN_SUBMIT: '/surveys/:surveyId/submit',
    SURVEY_COMMENTS: '/surveys/:surveyId/comments',
    SURVEY_COMMENTS_ALL: '/surveys/:surveyId/comments/all',
    SURVEY_SUBMISSION_REVIEW: '/surveys/:surveyId/submissions/:submissionId/review',
    ENGAGEMENTS: '/engagements',
    ENGAGEMENT: '/engagements/:engagementId',
    ENGAGEMENT_SEARCH: '/engagements/search',
    ENGAGEMENT_CREATE: '/engagements/create',
    ENGAGEMENT_CREATE_WIZARD: '/engagements/create/wizard',
    ENGAGEMENT_DETAILS: '/engagements/:engagementId/details',
    ENGAGEMENT_DETAILS_CONFIG_EDIT: '/engagements/:engagementId/details/config/edit',
    ENGAGEMENT_DETAILS_CONFIG: '/engagements/:engagementId/details/config',
    ENGAGEMENT_DETAILS_AUTHORING: '/engagements/:engagementId/details/authoring',
    ENGAGEMENT_DETAILS_ACTIVITY: '/engagements/:engagementId/details/activity',
    ENGAGEMENT_DETAILS_RESULTS: '/engagements/:engagementId/details/results',
    ENGAGEMENT_DETAILS_PUBLISH: '/engagements/:engagementId/details/publish',
    AUTHORING_BANNER: '/engagements/:engagementId/details/authoring/banner',
    AUTHORING_SUMMARY: '/engagements/:engagementId/details/authoring/summary',
    AUTHORING_DETAILS: '/engagements/:engagementId/details/authoring/details',
    AUTHORING_FEEDBACK: '/engagements/:engagementId/details/authoring/feedback',
    AUTHORING_RESULTS: '/engagements/:engagementId/details/authoring/results',
    AUTHORING_SUBSCRIBE: '/engagements/:engagementId/details/authoring/subscribe',
    AUTHORING_MORE: '/engagements/:engagementId/details/authoring/more',
    AUTHORING_PAGE: '/engagements/:engagementId/details/authoring/:page',
    ENGAGEMENT_COMMENTS_DASHBOARD: '/engagements/:engagementId/comments/:dashboardType',
    ENGAGEMENT_DASHBOARD: '/engagements/:engagementId/dashboard/:dashboardType',
    SLUG_COMMENTS_DASHBOARD: '/:slug/comments/:dashboardType',
    SLUG_DASHBOARD: '/:slug/dashboard/:dashboardType',
    METADATA_MANAGEMENT: '/metadatamanagement',
    LANGUAGES: '/languages',
    TENANT_ADMIN: '/tenantadmin',
    TENANT_ADMIN_CREATE: '/tenantadmin/create',
    TENANT_ADMIN_DETAIL: '/tenantadmin/:tenantShortName/detail',
    TENANT_ADMIN_EDIT: '/tenantadmin/:tenantShortName/edit',
    FEEDBACK: '/feedback',
    CALENDAR: '/calendar',
    REPORTING: '/reporting',
    USER_MANAGEMENT: '/usermanagement',
    USER_MANAGEMENT_SEARCH: '/usermanagement/search',
    USER_DETAILS: '/usermanagement/:userId/details',
    UNAUTHORIZED: '/unauthorized',
    ADMIN_NOT_FOUND: '/not-found',
} as const;

// A key of ROUTES, e.g. 'HOME' or 'SURVEY_BUILD'.
type RouteKey = keyof typeof ROUTES;

/**
 * Extract param names from a route pattern.
 * '/manage/surveys/:surveyId/build' => 'surveyId'
 * '/manage/engagements/:engagementId/details/:section' => 'engagementId' | 'section'
 */
type ExtractRouteParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
    ?
          | (Param extends `${infer CleanParam}?`
                ? CleanParam
                : Param extends `${infer CleanParam}*`
                  ? CleanParam
                  : Param)
          | ExtractRouteParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param extends `${infer CleanParam}?`
          ? CleanParam
          : Param extends `${infer CleanParam}*`
            ? CleanParam
            : Param
      : never;

/**
 * Get the params object type for a route.
 * If no params, returns {}; otherwise returns record of required params.
 */
type RouteParams<Path extends string> =
    ExtractRouteParams<Path> extends never
        ? Record<string, never>
        : { [P in ExtractRouteParams<Path>]: string | number };

/**
 * Type-safe route path generator. (wraps react-router's generatePath)
 * Automatically extracts required params from the route pattern.
 *
 * @example
 * getPath(ROUTES.HOME)  // '/home'
 * getPath(ROUTES.ENGAGEMENT_DETAILS, {'enagementId': '123' }) // '/engagements/123/details/authoring'
 * getPath(ROUTES.HOME, { surveyId: '123' })  // ✗ TS error: HOME has no surveyId param
 * @see https://reactrouter.com/api/utils/generatePath
 */
export function getPath<Path extends (typeof ROUTES)[RouteKey]>(
    route: Path,
    ...params: ExtractRouteParams<Path> extends never ? [] : [params: RouteParams<Path>]
): string {
    return generatePath(route as string, params[0] as { [key: string]: string | null } | undefined);
}

export type { RouteKey, RouteParams };
