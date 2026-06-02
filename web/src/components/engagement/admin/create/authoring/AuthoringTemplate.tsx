import React, { Suspense, useEffect, useLayoutEffect } from 'react';
import { Form, useParams, Await, Outlet, useLocation, useMatch, useRouteLoaderData } from 'react-router';
import AuthoringBottomNav from './AuthoringBottomNav';
import type { EngagementUpdateData } from './AuthoringContext';
import { useFormContext } from 'react-hook-form';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { ResponsiveContainer } from 'components/common/Layout';
import { Heading1, Heading2 } from 'components/common/Typography';
import { BodyText } from 'components/common/Typography/Body';
import { useAppDispatch, useAppSelector } from 'hooks';
import { Language } from 'models/language';
import { getAuthoringRoutes } from './AuthoringNavElements';
import { Engagement } from 'models/engagement';
import { EngagementLoaderAdminData } from 'components/engagement/admin/EngagementLoaderAdmin';
import { saveLanguage } from 'reduxSlices/languageSlice';
import Grid from '@mui/material/Grid2';
import { StatusLabel } from './StatusLabel';
import AuthoringMorePreform from './AuthoringMorePreform';
import { ROUTES } from 'routes/routes';
import { useAuthoringFormContext } from './AuthoringFormContext';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import {
    AUTHORING_SECTION_NAMES,
    AuthoringSectionName,
    useAuthoringSectionCompletion,
} from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';
import { SystemMessage } from 'components/common/Layout/SystemMessage';

export const getLanguageValue = (languageCode: string, languages: Language[]) => {
    if (languageCode === 'en') {
        return 'English';
    }
    return languages.find((language) => language.code === languageCode)?.name || '';
};

const isAuthoringSectionName = (value: string | undefined): value is AuthoringSectionName => {
    return value !== undefined && (AUTHORING_SECTION_NAMES as readonly string[]).includes(value);
};

