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
    ADMIN_ENGAGEMENT_PREVIEW: '/manage/engagements/:engagementId/preview',
    HOME: '/manage',
    SURVEYS: '/manage/surveys',
    SURVEY_CREATE: '/manage/surveys/create',
    SURVEY_BUILD: '/manage/surveys/:surveyId/build',
    SURVEY_REPORT: '/manage/surveys/:surveyId/report',
    SURVEY_ADMIN_SUBMIT: '/manage/surveys/:surveyId/submit',
    SURVEY_COMMENTS: '/manage/surveys/:surveyId/comments',
    SURVEY_COMMENTS_ALL: '/manage/surveys/:surveyId/comments/all',
    SURVEY_SUBMISSION_REVIEW: '/manage/surveys/:surveyId/submissions/:submissionId/review',
    ENGAGEMENTS: '/manage/engagements',
    ENGAGEMENT: '/manage/engagements/:engagementId',
    ENGAGEMENT_SEARCH: '/manage/engagements/search',
    ENGAGEMENT_CREATE: '/manage/engagements/create',
    ENGAGEMENT_CREATE_WIZARD: '/manage/engagements/create/wizard',
    ENGAGEMENT_DETAILS: '/manage/engagements/:engagementId/details',
    ENGAGEMENT_DETAILS_CONFIG_EDIT: '/manage/engagements/:engagementId/details/config/edit',
    ENGAGEMENT_DETAILS_CONFIG: '/manage/engagements/:engagementId/details/config',
    ENGAGEMENT_DETAILS_AUTHORING: '/manage/engagements/:engagementId/details/authoring',
    ENGAGEMENT_DETAILS_ACTIVITY: '/manage/engagements/:engagementId/details/activity',
    ENGAGEMENT_DETAILS_RESULTS: '/manage/engagements/:engagementId/details/results',
    ENGAGEMENT_DETAILS_PUBLISH: '/manage/engagements/:engagementId/details/publish',
    AUTHORING_BANNER: '/manage/engagements/:engagementId/details/authoring/banner',
    AUTHORING_SUMMARY: '/manage/engagements/:engagementId/details/authoring/summary',
    AUTHORING_DETAILS: '/manage/engagements/:engagementId/details/authoring/details',
    AUTHORING_FEEDBACK: '/manage/engagements/:engagementId/details/authoring/feedback',
    AUTHORING_RESULTS: '/manage/engagements/:engagementId/details/authoring/results',
    AUTHORING_SUBSCRIBE: '/manage/engagements/:engagementId/details/authoring/subscribe',
    AUTHORING_MORE: '/manage/engagements/:engagementId/details/authoring/more',
    AUTHORING_PAGE: '/manage/engagements/:engagementId/details/authoring/:page',
    ENGAGEMENT_COMMENTS_DASHBOARD: '/manage/engagements/:engagementId/comments/:dashboardType',
    ENGAGEMENT_DASHBOARD: '/manage/engagements/:engagementId/dashboard/:dashboardType',
    SLUG_COMMENTS_DASHBOARD: '/manage/:slug/comments/:dashboardType',
    SLUG_DASHBOARD: '/manage/:slug/dashboard/:dashboardType',
    METADATA_MANAGEMENT: '/manage/metadata',
    LANGUAGES: '/manage/languages',
    TENANT_ADMIN: '/manage/tenantadmin',
    TENANT_ADMIN_CREATE: '/manage/tenantadmin/create',
    TENANT_ADMIN_DETAIL: '/manage/tenantadmin/:tenantShortName/detail',
    TENANT_ADMIN_EDIT: '/manage/tenantadmin/:tenantShortName/edit',
    FEEDBACK: '/manage/feedback',
    CALENDAR: '/manage/calendar',
    REPORTING: '/manage/reporting',
    USER_MANAGEMENT: '/manage/users',
    USER_MANAGEMENT_SEARCH: '/manage/users/search',
    USER_DETAILS: '/manage/users/:userId/details',
    NO_ACCESS: '/manage/no-access',
    UNAUTHORIZED: '/manage/unauthorized',
    ADMIN_NOT_FOUND: '/manage/not-found',
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
 * getPath(ROUTES.HOME)  // '/manage'
 * getPath(ROUTES.ENGAGEMENT_DETAILS, { engagementId: '123' }) // '/manage/engagements/123/details'
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
