import React from 'react';
import { Navigate, Route } from 'react-router';

import { USER_ROLES } from 'services/userService/constants';
import LazyRoute, { resolveLazyRouteTree } from './LazyRoute';
import { getPath, ROUTES } from './routes';

const AuthenticatedRoutes = resolveLazyRouteTree(
    <Route path="/manage">
        {/* Preview Route with Simplified Layout */}
        <LazyRoute
            ComponentLazy={() => import('routes/AuthGateRoute')}
            handle={{ allowedRoles: [USER_ROLES.VIEW_ENGAGEMENT, USER_ROLES.VIEW_ASSIGNED_ENGAGEMENTS] }}
        >
            <LazyRoute
                path="engagements/:engagementId/preview"
                ComponentLazy={() => import('components/appLayouts/SimplifiedLayout')}
            >
                <LazyRoute index element={<Navigate to="en" replace />} />
                <LazyRoute
                    path=":languageCode"
                    id="engagement-preview"
                    ComponentLazy={() => import('components/engagement/preview/EngagementPreview')}
                    loaderLazy={() => import('components/engagement/preview/engagementPreviewLoader')}
                />
            </LazyRoute>
        </LazyRoute>

        {/* Main Authenticated Routes with Full Layout */}
        <LazyRoute
            id="authenticated-root"
            ComponentLazy={() => import('components/appLayouts/AuthenticatedLayout')}
            ErrorBoundaryLazy={() => import('./NotFound')}
            loaderLazy={() => import('routes/AuthenticatedRootRouteLoader')}
            // Don't show "Home" at the end of every page title - treat as an index page for the app
            handle={{ crumb: () => ({ name: 'Home', isIndex: true, link: getPath(ROUTES.HOME) }) }}
            shouldRevalidate={() => false} // Cache the root loader data for the authenticated area
        >
            <LazyRoute index ComponentLazy={() => import('components/dashboard')} />
            <LazyRoute path="no-access" ComponentLazy={() => import('routes/NoAccess')} />
            <Route
                path="surveys"
                handle={{ crumb: () => ({ name: 'Surveys', isIndex: true, link: getPath(ROUTES.SURVEYS) }) }}
            >
                <LazyRoute index ComponentLazy={() => import('components/survey/listing')} />
                <LazyRoute
                    path="create"
                    ComponentLazy={() => import('components/survey/create')}
                    handle={{ crumb: () => ({ name: 'New Survey' }) }}
                />
                <LazyRoute
                    path=":surveyId"
                    id="survey"
                    loaderLazy={() => import('components/survey/building/SurveyLoader')}
                    ErrorBoundaryLazy={() => import('routes/NotFound')}
                >
                    <LazyRoute path="build" ComponentLazy={() => import('components/survey/building')} />
                    <LazyRoute path="report" ComponentLazy={() => import('components/survey/report')} />
                    <LazyRoute path="submit" ComponentLazy={() => import('components/survey/submit')} />
                    <LazyRoute
                        ComponentLazy={() => import('routes/AuthGateRoute')}
                        handle={{ allowedRoles: [USER_ROLES.VIEW_APPROVED_COMMENTS] }}
                    >
                        <LazyRoute
                            path="comments"
                            ComponentLazy={() => import('components/comments/admin/reviewListing')}
                        />
                        <LazyRoute
                            path="comments/all"
                            ComponentLazy={() => import('components/comments/admin/textListing')}
                        />
                    </LazyRoute>
                    <LazyRoute
                        ComponentLazy={() => import('routes/AuthGateRoute')}
                        handle={{ allowedRoles: [USER_ROLES.REVIEW_COMMENTS] }}
                    >
                        <LazyRoute
                            path="submissions/:submissionId/review"
                            ComponentLazy={() => import('components/comments/admin/review/CommentReview')}
                        />
                    </LazyRoute>
                </LazyRoute>
            </Route>
            <LazyRoute
                path="engagements"
                id="engagement-listing"
                ErrorBoundaryLazy={() => import('routes/NotFound')}
                // Exclude extraneous "Engagements" when viewing an individual engagement by marking as index page
                handle={{ crumb: () => ({ name: 'Engagements', isIndex: true }) }}
            >
                <LazyRoute index ComponentLazy={() => import('engagements/listing')} />
                <LazyRoute
                    path="search"
                    element={<Navigate to={getPath(ROUTES.ENGAGEMENTS)} />}
                    loaderLazy={() => import('engagements/public/view').then((m) => m.engagementListLoader)}
                />
                <LazyRoute
                    path="create"
                    ComponentLazy={() => import('routes/AuthGateRoute')}
                    handle={{ allowedRoles: [USER_ROLES.CREATE_ENGAGEMENT] }}
                    actionLazy={() => import('engagements/admin/config/EngagementCreateAction')}
                >
                    <LazyRoute index element={<Navigate to="wizard" />} />
                    <LazyRoute
                        path="wizard"
                        handle={{ crumb: () => ({ name: 'New Engagement' }) }}
                        ComponentLazy={() => import('engagements/admin/config/wizard/CreationWizard')}
                    />
                </LazyRoute>
                <LazyRoute
                    path=":engagementId"
                    id="single-engagement"
                    loaderLazy={() => import('engagements/admin/EngagementLoaderAdmin')}
                    ErrorBoundaryLazy={() => import('routes/NotFound')}
                    handle={{
                        crumb: async (data: { engagement: Promise<{ name: string; id: number }> }) =>
                            data.engagement.then((engagement) => ({
                                name: engagement.name,
                                link: getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, {
                                    engagementId: engagement.id,
                                }),
                            })),
                        viewSwitcher: async (data: unknown, _params: unknown, languageId: string) => {
                            const loaderData = data as { engagement: Promise<{ slug: string }> };
                            const slug = (await loaderData.engagement).slug;
                            return {
                                label: 'View Public Page',
                                href: getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                                    slug,
                                    language: languageId,
                                }),
                            };
                        },
                    }}
                    shouldRevalidate={({ currentParams, nextParams, formMethod, actionResult }) => {
                        return (
                            currentParams.engagementId !== nextParams.engagementId ||
                            formMethod !== undefined ||
                            actionResult === 'success'
                        );
                    }}
                >
                    <LazyRoute index element={<Navigate to="authoring" />} />
                    <LazyRoute
                        path="config/edit"
                        handle={{ crumb: () => ({ name: 'Configuration', link: '../config' }) }}
                    >
                        <LazyRoute
                            index
                            handle={{ crumb: () => ({ name: 'Edit' }) }}
                            ComponentLazy={() => import('engagements/admin/config/wizard/ConfigWizard')}
                            actionLazy={() => import('engagements/admin/config/EngagementUpdateAction')}
                        />
                    </LazyRoute>
                    {/* Wraps the tabs with the engagement title and TabContext */}
                    <LazyRoute ComponentLazy={() => import('engagements/admin/view')}>
                        <LazyRoute
                            path="config"
                            handle={{ crumb: () => ({ name: 'Configuration' }) }}
                            ComponentLazy={() => import('engagements/admin/view/ConfigSummary')}
                        />
                        <LazyRoute
                            path="authoring"
                            handle={{ crumb: () => ({ name: 'Authoring' }) }}
                            ComponentLazy={() => import('engagements/admin/view/AuthoringTab')}
                        />
                        <LazyRoute
                            path="activity"
                            handle={{ crumb: () => ({ name: 'Activity' }) }}
                            ComponentLazy={() => import('routes/UnderConstruction')}
                        />
                        <LazyRoute
                            path="results"
                            handle={{ crumb: () => ({ name: 'Results' }) }}
                            ComponentLazy={() => import('routes/UnderConstruction')}
                        />
                        <LazyRoute
                            path="publish"
                            handle={{ crumb: () => ({ name: 'Publish' }) }}
                            ComponentLazy={() => import('engagements/admin/view/PublishingTab')}
                            actionLazy={() => import('engagements/admin/view/publishingAction')}
                        />
                        <LazyRoute
                            path="*"
                            lazy={() => import('routes/NotFound').then((module) => ({ Component: module.default }))}
                        />
                    </LazyRoute>
                    {/* Authoring editing pages — /manage/engagements/:engagementId/authoring/:languageCode/:page */}
                    <LazyRoute
                        path="authoring"
                        handle={{
                            allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT],
                            crumb: (data?: { engagement?: { id?: number } }) => ({
                                name: 'Authoring',
                                link: data?.engagement?.id
                                    ? `/manage/engagements/${data.engagement.id}/details/authoring`
                                    : undefined,
                            }),
                        }}
                    >
                        <LazyRoute
                            path=":languageCode"
                            handle={{ allowedRoles: [USER_ROLES.EDIT_ENGAGEMENT] }}
                            ComponentLazy={() => import('routes/AuthGateRoute')}
                        >
                            <LazyRoute index element={<Navigate to="banner" />} />
                            <LazyRoute
                                ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringContext')}
                            >
                                <LazyRoute
                                    path="banner"
                                    ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringBanner')}
                                    actionLazy={() =>
                                        import('engagements/admin/create/authoring/authoringUpdateAction')
                                    }
                                    handle={{ crumb: () => ({ name: 'Hero Banner' }) }}
                                />
                                <LazyRoute
                                    path="summary"
                                    ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringSummary')}
                                    actionLazy={() =>
                                        import('engagements/admin/create/authoring/authoringUpdateAction')
                                    }
                                    handle={{ crumb: () => ({ name: 'Summary' }) }}
                                />
                                <LazyRoute
                                    path="details"
                                    ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringDetails')}
                                    loaderLazy={() => import('engagements/admin/create/authoring/authoringLoader')}
                                    actionLazy={() =>
                                        import('engagements/admin/create/authoring/authoringUpdateAction')
                                    }
                                    shouldRevalidate={({ actionResult, currentParams, nextParams }) =>
                                        actionResult === 'success' ||
                                        currentParams.languageCode !== nextParams.languageCode
                                    }
                                    handle={{ crumb: () => ({ name: 'Details' }) }}
                                />
                                <LazyRoute
                                    path="feedback"
                                    ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringFeedback')}
                                    loaderLazy={() => import('engagements/admin/create/authoring/authoringLoader')}
                                    actionLazy={() =>
                                        import('engagements/admin/create/authoring/authoringUpdateAction')
                                    }
                                    shouldRevalidate={({ actionResult, currentParams, nextParams }) =>
                                        actionResult === 'success' ||
                                        currentParams.languageCode !== nextParams.languageCode
                                    }
                                    handle={{ crumb: () => ({ name: 'Provide Feedback' }) }}
                                />
                                <LazyRoute
                                    path="results"
                                    ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringResults')}
                                    handle={{ crumb: () => ({ name: 'View Results' }) }}
                                />
                                <LazyRoute
                                    path="subscribe"
                                    ComponentLazy={() =>
                                        import('engagements/admin/create/authoring/AuthoringSubscribe')
                                    }
                                    actionLazy={() =>
                                        import('engagements/admin/create/authoring/authoringUpdateAction')
                                    }
                                    handle={{ crumb: () => ({ name: 'Subscribe' }) }}
                                />
                                <LazyRoute
                                    path="more"
                                    ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringMore')}
                                    loaderLazy={() => import('engagements/admin/create/authoring/authoringLoader')}
                                    actionLazy={() =>
                                        import('engagements/admin/create/authoring/authoringUpdateAction')
                                    }
                                    shouldRevalidate={({ actionResult, currentParams, nextParams }) =>
                                        actionResult === 'success' ||
                                        currentParams.languageCode !== nextParams.languageCode
                                    }
                                    handle={{ crumb: () => ({ name: 'More Engagements' }) }}
                                />
                            </LazyRoute>
                        </LazyRoute>
                    </LazyRoute>
                    <LazyRoute
                        path="comments/:dashboardType"
                        ComponentLazy={() => import('engagements/dashboard/comment')}
                    />
                    <LazyRoute
                        path="dashboard/:dashboardType"
                        ComponentLazy={() => import('components/publicDashboard')}
                    />
                    <LazyRoute path="*" ComponentLazy={() => import('routes/NotFound')} />
                </LazyRoute>
            </LazyRoute>
            <LazyRoute path=":slug">
                <LazyRoute index loaderLazy={() => import('engagements/admin/EngagementLoaderAdmin')} />
                <LazyRoute
                    path="comments/:dashboardType"
                    ComponentLazy={() => import('engagements/dashboard/comment')}
                    handleLazy={() =>
                        import('routes/AuthenticatedViewSwitcherHandles').then((m) => m.adminCommentsBySlugHandle)
                    }
                />
                <LazyRoute
                    path="dashboard/:dashboardType"
                    ComponentLazy={() => import('components/publicDashboard')}
                    handleLazy={() =>
                        import('routes/AuthenticatedViewSwitcherHandles').then((m) => m.adminDashboardBySlugHandle)
                    }
                />
            </LazyRoute>
            <LazyRoute
                path="metadata"
                ComponentLazy={() => import('components/metadataManagement')}
                handle={{ crumb: () => ({ name: 'Metadata Management' }) }}
            />
            <LazyRoute
                path="languages"
                loaderLazy={() => import('engagements/admin/config/LanguageLoader')}
                ComponentLazy={() => import('components/language')}
                handle={{ crumb: () => ({ name: 'Languages' }) }}
            />
            <LazyRoute
                id="tenant-admin"
                path="tenantadmin"
                loaderLazy={() => import('components/tenantManagement/tenantLoader').then((m) => m.allTenantsLoader)}
                ErrorBoundaryLazy={() => import('routes/NotFound')}
                handle={{ crumb: () => ({ name: 'Tenant Admin' }) }}
            >
                <LazyRoute index ComponentLazy={() => import('components/tenantManagement/Listing')} />
                <LazyRoute
                    path="create"
                    ComponentLazy={() => import('components/tenantManagement/Create')}
                    handle={{ crumb: () => ({ name: 'Create Tenant Instance' }) }}
                />
                <LazyRoute
                    id="tenant"
                    path=":tenantShortName"
                    loaderLazy={() => import('components/tenantManagement/tenantLoader')}
                    ErrorBoundaryLazy={() => import('routes/NotFound')}
                    handle={{
                        crumb: (data: { name: string; short_name: string }) => ({
                            link: getPath(ROUTES.TENANT_ADMIN_DETAIL, {
                                tenantShortName: data.short_name,
                            }),
                            name: data.name,
                        }),
                    }}
                    shouldRevalidate={({ currentParams, nextParams }) => {
                        return currentParams.tenantShortName !== nextParams.tenantShortName;
                    }}
                >
                    <LazyRoute index element={<Navigate to="detail" />} />
                    <LazyRoute path="detail" ComponentLazy={() => import('components/tenantManagement/Detail')} />
                    <LazyRoute
                        path="edit"
                        ComponentLazy={() => import('components/tenantManagement/Edit')}
                        handle={{ crumb: () => ({ name: 'Edit' }) }}
                    />
                </LazyRoute>
            </LazyRoute>
            <LazyRoute
                path="feedback"
                ComponentLazy={() => import('components/feedback/listing')}
                handle={{ crumb: () => ({ name: 'Site Feedback' }) }}
            />
            <LazyRoute path="calendar" ComponentLazy={() => import('routes/UnderConstruction')} />
            <LazyRoute path="reporting" ComponentLazy={() => import('routes/UnderConstruction')} />
            <LazyRoute path="users" handle={{ crumb: () => ({ name: 'User Management' }) }}>
                <LazyRoute index ComponentLazy={() => import('components/userManagement/listing')} />
                <LazyRoute
                    path="search"
                    element={<Navigate to={getPath(ROUTES.USER_MANAGEMENT)} />}
                    loaderLazy={() => import('components/userManagement/userSearchLoader')}
                />
                <LazyRoute
                    path=":userId/details"
                    loaderLazy={() => import('components/userManagement/userDetails/userDetailsLoader')}
                    ComponentLazy={() => import('components/userManagement/userDetails')}
                    handle={{ crumb: () => ({ name: 'User Details' }) }}
                />
            </LazyRoute>
            <LazyRoute
                path="unauthorized"
                ComponentLazy={() => import('routes/Unauthorized')}
                handle={{ crumb: () => ({ name: 'Not Authorized' }) }}
            />
            <LazyRoute path="not-found" ComponentLazy={() => import('routes/NotFound')} />
            <LazyRoute path="*" ComponentLazy={() => import('routes/NotFound')} />
        </LazyRoute>
    </Route>,
);

export default AuthenticatedRoutes;
