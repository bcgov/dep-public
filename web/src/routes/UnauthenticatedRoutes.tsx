import React from 'react';
import withLanguageParam from './LanguageParam';
import { Route } from 'react-router';
import LazyRoute, { resolveLazyRouteTree } from './LazyRoute';

const UnauthenticatedRoutes = resolveLazyRouteTree(
    <LazyRoute
        path="/"
        ComponentLazy={() => import('components/appLayouts/PublicLayout')}
        ErrorBoundaryLazy={() => import('routes/NotFound')}
        id="public-root"
    >
        <LazyRoute index ComponentLazy={() => import('components/landing')} />
        <Route path=":slug">
            <LazyRoute
                path=":language"
                id="single-engagement"
                ComponentLazy={() =>
                    import('engagements/public/view').then((module) => withLanguageParam(module.default))
                }
                loaderLazy={() => import('engagements/public/view/EngagementLoaderPublic')}
            />
            <LazyRoute
                path="dashboard/:dashboardType/:language"
                ComponentLazy={() => import('components/publicDashboard').then((m) => withLanguageParam(m.default))}
            />
            <LazyRoute
                path="comments/:dashboardType/:language"
                ComponentLazy={() => import('engagements/dashboard/comment').then((m) => withLanguageParam(m.default))}
            />
            <LazyRoute
                path="edit/:token/:language"
                ComponentLazy={() =>
                    import('components/survey/edit').then((module) => withLanguageParam(module.default))
                }
                loaderLazy={() => import('components/survey/building/SurveyLoader')}
            />
            <LazyRoute
                path=":subscriptionStatus/:scriptionKey/:language"
                ComponentLazy={() =>
                    import('engagements/widgets/Subscribe/ManageSubscription').then((m) => withLanguageParam(m.default))
                }
            />
            <LazyRoute path="*" ComponentLazy={() => import('routes/NotFound')} />
        </Route>
        <Route path="/engagements/:engagementId">
            <LazyRoute
                path=":subscriptionStatus/:scriptionKey/:language"
                ComponentLazy={() =>
                    import('engagements/widgets/Subscribe/ManageSubscription').then((m) => withLanguageParam(m.default))
                }
            />
        </Route>
        <LazyRoute
            path="/surveys/submit/:surveyId/:token/:language"
            id="survey"
            ComponentLazy={() => import('components/survey/submit').then((module) => withLanguageParam(module.default))}
            loaderLazy={() =>
                import('components/survey/building/SurveyLoader').then((loaderModule) => loaderModule.SurveyLoader)
            }
        />
        <LazyRoute path="/not-available" ComponentLazy={() => import('routes/NotAvailable')} />
        <LazyRoute path="/not-found" ComponentLazy={() => import('routes/NotFound')} />
        <LazyRoute path="*" ComponentLazy={() => import('routes/NotFound')} />
    </LazyRoute>,
);

export default UnauthenticatedRoutes;
