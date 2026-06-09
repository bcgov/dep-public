import React, { useEffect, ComponentType, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
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

        useEffect(() => {
            const currentUrl = globalThis.location.pathname;
            if (languageCode && !currentUrl.includes(languageCode)) {
                let newUrl = currentUrl;

                for (const param in params) {
                    if (params[param as keyof RouteParams]) {
                        newUrl = newUrl.replace(`:${param}`, params[param as keyof RouteParams] as string);
                    }
                }

                newUrl = newUrl.replace(':language', languageCode);

                navigate(newUrl, { replace: true });
            }
        }, [languageCode, navigate, params]);

        return <Component {...props} />;
    };
};

export default withLanguageParam;
