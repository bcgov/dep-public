import React, { Suspense, useEffect, useLayoutEffect } from 'react';
import { Form, useParams, Await, Outlet, useLocation, useMatch, useRouteLoaderData, useNavigate } from 'react-router';
import AuthoringBottomNav from './AuthoringBottomNav';
import type { EngagementUpdateData } from './AuthoringContext';
import { useFormContext } from 'react-hook-form';
import { Heading1, Heading2 } from 'components/common/Typography';
import { BodyText } from 'components/common/Typography/Body';
import { useAppDispatch, useAppSelector } from 'hooks';
import { Language } from 'models/language';
import { getAuthoringRoutes } from './AuthoringNavElements';
import { Engagement } from 'models/engagement';
import { EngagementLoaderAdminData } from 'components/engagement/admin/EngagementLoaderAdmin';
import { saveLanguage } from 'reduxSlices/languageSlice';
import Grid from '@mui/material/Grid2';
import Collapse from '@mui/material/Collapse';
import { StatusLabel } from './StatusLabel';
import AuthoringMorePreform from './AuthoringMorePreform';
import { ROUTES, getPath } from 'routes/routes';
import { AuthoringFormContext, useAuthoringFormContext } from './AuthoringFormContext';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import {
    AUTHORING_SECTION_NAMES,
    REQUIRED_AUTHORING_SECTION_NAMES,
    AuthoringSectionName,
    useAuthoringSectionCompletion,
} from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';
import { SystemMessage } from 'components/common/Layout/SystemMessage';
import { AppConfig } from 'config';
import { openNotification } from 'services/notificationService/notificationSlice';
import useResourceSectionEditLock from 'services/resourceLockService/useResourceSectionEditLock';
import { getLockConflictPayload } from 'services/resourceLockService';
import {
    findSectionLock,
    getLockTargetBySectionName,
    getAuthoringSectionNameByPage,
} from 'components/locking/useResourceSectionLocks';
import useResourceSectionLockNavigation from 'components/locking/useResourceSectionLockNavigation';
import { AuthoringContextType } from './types';

const DEFAULT_LANGUAGE_CODE = AppConfig.language.defaultLanguageId.toLowerCase();
const DEFAULT_LANGUAGE_NAME = AppConfig.language.defaultLanguageName;
const LOCK_HEARTBEAT_INTERVAL_MS = 30000;
const AUTHORING_UNSAVED_CHANGES_KEY = 'authoring-unsaved-changes';
const REQUIRED_AUTHORING_SECTION_NAME_SET = new Set<AuthoringSectionName>(REQUIRED_AUTHORING_SECTION_NAMES);

export const getLanguageValue = (languageCode: string, languages: Language[]) => {
    if (languageCode === DEFAULT_LANGUAGE_CODE) {
        return DEFAULT_LANGUAGE_NAME;
    }
    return languages.find((language) => language.code === languageCode)?.name || '';
};

const isAuthoringSectionName = (value: string | undefined): value is AuthoringSectionName => {
    return value !== undefined && (AUTHORING_SECTION_NAMES as readonly string[]).includes(value);
};

