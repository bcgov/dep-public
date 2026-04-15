import React, { useEffect, useState } from 'react';
import { Outlet, useRouteLoaderData } from 'react-router';
import { MidScreenLoader } from 'components/common';
import { useAppDispatch, useAppSelector } from 'hooks';
import { loadingTenant, saveTenant } from 'reduxSlices/tenantSlice';
import { RootLoaderData } from './RootRouteLoader';
import { loadingLanguage } from 'reduxSlices/languageSlice';
import { openNotification } from 'services/notificationService/notificationSlice';
import i18n from '../i18n';
import { AppConfig } from 'config';

const RootRoute = () => {
    const dispatch = useAppDispatch();
    const currentTenantId = useAppSelector((state) => state.tenant.id);
    const selectedLanguageId = useAppSelector((state) => state.language.id);
    const { tenant, preferredLanguageId, translations } = useRouteLoaderData('root') as RootLoaderData;
    const [translationsReady, setTranslationsReady] = useState(false);

    useEffect(() => {
        sessionStorage.setItem('tenantId', tenant.id);
        sessionStorage.setItem('basename', tenant.basename);
        dispatch(saveTenant(tenant));
        dispatch(loadingTenant(false));
    }, [dispatch, tenant]);

    useEffect(() => {
        let cancelled = false;
        const applyTranslations = async () => {
            try {
                const loadedTranslations = await translations;
                const activeLanguageId = loadedTranslations[selectedLanguageId]
                    ? selectedLanguageId
                    : loadedTranslations[preferredLanguageId]
                      ? preferredLanguageId
                      : AppConfig.language.defaultLanguageId;

                i18n.changeLanguage(activeLanguageId);
                i18n.addResourceBundle(activeLanguageId, 'default', loadedTranslations[activeLanguageId], true, true);
                if (loadedTranslations.common) {
                    i18n.addResourceBundle(activeLanguageId, 'common', loadedTranslations.common, true, true);
                }
            } catch {
                dispatch(
                    openNotification({
                        text: 'Error while trying to load texts. Please try again later.',
                        severity: 'error',
                    }),
                );
            } finally {
                if (!cancelled) {
                    dispatch(loadingLanguage(false));
                    setTranslationsReady(true);
                }
            }
        };

        applyTranslations();

        return () => {
            cancelled = true;
        };
    }, [dispatch, preferredLanguageId, selectedLanguageId, translations]);

    if (currentTenantId !== tenant.id || !translationsReady) {
        return <MidScreenLoader message="Loading tenant..." />;
    }

    return <Outlet />;
};

export default RootRoute;
