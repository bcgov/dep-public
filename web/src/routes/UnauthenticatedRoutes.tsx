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
            <LazyRoute index ComponentLazy={() => import('routes/SlugLanguageRedirect')} />
            <LazyRoute
                path=":language"
                id="public-single-engagement"
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
                path=":scriptionAction/:scriptionKey/:language"
                ComponentLazy={() =>
                    import('engagements/subscribe/Subscription').then((m) => withLanguageParam(m.default))
                }
            />
            <LazyRoute path="*" ComponentLazy={() => import('routes/NotFound')} />
        </Route>
        <Route path="/engagements/:engagementId">
            <LazyRoute
                path=":scriptionAction/:scriptionKey/:language"
                ComponentLazy={() =>
                    import('engagements/subscribe/Subscription').then((m) => withLanguageParam(m.default))
                }
            />
        </Route>
        <LazyRoute
            path="/surveys/submit/:surveyId/:token/:language"
            id="public-survey"
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
