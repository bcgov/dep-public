import React from 'react';
import { Form, useParams, Outlet, useMatch, useRouteLoaderData } from 'react-router';
import AuthoringBottomNav from './AuthoringBottomNav';
import type { EngagementUpdateData } from './AuthoringContext';
import { useFormContext } from 'react-hook-form';
import { Heading1, Heading2 } from 'components/common/Typography';
import { useAppDispatch, useAppSelector } from 'hooks';
import { Language } from 'models/language';
import { getAuthoringRoutes } from './AuthoringNavElements';
import { EngagementLoaderAdminData } from 'components/engagement/admin/EngagementLoaderAdmin';
import { saveLanguage } from 'reduxSlices/languageSlice';
import Grid from '@mui/material/Grid2';
import AuthoringMorePreform from './AuthoringMorePreform';
import { ROUTES } from 'routes/routes';
import { useAuthoringFormContext } from './AuthoringFormContext';

export const getLanguageValue = (languageCode: string, languages: Language[]) => {
    if (languageCode === 'en') {
        return 'English';
    }
    return languages.find((language) => language.code === languageCode)?.name || '';
};

const AuthoringTemplate = () => {
    const { onSubmit, defaultValues, setDefaultValues, fetcher } = useAuthoringFormContext();
    const { engagementId } = useParams() as { engagementId: string }; // We need the engagement ID quickly, so let's grab it from useParams
    const { engagement, languages } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const dispatch = useAppDispatch();
    const currentLanguage = useAppSelector((state) => state.language);
    const setCurrentLanguage = React.useCallback(
        (code: string, name: string) => dispatch(saveLanguage({ id: code, name: name })),
        [dispatch],
    );
    const authoringRoutes = getAuthoringRoutes(Number(engagementId));
    const pageName = useMatch(ROUTES.AUTHORING_PAGE)?.params.page;
    const pageTitle = authoringRoutes.find((route) => {
        const pathArray = route.path.split('/');
        return pathArray[pathArray.length - 1] === pageName;
    })?.name;

    const { handleSubmit } = useFormContext<EngagementUpdateData>();

    const outletKey = React.useMemo(() => pageName || 'authoring', [pageName]);

    return (
        <>
            <Grid size={12}>
                <Heading1 style={{ marginTop: '0.5rem', paddingBottom: '1rem' }}>{pageTitle}</Heading1>
            </Grid>

            {/* Portal target for anything that needs to be rendered before the section title + content */}
            <Grid size={12} id="pre-authoring-content">
                {pageName === 'more' && <AuthoringMorePreform languages={languages} />}
            </Grid>

            <Grid size={12}>
                <Heading2 decorated style={{ paddingTop: '1rem' }}>
                    {currentLanguage.name}
                </Heading2>
            </Grid>

            <Grid size={12}>
                <Form onSubmit={handleSubmit(onSubmit)} id="authoring-form">
                    <Outlet
                        key={outletKey}
                        context={{
                            setDefaultValues,
                            engagementId: engagementId, // Instant
                            engagement: engagement, // Async
                            defaultValues,
                            fetcher,
                            pageName,
                        }}
                    />
                    <AuthoringBottomNav
                        currentLanguage={currentLanguage}
                        setCurrentLanguage={setCurrentLanguage}
                        languages={languages}
                        pageTitle={pageTitle || 'untitled'} // Full title
                        pageName={pageName || 'untitled'} // Slug
                    />
                </Form>
            </Grid>
        </>
    );
};

export default AuthoringTemplate;