const AuthoringTemplate = () => {
    const { onSubmit, defaultValues, setDefaultValues, fetcher } = useAuthoringFormContext();
    const { engagementId, languageCode } = useParams() as { engagementId: string; languageCode: string };
    const location = useLocation();
    const { engagement, languages } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const dispatch = useAppDispatch();
    const currentLanguage = useAppSelector((state) => state.language);
    const [selectedLanguages, setSelectedLanguages] = React.useState<Language[]>([]);
    const [isLoadingSelectedLanguages, setIsLoadingSelectedLanguages] = React.useState(true);
    const selectedLanguageCodes = React.useMemo(
        () => selectedLanguages.map((language) => language.code),
        [selectedLanguages],
    );

    useEffect(() => {
        let isMounted = true;
        setIsLoadingSelectedLanguages(true);

        void languages
            .then((resolvedLanguages) => {
                if (!isMounted) {
                    return;
                }
                setSelectedLanguages(resolvedLanguages);
            })
            .finally(() => {
                if (!isMounted) {
                    return;
                }
                setIsLoadingSelectedLanguages(false);
            });

        return () => {
            isMounted = false;
        };
    }, [languages]);

    // Sync Redux language state whenever the URL language code changes.
    useEffect(() => {
        if (!languageCode) return;
        languages.then((lngs) => {
            const lang = lngs.find((l) => l.code === languageCode);
            const name = lang?.name ?? (languageCode === 'en' ? 'English' : languageCode);
            dispatch(saveLanguage({ id: languageCode, name }));
        });
    }, [languageCode]);

    const authoringRoutes = getAuthoringRoutes(Number(engagementId), languageCode ?? 'en');
    const pageName = useMatch(ROUTES.AUTHORING_PAGE)?.params.page;
    const pageTitle = authoringRoutes.find((route) => {
        const pathArray = route.path.split('/');
        return pathArray.at(-1) === pageName;
    })?.name;
    const {
        completionBySection,
        incompleteLanguageCodesBySection,
        isLoading: isLoadingSectionCompletion,
    } = useAuthoringSectionCompletion({
        engagementId: Number(engagementId),
        languageCode: languageCode ?? 'en',
        selectedLanguageCodes,
        engagementPromise: engagement,
        refreshToken: fetcher.data,
    });
    const currentSectionName = isAuthoringSectionName(pageTitle) ? pageTitle : undefined;
    const isCurrentSectionRequired = currentSectionName
        ? ['Hero Banner', 'Summary', 'Details', 'Provide Feedback'].includes(currentSectionName)
        : false;
    let currentSectionCompletion: boolean | undefined;
    let incompleteLanguagesForCurrentSection: Language[] = [];
    if (currentSectionName !== undefined) {
        currentSectionCompletion = completionBySection[currentSectionName];

        const incompleteCodes = new Set(incompleteLanguageCodesBySection[currentSectionName] ?? []);
        incompleteLanguagesForCurrentSection = selectedLanguages.filter((language) =>
            incompleteCodes.has(language.code),
        );
    }

    const isLoadingBadgesAndMessages = isLoadingSectionCompletion || isLoadingSelectedLanguages;

    let sectionStatusBadge: React.ReactNode = null;
    if (isLoadingBadgesAndMessages) {
        sectionStatusBadge = (
            <Grid component="span" ml="0.5rem">
                <StatusLabel isLoading text="Section status" />
            </Grid>
        );
    } else if (currentSectionCompletion !== undefined) {
        sectionStatusBadge = (
            <Grid component="span" ml="0.5rem">
                <StatusLabel completed={currentSectionCompletion} />
            </Grid>
        );
    }

    const { handleSubmit } = useFormContext<EngagementUpdateData>();
    const {
        formState: { isDirty, isSubmitting },
    } = useFormContext<EngagementUpdateData>();
    const [isUnsavedWorkPromptSuppressed, setUnsavedWorkPromptSuppressed] = React.useState(false);
    const onSaveSection = handleSubmit(onSubmit);
    const outletKey = pageName ?? 'authoring';

    useLayoutEffect(() => {
        if (typeof location.state !== 'object' || location.state === null || !('authoringScrollY' in location.state)) {
            return;
        }

        const scrollY = location.state.authoringScrollY;
        if (typeof scrollY !== 'number') {
            return;
        }

        const frameId = globalThis.requestAnimationFrame(() => {
            globalThis.scrollTo(0, scrollY);
        });

        return () => {
            globalThis.cancelAnimationFrame(frameId);
        };
    }, [location.key, location.state]);

    return (
        <ResponsiveContainer>
            <AutoBreadcrumbs />
            <Grid
                mt="2rem"
                size={12}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: '0.5rem',
                    minHeight: '24px',
                }}
            >
                <Grid component="span" sx={{ display: 'inline-flex', alignItems: 'center', minHeight: '24px' }}>
                    <Suspense>
                        <Await resolve={engagement}>
                            {(engagement: Engagement) => <StatusLabel status={engagement.status_id} />}
                        </Await>
                    </Suspense>
                </Grid>
                <Grid component="span" sx={{ display: 'inline-flex', alignItems: 'center', minHeight: '24px' }}>
                    {sectionStatusBadge}
                </Grid>
            </Grid>
            {isCurrentSectionRequired &&
            incompleteLanguagesForCurrentSection.length > 0 &&
            !isLoadingBadgesAndMessages ? (
                <Grid size={12} mt="1rem">
                    <SystemMessage status="danger" sx={{ mb: '1rem' }}>
                        <BodyText component="p" m={0}>
                            There is incomplete required content in this section of your engagement page.
                        </BodyText>
                        <BodyText component="p" m={0}>
                            Required content must be added for all languages in order to publish your engagement.
                        </BodyText>
                        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
                            {incompleteLanguagesForCurrentSection.map((language) => (
                                <li key={language.code}>
                                    <strong>{language.name}</strong> content is incomplete
                                </li>
                            ))}
                        </ul>
                    </SystemMessage>
                </Grid>
            ) : null}
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
                    <UnsavedWorkConfirmation
                        blockNavigationWhen={isDirty && !isSubmitting && !isUnsavedWorkPromptSuppressed}
                    />
                    <Suspense>
                        <Await resolve={engagement}>
                            {(engagement: Engagement) => (
                                <Outlet
                                    key={outletKey}
                                    context={{
                                        setDefaultValues,
                                        engagement,
                                        defaultValues,
                                        fetcher,
                                        pageName,
                                    }}
                                />
                            )}
                        </Await>
                    </Suspense>
                    <AuthoringBottomNav
                        currentLanguage={currentLanguage}
                        languages={languages}
                        pageTitle={pageTitle || 'untitled'} // Full title
                        pageName={pageName || 'untitled'} // Slug
                        onSaveSection={onSaveSection}
                        setUnsavedWorkPromptSuppressed={setUnsavedWorkPromptSuppressed}
                    />
                </Form>
            </Grid>
        </ResponsiveContainer>
    );
};

export default AuthoringTemplate;
