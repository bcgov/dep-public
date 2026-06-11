import React, { useContext } from 'react';
import { useNavigate, useParams } from 'react-router';
import { usePreview } from 'components/engagement/preview/PreviewContext';
import { ROUTES, getPath } from 'routes/routes';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { AuthKeyCloakContext } from 'components/auth/AuthKeycloakContext';
import EngagementLanguageSwitcher from 'components/engagement/shared/EngagementLanguageSwitcher';

export const PublicLanguageSwitcher = () => {
    const navigate = useNavigate();
    const { slug, language } = useParams();
    const { isPreviewMode } = usePreview();
    const { isAuthenticated } = useContext(AuthKeyCloakContext);
    const { translationLanguages } = useEngagementLoaderData();

    if (isPreviewMode || !slug || !translationLanguages) {
        return null;
    }

    return (
        <EngagementLanguageSwitcher
            menuName="Public Language Menu"
            translationLanguages={translationLanguages}
            currentLanguageCode={language}
            top={isAuthenticated ? { xs: '8px', md: '12px' } : 0}
            onLanguageSelect={(languageCode) => {
                navigate(
                    getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                        slug,
                        language: languageCode,
                    }),
                );
            }}
        />
    );
};

export default PublicLanguageSwitcher;
