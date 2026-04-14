import React from 'react';
import { Navigate, Route } from 'react-router';

import { USER_ROLES } from 'services/userService/constants';
import LazyRoute, { resolveLazyRouteTree } from './LazyRoute';

// Load this synchronously because the route tree must be complete before rendering
import AuthGate from './AuthGate';

const AuthenticatedRoutes = resolveLazyRouteTree(
    <Route>
        {/* Preview Route with Simplified Layout */}
        <LazyRoute
            element={<AuthGate allowedRoles={[USER_ROLES.VIEW_ENGAGEMENT, USER_ROLES.VIEW_ASSIGNED_ENGAGEMENTS]} />}
        >
            <LazyRoute
                path="/engagements/:engagementId/preview"
                ComponentLazy={() => import('components/appLayouts/SimplifiedLayout')}
            >
                <LazyRoute
                    index
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
            handle={{ crumb: () => ({ name: 'Dashboard', link: '/home' }) }}
            shouldRevalidate={() => false} // Cache the root loader data for the authenticated area
        >
            <LazyRoute path="/home" ComponentLazy={() => import('components/dashboard')} />
            <Route path="/surveys" handle={{ crumb: () => ({ name: 'Surveys', link: '/surveys' }) }}>
                <LazyRoute index ComponentLazy={() => import('components/survey/listing')} />
                <LazyRoute path="create" ComponentLazy={() => import('components/survey/create')} />
                <LazyRoute
                    path=":surveyId"
                    id="survey"
                    loaderLazy={() => import('components/survey/building/SurveyLoader')}
                    ErrorBoundaryLazy={() => import('routes/NotFound')}
                >
                    <LazyRoute path="build" ComponentLazy={() => import('components/survey/building')} />
                    <LazyRoute path="report" ComponentLazy={() => import('components/survey/report')} />
                    <LazyRoute path="submit" ComponentLazy={() => import('components/survey/submit')} />
                    <LazyRoute element={<AuthGate allowedRoles={[USER_ROLES.VIEW_APPROVED_COMMENTS]} />}>
                        <LazyRoute
                            path="comments"
                            ComponentLazy={() => import('components/comments/admin/reviewListing')}
                        />
                        <LazyRoute
                            path="comments/all"
                            ComponentLazy={() => import('components/comments/admin/textListing')}
                        />
                    </LazyRoute>
                    <LazyRoute element={<AuthGate allowedRoles={[USER_ROLES.REVIEW_COMMENTS]} />}>
                        <LazyRoute
                            path="submissions/:submissionId/review"
                            ComponentLazy={() => import('components/comments/admin/review/CommentReview')}
                        />
                    </LazyRoute>
                </LazyRoute>
            </Route>
            <LazyRoute
                path="/engagements"
                id="engagement-listing"
                ErrorBoundaryLazy={() => import('routes/NotFound')}
                handle={{ crumb: () => ({ name: 'Engagements' }) }}
            >
                <LazyRoute index ComponentLazy={() => import('engagements/listing')} />
                <LazyRoute
                    path="search"
                    element={<Navigate to="/engagements" />}
                    loaderLazy={() => import('engagements/public/view').then((m) => m.engagementListLoader)}
                />
                <LazyRoute
                    path="create"
                    element={<AuthGate allowedRoles={[USER_ROLES.CREATE_ENGAGEMENT]} />}
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
                                link: `/engagements/${engagement.id}/details/authoring`,
                            })),
                    }}
                    shouldRevalidate={({ currentParams, nextParams }) => {
                        return currentParams.engagementId !== nextParams.engagementId;
                    }}
                >
                    <LazyRoute index element={<Navigate to="details/authoring" />} />
                    <LazyRoute path="details">
                        <LazyRoute
                            path="config/edit"
                            ComponentLazy={() => import('engagements/admin/config/wizard/ConfigWizard')}
                            actionLazy={() => import('engagements/admin/config/EngagementUpdateAction')}
                            handle={{ crumb: () => ({ name: 'Configure' }) }}
                        />
                        <LazyRoute index element={<Navigate to="config" />} />
                        {/* Wraps the tabs with the engagement title and TabContext */}
                        <LazyRoute
                            ComponentLazy={() => import('engagements/admin/view')}
                            shouldRevalidate={() => false}
                        >
                            <LazyRoute
                                path="config"
                                ComponentLazy={() => import('engagements/admin/view/ConfigSummary')}
                            />
                            <LazyRoute
                                path="authoring"
                                ComponentLazy={() => import('engagements/admin/view/AuthoringTab')}
                            />
                            <LazyRoute path="activity" ComponentLazy={() => import('routes/UnderConstruction')} />
                            <LazyRoute path="results" ComponentLazy={() => import('routes/UnderConstruction')} />
                            <LazyRoute
                                path="publish"
                                ComponentLazy={() => import('engagements/admin/view/PublishingTab')}
                                actionLazy={() => import('engagements/admin/view/publishingAction')}
                                loaderLazy={() => import('engagements/admin/EngagementLoaderAdmin')}
                            />
                            <LazyRoute
                                path="*"
                                lazy={() => import('routes/NotFound').then((module) => ({ Component: module.default }))}
                            />
                        </LazyRoute>
                        <LazyRoute
                            path="authoring"
                            handle={{ crumb: () => ({ name: 'Authoring' }) }}
                            element={<AuthGate allowedRoles={[USER_ROLES.EDIT_ENGAGEMENT]} />}
                        >
                            <LazyRoute
                                ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringContext')}
                            >
                                <LazyRoute
                                    ComponentLazy={() => import('engagements/admin/create/authoring/AuthoringTemplate')}
                                    id="authoring-loader"
                                >
                                    <LazyRoute
                                        path="banner"
                                        ComponentLazy={() =>
                                            import('engagements/admin/create/authoring/AuthoringBanner')
                                        }
                                        loaderLazy={() => import('engagements/admin/EngagementLoaderAdmin')}
                                        actionLazy={() =>
                                            import('engagements/admin/create/authoring/authoringUpdateAction')
                                        }
                                        handle={{ crumb: () => ({ name: 'Hero Banner' }) }}
                                    />
                                    <LazyRoute
                                        path="summary"
                                        ComponentLazy={() =>
                                            import('engagements/admin/create/authoring/AuthoringSummary')
                                        }
                                        loaderLazy={() => import('engagements/admin/EngagementLoaderAdmin')}
                                        actionLazy={() =>
                                            import('engagements/admin/create/authoring/authoringUpdateAction')
                                        }
                                        handle={{ crumb: () => ({ name: 'Summary' }) }}
                                    />
                                    <LazyRoute
                                        path="details"
                                        ComponentLazy={() =>
                                            import('engagements/admin/create/authoring/AuthoringDetails')
                                        }
                                        loaderLazy={() => import('engagements/admin/create/authoring/authoringLoader')}
                                        actionLazy={() =>
                                            import('engagements/admin/create/authoring/authoringUpdateAction')
                                        }
                                        handle={{ crumb: () => ({ name: 'Details' }) }}
                                    />
                                    <LazyRoute
                                        path="feedback"
                                        ComponentLazy={() =>
                                            import('engagements/admin/create/authoring/AuthoringFeedback')
                                        }
                                        loaderLazy={() => import('engagements/admin/create/authoring/authoringLoader')}
                                        actionLazy={() =>
                                            import('engagements/admin/create/authoring/authoringUpdateAction')
                                        }
                                        handle={{ crumb: () => ({ name: 'Provide Feedback' }) }}
                                    />
                                    <LazyRoute
                                        path="results"
                                        ComponentLazy={() =>
                                            import('engagements/admin/create/authoring/AuthoringResults')
                                        }
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
                                        handle={{ crumb: () => ({ name: 'More Engagements' }) }}
                                    />
                                </LazyRoute>
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
                />
                <LazyRoute path="dashboard/:dashboardType" ComponentLazy={() => import('components/publicDashboard')} />
            </LazyRoute>
            <LazyRoute
                path="/metadatamanagement"
                ComponentLazy={() => import('components/metadataManagement')}
                handle={{ crumb: () => ({ name: 'Metadata Management' }) }}
            />
            <LazyRoute
                path="/languages"
                loaderLazy={() => import('engagements/admin/config/LanguageLoader')}
                ComponentLazy={() => import('components/language')}
                handle={{ crumb: () => ({ name: 'Languages' }) }}
            />
            <LazyRoute
                id="tenant-admin"
                path="/tenantadmin"
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
                            link: `/tenantadmin/${data.short_name}/detail`,
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
                        handle={{ crumb: () => ({ name: 'Edit Instance' }) }}
                    />
                </LazyRoute>
            </LazyRoute>
            <LazyRoute
                path="/feedback"
                ComponentLazy={() => import('components/feedback/listing')}
                handle={{ crumb: () => ({ name: 'Feedback' }) }}
            />
            <LazyRoute path="/calendar" ComponentLazy={() => import('routes/UnderConstruction')} />
            <LazyRoute path="/reporting" ComponentLazy={() => import('routes/UnderConstruction')} />
            <LazyRoute path="/usermanagement" handle={{ crumb: () => ({ name: 'User Management' }) }}>
                <LazyRoute index ComponentLazy={() => import('components/userManagement/listing')} />
                <LazyRoute
                    path="search"
                    element={<Navigate to="/usermanagement" />}
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
                path="/unauthorized"
                ComponentLazy={() => import('routes/Unauthorized')}
                handle={{ crumb: () => ({ name: 'Not Authorized' }) }}
            />
            <LazyRoute path="/not-found" ComponentLazy={() => import('routes/NotFound')} />
            <LazyRoute path="*" ComponentLazy={() => import('routes/NotFound')} />
        </LazyRoute>
    </Route>,
);

export default AuthenticatedRoutes;
