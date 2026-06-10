import React, { useEffect, ComponentType, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useAppSelector } from '../hooks';
import { LanguageState } from 'reduxSlices/languageSlice';

interface RouteParams {
    [key: string]: string | undefined;
    engagementId?: string;
    slug?: string;
    subscriptionStatus?: string;
    scriptionKey?: string;
    dashboardType?: string;
    token?: string;
    widgetId?: string;
    language?: string;
}

/**
 * Higher-Order Component (HOC) to handle language parameter in the URL.
 * This HOC checks if the current URL includes the language code and adds it if necessary.
 * It uses the language state and available translations from the context to determine if the language code should be added.
 * @param Component - The component to be wrapped by this HOC.
 * @returns A new component with language parameter handling.
 */
const withLanguageParam = <P extends object>(Component: ComponentType<P>) => {
    return (props: P) => {
        const languageState: LanguageState = useAppSelector((state) => state.language);
        const languageCode = languageState.id;
        const rawParams = useParams<RouteParams>();
        const params = useMemo(() => rawParams, [rawParams]);
        const navigate = useNavigate();
        const location = useLocation();

        useEffect(() => {
            if (!languageCode) {
                return;
            }

            // If the URL already contains a language segment, preserve it.
            if (params.language) {
                return;
            }

            const targetLanguage = languageCode.toLowerCase();
            const normalizedPathname = location.pathname.endsWith('/')
                ? location.pathname.slice(0, -1)
                : location.pathname;
            const newPathname = `${normalizedPathname}/${targetLanguage}`;

            navigate(
                {
                    pathname: newPathname,
                    search: location.search,
                    hash: location.hash,
                },
                { replace: true },
            );
        }, [languageCode, location.hash, location.pathname, location.search, navigate, params.language]);

        return <Component {...props} />;
    };
};

export default withLanguageParam;