const AuthoringTemplate = () => {
    const {
        onSubmit,
        defaultValues,
        setDefaultValues,
        fetcher,
        setActiveLockLanguageId,
        setActiveLockSectionKey,
        setActiveLockToken,
        lockScopeWideningRequested,
        setLockScopeWideningRequested,
    } = useAuthoringFormContext();
    const { engagementId, languageCode } = useParams() as { engagementId: string; languageCode: string };
    const navigate = useNavigate();
    const activeLanguageCode = (languageCode ?? DEFAULT_LANGUAGE_CODE).toLowerCase();
    const location = useLocation();
    const { engagement, languages, details } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const dispatch = useAppDispatch();
    const currentLanguage = useAppSelector((state) => state.language);
    const {
        languageOptions,
        isLoadingLanguageOptions: isLoadingSelectedLanguages,
        locks,
        languageId,
        refreshLocks,
    } = React.useContext(AuthoringFormContext as React.Context<AuthoringContextType>);
    const selectedLanguageCodes = React.useMemo(
        () => languageOptions.map((language) => language.code),
        [languageOptions],
    );

    // Sync Redux language state whenever the URL language code changes.
    useEffect(() => {
        languages.then((lngs) => {
            const lang = lngs.find((l) => l.code === activeLanguageCode);
            const name =
                lang?.name ??
                (activeLanguageCode === DEFAULT_LANGUAGE_CODE ? DEFAULT_LANGUAGE_NAME : activeLanguageCode);
            dispatch(saveLanguage({ id: activeLanguageCode, name }));
        });
    }, [activeLanguageCode, dispatch, languages]);

    const authoringRoutes = getAuthoringRoutes(Number(engagementId), activeLanguageCode);
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
        languageCode: activeLanguageCode,
        selectedLanguageCodes,
        engagementPromise: engagement,
        detailsTabsPromise: details,
    });
    const currentSectionName = isAuthoringSectionName(pageTitle) ? pageTitle : undefined;
    const isCurrentSectionRequired = currentSectionName
        ? REQUIRED_AUTHORING_SECTION_NAME_SET.has(currentSectionName)
        : false;
    let currentSectionCompletion: boolean | undefined;
    let incompleteLanguagesForCurrentSection: Language[] = [];
    if (currentSectionName !== undefined) {
        currentSectionCompletion = completionBySection[currentSectionName];

        const incompleteCodes = new Set(incompleteLanguageCodesBySection[currentSectionName] ?? []);
        incompleteLanguagesForCurrentSection = languageOptions.filter((language) => incompleteCodes.has(language.code));
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
    const outletKey = pageName ?? 'authoring';
    const currentSectionFromPage = React.useMemo(() => {
        return getAuthoringSectionNameByPage(pageName);
    }, [pageName]);
    const currentSectionLockContext = React.useMemo(() => {
        if (!currentSectionFromPage) {
            return null;
        }

        const target = getLockTargetBySectionName(currentSectionFromPage);
        if (!target) {
            return null;
        }

        return {
            sectionKey: target.sectionKey,
            useLanguageScope: target.languageScoped,
        };
    }, [currentSectionFromPage]);
    const conflictingSectionLock = React.useMemo(() => {
        if (!currentSectionFromPage) {
            return null;
        }

        const sectionLock = findSectionLock({
            locks,
            languageId,
            sectionName: currentSectionFromPage,
        });

        if (!sectionLock || sectionLock.is_mine) {
            return null;
        }

        return sectionLock;
    }, [currentSectionFromPage, languageId, locks]);

    const handleBackToAuthoringTab = React.useCallback(() => {
        navigate(getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId: Number(engagementId) }));
    }, [engagementId, navigate]);

    const refreshConflictState = React.useCallback(async () => {
        await refreshLocks();
    }, [refreshLocks]);

    const { conflictLockModal } = useResourceSectionLockNavigation({
        conflictModal: {
            lock: conflictingSectionLock,
            sectionName: currentSectionFromPage ?? undefined,
            onBack: handleBackToAuthoringTab,
            onRetry: refreshConflictState,
            onAfterBreakLock: refreshConflictState,
        },
    });

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

    useEffect(() => {
        sessionStorage.setItem(AUTHORING_UNSAVED_CHANGES_KEY, isDirty && !isSubmitting ? '1' : '0');

        return () => {
            sessionStorage.setItem(AUTHORING_UNSAVED_CHANGES_KEY, '0');
        };
    }, [isDirty, isSubmitting]);

    // A structural (add/remove) change only applies to the section the user was on when they made it.
    useEffect(() => {
        setLockScopeWideningRequested(false);
    }, [pageName, setLockScopeWideningRequested]);

    const { activeLockScope, activeLockToken } = useResourceSectionEditLock({
        resourceId: Number(engagementId),
        scope: currentSectionLockContext
            ? {
                  sectionKey: currentSectionLockContext.sectionKey,
                  languageId:
                      currentSectionLockContext.useLanguageScope && !lockScopeWideningRequested
                          ? languageId
                          : undefined,
              }
            : null,
        enabled: Boolean(engagementId),
        isDirty,
        isSubmitting,
        blockedByLock: conflictingSectionLock,
        heartbeatIntervalMs: LOCK_HEARTBEAT_INTERVAL_MS,
        onConflict: async (error) => {
            const conflictPayload = getLockConflictPayload(error);
            if (conflictPayload) {
                await refreshConflictState();
                return;
            }

            const message = error instanceof Error ? error.message : 'Unable to acquire edit lock for this section.';
            dispatch(
                openNotification({
                    severity: 'error',
                    text: message,
                }),
            );
        },
    });

    useEffect(() => {
        setActiveLockToken(activeLockToken);
        setActiveLockSectionKey(activeLockScope?.sectionKey ?? null);
        setActiveLockLanguageId(activeLockScope?.languageId);

        return () => {
            setActiveLockToken(null);
            setActiveLockSectionKey(null);
            setActiveLockLanguageId(undefined);
        };
    }, [
        activeLockScope?.languageId,
        activeLockScope?.sectionKey,
        activeLockToken,
        setActiveLockLanguageId,
        setActiveLockSectionKey,
        setActiveLockToken,
    ]);

    return (
        <Grid container>
            {conflictLockModal}
            <Grid container size={12} mt={2} alignItems="center" columnGap="0.5rem" minHeight="24px">
                <Grid component="span" sx={{ display: 'inline-flex', alignItems: 'center', minHeight: '24px' }}>
                    <Suspense fallback={<StatusLabel isLoading />}>
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
                    <Collapse in appear easing="cubic-bezier(.5,0,.5,1)">
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
                    </Collapse>
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
                        pageTitle={pageTitle || 'untitled'} // Full title
                        pageName={pageName || 'untitled'} // Slug
                        currentSectionIncompleteLanguageCodes={incompleteLanguagesForCurrentSection.map(
                            (language) => language.code,
                        )}
                        isSectionCompletionLoading={isLoadingBadgesAndMessages}
                        setUnsavedWorkPromptSuppressed={setUnsavedWorkPromptSuppressed}
                    />
                </Form>
            </Grid>
        </Grid>
    );
};

export default AuthoringTemplate;
