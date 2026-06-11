import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useEngagementLoaderData } from './PreviewLoaderDataContext';
import { ROUTES, getPath } from 'routes/routes';
import EngagementLanguageSwitcher from 'components/engagement/shared/EngagementLanguageSwitcher';

export const PreviewLanguageSwitcher = () => {
    const navigate = useNavigate();
    const { engagementId, languageCode } = useParams();
    const { translationLanguages } = useEngagementLoaderData();

    if (!engagementId || !translationLanguages) {
        return null;
    }

    return (
        <EngagementLanguageSwitcher
            menuName="Preview Language Menu"
            translationLanguages={translationLanguages}
            currentLanguageCode={languageCode}
            onLanguageSelect={(nextLanguageCode) => {
                globalThis.sessionStorage.setItem('languageId', nextLanguageCode);
                navigate(
                    getPath(ROUTES.ADMIN_ENGAGEMENT_PREVIEW, {
                        engagementId,
                        languageCode: nextLanguageCode,
                    }),
                );
            }}
        />
    );
};

export default PreviewLanguageSwitcher;
