import React, { useEffect, useState, useContext, useMemo } from 'react';
import '@bcgov/design-tokens/css-prefixed/variables.css'; // Will be available to use in all component
import './App.scss';
import { RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router';
import { useAppSelector, useAppDispatch } from './hooks';
import UnauthenticatedRoutes from './routes/UnauthenticatedRoutes';
import AuthenticatedRoutes from './routes/AuthenticatedRoutes';
import { AppConfig } from 'config';
import { getTenant } from 'services/tenantService';
import { TenantState, loadingTenant, saveTenant } from 'reduxSlices/tenantSlice';
import { LanguageState, loadingLanguage } from 'reduxSlices/languageSlice';
import { openNotification } from 'services/notificationService/notificationSlice';
import i18n from './i18n';
import { Languages } from 'constants/language';
import { AuthKeyCloakContext } from './components/auth/AuthKeycloakContext';
import { determinePathSegments, findTenantInPath } from './utils';
import UserService from './services/userService';
const MidScreenLoaderLazy = React.lazy(() =>
    import('components/common').then((module) => ({ default: module.MidScreenLoader })),
);

interface Translations {
    [languageId: string]: { [key: string]: string };
}

const App = () => {
    const dispatch = useAppDispatch();
    const roles = useAppSelector((state) => state.user.roles);
    const authenticationLoading = useAppSelector((state) => state.user.authentication.loading);
    const userDetail = useAppSelector((state) => state.user.userDetail);
    const pathSegments = determinePathSegments();
    const language: LanguageState = useAppSelector((state) => state.language);
    const basename = findTenantInPath();
    const tenant: TenantState = useAppSelector((state) => state.tenant);
    const [translations, setTranslations] = useState<Translations>({});
    const { isAuthenticated } = useContext(AuthKeyCloakContext);

    useEffect(() => {
        sessionStorage.setItem('apiurl', String(AppConfig.apiUrl));
        loadTenant();
    }, [basename, AppConfig.apiUrl]);

    // Re-trigger auth data loading if authenticated but user details haven't loaded yet and tenant is now available
    // This handles the race condition where authentication completes before tenant loading
    useEffect(() => {
        if (isAuthenticated && tenant.id && !userDetail?.sub && !authenticationLoading) {
            // Tenant is now loaded, retry loading user data
            UserService.setAuthData(dispatch);
        }
    }, [isAuthenticated, tenant.id, userDetail?.sub, authenticationLoading, dispatch]);

    const fetchTenant = async (_basename: string) => {
        if (!_basename) {
            dispatch(loadingTenant(false));
            return;
        }

        try {
            const tenant = await getTenant(_basename);

            const appBaseName = !AppConfig.tenant.isSingleTenantEnvironment ? _basename : '';
            // To be used for API Requests and language translation
            sessionStorage.setItem('tenantId', _basename);
            // To be used for routing
            sessionStorage.setItem('basename', appBaseName);

            dispatch(
                saveTenant({
                    id: _basename,
                    name: tenant.name,
                    heroImageUrl: tenant.hero_image_url ?? '',
                    basename: appBaseName,
                    title: tenant.title,
                    contact_email: tenant.contact_email ?? '',
                    contact_name: tenant.contact_name ?? '',
                    description: tenant.description ?? '',
                    short_name: tenant.short_name,
                    hero_image_description: tenant.hero_image_description ?? '',
                    hero_image_credit: tenant.hero_image_credit ?? '',
                }),
            );
            dispatch(loadingTenant(false));
        } catch {
            dispatch(loadingTenant(false));
            console.error('Error occurred while fetching Tenant information');
        }
    };

    const loadTenant = () => {
        // Load default tenant if in a single tenant environment
        if (AppConfig.tenant.isSingleTenantEnvironment) {
            fetchTenant(AppConfig.tenant.defaultTenant);
            return;
        }

        const defaultTenant = AppConfig.tenant.defaultTenant;
        sessionStorage.setItem('languageId', AppConfig.language.defaultLanguageId);
        // Determine the appropriate URL to redirect
        const redirectToDefaultUrl = (base: string, isAuthenticated: boolean) => {
            const redirectUrl = `/${base}${isAuthenticated ? '/home' : ''}`;
            window.location.replace(redirectUrl);
        };

        if (basename) {
            fetchTenant(basename);
            // if admin dashboard url not set
            if (pathSegments.length < 2 && isAuthenticated) {
                redirectToDefaultUrl(basename, isAuthenticated);
            }
        } else if (defaultTenant) {
            fetchTenant(defaultTenant);
            redirectToDefaultUrl(defaultTenant, isAuthenticated);
        } else {
            dispatch(loadingTenant(false));
        }
    };

    const preloadTranslations = async () => {
        try {
            const fallbackLanguages = new Set<string>();
            if (AppConfig.language.defaultLanguageId) {
                fallbackLanguages.add(AppConfig.language.defaultLanguageId);
            }
            if (language.id) {
                fallbackLanguages.add(language.id);
            }

            const languagesToLoad = tenant.id ? Object.values(Languages) : Array.from(fallbackLanguages);

            const translationEntries = await Promise.all(
                languagesToLoad.map(async (languageId) => {
                    const file = await getTranslationFile(languageId);
                    return [languageId, file] as const;
                }),
            );

            const translationsObj: Translations = {};
            translationEntries.forEach(([languageId, file]) => {
                if (file) {
                    translationsObj[languageId] = file.default;
                }
            });

            const commonTranslations = await getTranslationFile('common');
            if (commonTranslations) {
                translationsObj['common'] = commonTranslations.default;
            }

            setTranslations(translationsObj);
        } catch (error) {
            console.error('Error preloading translations:', error);
        }
    };

    const getTranslationFile = async (localeId: string) => {
        try {
            const translationFile = await import(`./locales/${localeId}.json`);
            return translationFile;
        } catch {
            const defaultTranslationFile = await import(`./locales/en.json`);
            return defaultTranslationFile;
        }
    };

    const loadTranslation = async () => {
        const preferredLanguageId = translations[language.id] ? language.id : AppConfig.language.defaultLanguageId;

        if (!preferredLanguageId || !translations[preferredLanguageId]) {
            return;
        }

        i18n.changeLanguage(preferredLanguageId); // Set the language for react-i18next

        try {
            // adding language based translation resources to default namespace 'default'. like en.json, fr.json etc
            i18n.addResourceBundle(preferredLanguageId, 'default', translations[preferredLanguageId]);
            // adding common translation resource file (common.json) to namespace 'common'
            if (translations['common']) {
                i18n.addResourceBundle(preferredLanguageId, 'common', translations['common']);
            }

            dispatch(loadingLanguage(false));
        } catch {
            dispatch(loadingLanguage(false));
            dispatch(
                openNotification({
                    text: 'Error while trying to load texts. Please try again later.',
                    severity: 'error',
                }),
            );
        }
    };

    useEffect(() => {
        preloadTranslations();
    }, [language.id, tenant.id]); // Preload translations when language id or tenant id changes

    useEffect(() => {
        loadTranslation();
    }, [language.id, translations]);

    const notFoundRouter = useMemo(() => {
        if (tenant.id) return null;
        return createBrowserRouter(
            [
                {
                    path: '/*',
                    lazy: () => import('routes/NotFound').then((module) => ({ Component: module.default })),
                },
            ],
            { basename: `/${basename}` },
        );
    }, [basename, tenant.id]);

    const unauthenticatedRouter = useMemo(() => {
        if (isAuthenticated || !tenant.id) return null;
        return createBrowserRouter(createRoutesFromElements(UnauthenticatedRoutes), {
            basename: `/${basename}`,
        });
    }, [basename, isAuthenticated, tenant.id]);

    const noAccessRouter = useMemo(() => {
        if (!isAuthenticated || roles.length !== 0 || !tenant.id) return null;
        return createBrowserRouter(
            [
                {
                    lazy: () => {
                        return Promise.all([
                            import('routes/AuthenticatedRootRouteLoader'),
                            import('components/appLayouts/PublicLayout'),
                        ]).then(([loaderModule, layoutModule]) => ({
                            loader: loaderModule.authenticatedRootLoader,
                            Component: layoutModule.default,
                        }));
                    },
                    children: [
                        {
                            path: '*',
                            lazy: () => import('routes/NoAccess').then((module) => ({ Component: module.default })),
                        },
                    ],
                    id: 'authenticated-root',
                },
            ],
            { basename: `/${basename}` },
        );
    }, [basename, isAuthenticated, roles.length, tenant.id]);

    const authenticatedRouter = useMemo(() => {
        if (!isAuthenticated || roles.length === 0 || !tenant.id) return null;
        return createBrowserRouter(createRoutesFromElements(AuthenticatedRoutes), {
            basename: `/${basename}`,
        });
    }, [basename, isAuthenticated, roles.length, tenant.id]);

    // Wait for tenant to load before proceeding with authentication flow
    // This is necessary because API calls require the tenant-id header from sessionStorage
    if (tenant.loading) {
        return <MidScreenLoaderLazy message="Loading tenant..." />;
    }

    if (language.loading) {
        return <MidScreenLoaderLazy message="Loading languages..." />;
    }

    // After tenant is loaded, wait for authentication and user authorization to complete
    if (authenticationLoading || (isAuthenticated && !userDetail?.sub)) {
        return <MidScreenLoaderLazy message="Loading user details..." />;
    }

    const chooseRouter = () => {
        if (!tenant.id) {
            // If the tenant failed to load, show the Not Found page.
            return notFoundRouter;
        }
        if (!isAuthenticated) {
            // If the user is not authenticated, show the public layout.
            return unauthenticatedRouter;
        }
        if (roles.length === 0) {
            // If the user is authenticated but does not have a role, display the admin area with no access to children pages.
            return noAccessRouter;
        }
        // Otherwise, display the admin area.
        return authenticatedRouter;
    };

    const router = chooseRouter();

    if (router) {
        return <RouterProvider router={router} />;
    }

    return <MidScreenLoaderLazy />;
};
export default App;
