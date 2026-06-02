import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AppBar,
    Theme,
    ThemeProvider,
    Grid2 as Grid,
    useMediaQuery,
    Select,
    MenuItem,
    SelectChangeEvent,
    Modal,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import { colors, AdminDarkTheme, AdminTheme, ZIndex } from 'styles/Theme';
import { When, Unless } from 'react-if';
import { BodyText } from 'components/common/Typography/Body';
import { elevations } from 'components/common';
import { Button } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/pro-regular-svg-icons';
import { StatusCircle } from '../../view/AuthoringTab';
import { ReactComponent as PagePreviewIcon } from 'assets/images/pagePreview.svg';
import { AuthoringBottomNavProps, LanguageSelectorProps } from './types';
import { useFormContext } from 'react-hook-form';
import { EngagementUpdateData } from './AuthoringContext';
import { ResponsiveContainer } from 'components/common/Layout';
import { Await, useMatch, useNavigate, useParams } from 'react-router';
import ConfirmModal from 'components/common/Modals/ConfirmModal';
import { Language } from 'models/language';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { EngagementViewSections } from 'components/engagement/public/view';
import { useAuthoringPreviewWindow } from './AuthoringPreviewWindowContext';
import { getPath, ROUTES } from 'routes/routes';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { createEngagementTranslation, getEngagementTranslationByLanguage } from 'services/engagementService';
import axios from 'axios';
import { AppConfig } from 'config';
const PREVIEW_CLOSE_GRACE_MS = 800;

const AuthoringBottomNav = ({
    currentLanguage,
    languages,
    pageTitle,
    pageName,
    onSaveSection,
    setUnsavedWorkPromptSuppressed,
}: Omit<AuthoringBottomNavProps, 'setCurrentLanguage'>) => {
    const {
        setValue,
        formState: { isDirty, isSubmitting },
    } = useFormContext<EngagementUpdateData>();
    const { engagementId, languageCode } = useParams();
    const isMediumScreenOrLarger = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
    const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
    const [atFooter, setAtFooter] = useState(false);
    const navRef = useRef<HTMLDivElement | null>(null);
    const {
        getActivePreviewWindow,
        setPreviewWindow,
        cancelScheduledPreviewClose,
        schedulePreviewClose,
        closePreviewWindow,
    } = useAuthoringPreviewWindow();
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();

    const getBasePathPrefix = () => {
        const basename = sessionStorage.getItem('basename');
        return basename ? `/${basename}` : '';
    };

    const getPreviewSectionHash = (section?: string) => {
        switch (section) {
            case 'banner':
                return `#${EngagementViewSections.HERO}`;
            case 'summary':
                return `#${EngagementViewSections.DESCRIPTION}`;
            case 'details':
                return `#${EngagementViewSections.DETAILS_TABS}`;
            case 'feedback':
                return `#${EngagementViewSections.PROVIDE_FEEDBACK}`;
            case 'results':
                return `#${EngagementViewSections.VIEW_RESULTS}`;
            case 'subscribe':
                return `#${EngagementViewSections.SUBSCRIBE}`;
            case 'more':
                return `#${EngagementViewSections.MORE_ENGAGEMENTS}`;
            default:
                return `#${EngagementViewSections.HERO}`;
        }
    };

    const getTargetPreviewBasePath = () =>
        `${getBasePathPrefix()}${getPath(ROUTES.ADMIN_ENGAGEMENT_PREVIEW, {
            engagementId: engagementId ?? '',
            languageCode: languageCode ?? defaultLanguageCode,
        })}`;

    const postPreviewScrollMessage = (previewWindow: Window, section?: string) => {
        const targetHash = getPreviewSectionHash(section);
        const targetId = targetHash.replace('#', '');
        const message = { type: 'preview-scroll', targetId };

        [0, 120, 320].forEach((delayMs) => {
            globalThis.setTimeout(() => {
                if (!previewWindow.closed) {
                    previewWindow.postMessage(message, globalThis.location.origin);
                }
            }, delayMs);
        });

        try {
            const targetPathWithHash = `${getTargetPreviewBasePath()}${targetHash}`;
            previewWindow.history.replaceState(null, '', targetPathWithHash);
        } catch {
            return;
        }
    };

    const postPreviewRefreshMessage = (previewWindow: Window | null) => {
        const message = { type: 'preview-refresh' };
        if (previewWindow && !previewWindow.closed) {
            previewWindow?.postMessage(message, globalThis.location.origin);
        }
    };

    const syncPreviewWindowUrl = (section?: string) => {
        const previewWindow = getActivePreviewWindow();
        if (!previewWindow || previewWindow.closed) return;

        const targetPath = getTargetPreviewBasePath();
        try {
            const targetUrl = new URL(targetPath, globalThis.location.origin);
            const currentPath = previewWindow.location.pathname;
            if (currentPath !== targetUrl.pathname) {
                previewWindow.location.replace(targetPath);
                [250, 700, 1300].forEach((delayMs) => {
                    globalThis.setTimeout(() => {
                        const activePreviewWindow = getActivePreviewWindow();
                        if (!activePreviewWindow) return;
                        try {
                            if (activePreviewWindow.location.pathname === targetUrl.pathname) {
                                postPreviewScrollMessage(activePreviewWindow, section);
                            }
                        } catch {
                            return;
                        }
                    }, delayMs);
                });
                return;
            }
            postPreviewScrollMessage(previewWindow, section);
        } catch {
            previewWindow.location.replace(targetPath);
        }
    };

    useEffect(() => {
        cancelScheduledPreviewClose();

        const handleBeforeUnload = () => {
            closePreviewWindow();
        };

        globalThis.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            globalThis.removeEventListener('beforeunload', handleBeforeUnload);
            schedulePreviewClose(PREVIEW_CLOSE_GRACE_MS);
        };
    }, [cancelScheduledPreviewClose, closePreviewWindow, schedulePreviewClose]);

    useEffect(() => {
        syncPreviewWindowUrl(pageName);
        const interval = globalThis.setInterval(() => {
            const previewWindow = getActivePreviewWindow();
            if (!previewWindow || previewWindow.closed) return;

            const expectedPathPrefix = `${getBasePathPrefix()}/${getPath(ROUTES.ADMIN_ENGAGEMENT_PREVIEW, {
                engagementId: engagementId ?? '',
                languageCode: languageCode ?? defaultLanguageCode,
            })}`;
            try {
                if (!previewWindow.location.pathname.startsWith(expectedPathPrefix)) {
                    syncPreviewWindowUrl(pageName);
                }
            } catch {
                syncPreviewWindowUrl(pageName);
            }
        }, 10000);

        return () => {
            globalThis.clearInterval(interval);
        };
    }, [engagementId, languageCode, pageName]);

    useLayoutEffect(() => {
        const footer = document.querySelector('footer');
        const hostParent = footer?.parentElement ?? document.body;
        const placeholder = document.createElement('div');
        placeholder.id = 'authoring-bottom-nav-portal';
        placeholder.style.position = 'relative';
        placeholder.style.zIndex = `${ZIndex.sideNav}`; // keep above page content
        placeholder.style.width = '100%';
        placeholder.style.top = '2em'; // slight offset to avoid any potential overlap with footer content
        hostParent.insertBefore(placeholder, footer ?? null);
        setPortalEl(placeholder);

        let footerObserver: IntersectionObserver | null = null;
        if (footer) {
            footerObserver = new IntersectionObserver(
                (entries) => {
                    const intersecting = entries.some((entry) => entry.isIntersecting);
                    setAtFooter(intersecting);
                },
                { threshold: 0 },
            );
            footerObserver.observe(footer);
        }

        return () => {
            footerObserver?.disconnect();
            placeholder.remove();
            setPortalEl(null);
        };
    }, []);

    useLayoutEffect(() => {
        if (!portalEl || !navRef.current) return;
        const updateHeight = () => {
            portalEl.style.height = `${navRef.current?.offsetHeight ?? 0}px`;
        };
        updateHeight();
        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(navRef.current);
        globalThis.addEventListener('resize', updateHeight, { passive: true });
        return () => {
            resizeObserver.disconnect();
            globalThis.removeEventListener('resize', updateHeight);
        };
    }, [portalEl]);

    if (!portalEl) return null;

    const handleSaveSection = () => {
        setValue('request_type', 'update');
        onSaveSection();
    };

    const fixedPosition = {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
    };
    const absolutePosition = {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
    };

    return createPortal(
        <AppBar
            component={'nav'}
            position="static"
            ref={navRef}
            sx={{
                backgroundColor: 'transparent',
                borderTopRightRadius: '16px',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
                minHeight: '5rem',
                backgroundClip: 'padding-box',
                overflow: 'hidden',
                top: 'auto',
                boxShadow: elevations.default,
                ...(atFooter ? absolutePosition : fixedPosition),
            }}
            data-testid="appbar-authoring-bottom-nav"
        >
            <Grid
                container
                sx={{
                    background: colors.surface.blue[90],
                    minHeight: '5rem',
                    justifyContent: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: isMediumScreenOrLarger ? 'nowrap' : 'wrap',
                }}
            >
                <ThemeProvider theme={AdminDarkTheme}>
                    <Grid
                        container
                        mb={isMediumScreenOrLarger ? 0 : '1rem'}
                        pl={{ xs: '1em', md: '3.1rem' }}
                        pt={{ xs: '2rem', md: '0' }}
                        width="18.75rem"
                    >
                        <Grid size={12}>
                            <BodyText bold>Currently Authoring</BodyText>
                        </Grid>
                        <Grid>
                            <BodyText
                                sx={{ fontSize: '0.7rem', alignItems: 'center', marginTop: '-5px', display: 'flex' }}
                            >
                                <span>{pageTitle}</span>
                                <span style={{ fontSize: '0.4rem', paddingLeft: '0.4rem', paddingRight: '0.4rem' }}>
                                    {'\u2B24'}
                                </span>
                                {currentLanguage.name}
                            </BodyText>
                        </Grid>
                    </Grid>
                    <ResponsiveContainer
                        sx={{
                            width: '100%',
                            maxWidth: { xs: 'calc(2em + 700px)', md: 'calc(3rem + 700px)', lg: 'calc(6.2rem + 700px)' },
                            justifyContent: 'flex-start',
                            display: 'flex',
                            // Overrides needed for multiple viewports.
                            pt: { xs: '0', md: '1em', lg: '1em', xl: '1em' },
                            pb: { xs: '2em', md: '1em', lg: '1em', xl: '1em' },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: '1rem',
                        }}
                    >
                        <Grid className="button-container" container flexWrap="nowrap" size={12} gap="1rem">
                            <ThemeProvider theme={AdminTheme}>
                                <LanguageSelector
                                    currentLanguage={currentLanguage}
                                    languages={languages}
                                    isDirty={isDirty}
                                    isSubmitting={isSubmitting}
                                    setUnsavedWorkPromptSuppressed={setUnsavedWorkPromptSuppressed}
                                />
                            </ThemeProvider>
                            <Button
                                disabled={!isDirty || isSubmitting}
                                type="button"
                                onClick={handleSaveSection}
                                variant="primary"
                                size="small"
                                sx={{
                                    color: colors.type.regular.primary,
                                    fontSize: '0.875rem',
                                    minWidth: 'max-content',
                                    paddingX: { xs: '0.5rem', sm: '1.5rem' },
                                }}
                            >
                                Save Section
                            </Button>
                            <Tooltip
                                placement="top"
                                title={
                                    <BodyText size="small" color="currentcolor">
                                        Opens in new window <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                                    </BodyText>
                                }
                            >
                                <Button
                                    variant="primary"
                                    size="small"
                                    type="button"
                                    href={`${getTargetPreviewBasePath()}${getPreviewSectionHash(pageName)}`}
                                    icon={<PagePreviewIcon aria-hidden="true" />}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        // If the preview window is still open, resfresh the data and bring it to the foreground
                                        const window = getActivePreviewWindow();
                                        if (window) {
                                            postPreviewRefreshMessage(window);
                                            window?.focus();
                                            return;
                                        }
                                        // Cancel the navigation and open the preview in a new browser window instead, to avoid losing unsaved changes
                                        const {
                                            screenLeft,
                                            screenTop,
                                            screen: { availHeight, availWidth },
                                        } = globalThis;
                                        // Calculate the position to split the screen in half and open the preview in the center of the right half
                                        const previewHeight = availHeight - 75; // leave some space to avoid overlapping with browser UI
                                        const previewWidth = availWidth / 2; // open in the center of the right half, leaving some space on the sides
                                        const left = screenLeft + availWidth / 2;
                                        const top = screenTop + 37;
                                        const openedPreviewWindow = globalThis.open(
                                            `${getTargetPreviewBasePath()}${getPreviewSectionHash(pageName)}`,
                                            '_blank',
                                            `width=${previewWidth},height=${previewHeight},top=${top},left=${left},location`,
                                        );
                                        setPreviewWindow(openedPreviewWindow);
                                        if (openedPreviewWindow) {
                                            postPreviewScrollMessage(openedPreviewWindow, pageName);
                                        }
                                    }}
                                    LinkComponent={RouterLinkRenderer}
                                    target="_blank"
                                    sx={{
                                        marginLeft: 'auto',
                                        color: colors.type.regular.primary,
                                        fontSize: '0.875rem',
                                        minWidth: 'max-content',
                                        paddingX: { xs: '0.5rem', sm: '1.5rem' },
                                    }}
                                >
                                    Preview
                                </Button>
                            </Tooltip>
                        </Grid>
                    </ResponsiveContainer>
                </ThemeProvider>
            </Grid>
        </AppBar>,
        portalEl,
    );
};

const LanguageSelector = ({
    currentLanguage,
    languages,
    isDirty,
    isSubmitting,
    setUnsavedWorkPromptSuppressed,
}: Omit<LanguageSelectorProps, 'setCurrentLanguage'>) => {
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const { engagementId, languageCode: urlLanguageCode } = useParams();
    const navigate = useNavigate();
    const pageName = useMatch(ROUTES.AUTHORING_PAGE)?.params.page;
    const dispatch = useAppDispatch();
    const [languageModalOpen, setLanguageModalOpen] = useState(false);
    const [newLanguage, setNewLanguage] = useState('');
    const [languageList, setLanguageList] = useState<Language[]>([]);
    const [languagesLoaded, setLanguagesLoaded] = useState(false);
    const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);

    const isEnglishOnly = languagesLoaded && languageList.length <= 1;

    useEffect(() => {
        languages.then((lngs) => {
            setLanguageList(lngs);
            setLanguagesLoaded(true);
        });
    }, [languages]);

    useEffect(() => {
        if (!languagesLoaded) {
            return;
        }
        if (isEnglishOnly && currentLanguage.id !== defaultLanguageCode) {
            navigate(
                getPath(ROUTES.AUTHORING_PAGE, {
                    engagementId: engagementId ?? '',
                    languageCode: defaultLanguageCode,
                    page: pageName ?? 'banner',
                }),
                {
                    state: {
                        preserveScroll: true,
                        authoringScrollY: globalThis.scrollY,
                    },
                },
            );
        }
    }, [defaultLanguageCode, languagesLoaded, isEnglishOnly, currentLanguage.id, navigate, engagementId, pageName]);

    const ensureTranslationResources = async (languageCode: string): Promise<boolean> => {
        if (languageCode === defaultLanguageCode) {
            return true;
        }

        const id = Number(engagementId);
        if (!id || Number.isNaN(id)) {
            dispatch(openNotification({ severity: 'error', text: 'Unable to switch language for this engagement.' }));
            return false;
        }

        const selectedLanguage = languageList.find((language) => language.code === languageCode);
        if (!selectedLanguage?.id) {
            dispatch(openNotification({ severity: 'error', text: 'Selected language is not available.' }));
            return false;
        }

        try {
            const existingTranslations = await getEngagementTranslationByLanguage(id, selectedLanguage.id);
            if (existingTranslations.length === 0) {
                await createEngagementTranslation(id, selectedLanguage.id);
            }
            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                return true;
            }
            dispatch(openNotification({ severity: 'error', text: 'Unable to load translation resources.' }));
            return false;
        }
    };

    const switchLanguage = async (languageCode: string) => {
        setIsSwitchingLanguage(true);
        const ready = await ensureTranslationResources(languageCode);
        if (ready) {
            navigate(
                getPath(ROUTES.AUTHORING_PAGE, {
                    engagementId: engagementId ?? '',
                    languageCode,
                    page: pageName ?? 'banner',
                }),
                {
                    state: {
                        preserveScroll: true,
                        authoringScrollY: globalThis.scrollY,
                    },
                },
            );
            return true;
        }
        setUnsavedWorkPromptSuppressed(false);
        setIsSwitchingLanguage(false);
        return false;
    };

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        if (!isSubmitting && !isSwitchingLanguage && !isEnglishOnly) {
            const newLang = event.target.value;
            setNewLanguage(newLang);
            if (isDirty) {
                setUnsavedWorkPromptSuppressed(true);
                setLanguageModalOpen(true);
            } else {
                void switchLanguage(newLang);
            }
        }
    };

    const languageModalConfirm = async () => {
        setUnsavedWorkPromptSuppressed(true);
        const changed = await switchLanguage(newLanguage);
        if (!changed) {
            setUnsavedWorkPromptSuppressed(false);
        }
        setLanguageModalOpen(false);
    };

    return (
        <>
            {/* confirm that the user wants to switch languages */}
            <Modal open={languageModalOpen} aria-describedby="publish-modal-subtext">
                <ConfirmModal
                    style="warning"
                    header={`Are you sure you want to switch to ${currentLanguage.name || 'another language'}?`}
                    subHeader={`You have unsaved changes for the ${currentLanguage.name || 'current'} language.`}
                    subTextId="publish-modal-subtext"
                    subText={[
                        {
                            text: 'It is suggested that you save your current changes first.',
                            bold: false,
                        },
                    ]}
                    handleConfirm={languageModalConfirm}
                    handleClose={() => {
                        setUnsavedWorkPromptSuppressed(false);
                        setLanguageModalOpen(false);
                    }}
                    confirmButtonText={'Change Language'}
                    cancelButtonText={'Cancel & Go Back'}
                />
            </Modal>
            <Suspense
                fallback={
                    <Select
                        disabled
                        renderValue={() => <CircularProgress sx={{ position: 'relative', top: '3px' }} size={20} />}
                        value="loading"
                        sx={{ height: '2.5rem', borderRadius: '8px', minWidth: '130px', textAlign: 'center' }}
                    />
                }
            >
                <Await resolve={languages}>
                    {(languages) => (
                        <Select
                            disabled={isEnglishOnly || isSwitchingLanguage || isSubmitting}
                            value={urlLanguageCode ?? currentLanguage.id}
                            onChange={handleSelectChange}
                            variant="standard"
                            disableUnderline
                            slotProps={{
                                input: {
                                    sx: {
                                        height: '100%',
                                        lineHeight: '32px',
                                        paddingLeft: { xs: '0.5rem !important', sm: '0.875rem !important' },
                                        paddingRight: { xs: '2rem !important', sm: '3rem !important' },
                                    },
                                },
                            }}
                            sx={{
                                opacity: isEnglishOnly ? 0.45 : 1,
                                color: 'text.primary',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                height: '100%',
                                '&.Mui-disabled': {
                                    pointerEvents: 'none',
                                },
                                '& svg': {
                                    right: '0.5rem',
                                },
                            }}
                            renderValue={() => {
                                const completed = false;
                                return (
                                    <span>
                                        <When condition={completed}>
                                            <FontAwesomeIcon style={{ marginRight: '0.3rem' }} icon={faCheck} />
                                        </When>
                                        {currentLanguage.name}
                                        <Unless condition={completed}>
                                            <StatusCircle required={true} />
                                        </Unless>
                                    </span>
                                );
                            }}
                        >
                            {languages.map((language) => {
                                const completed = false;
                                return (
                                    <MenuItem value={language.code} key={language.code}>
                                        <When condition={completed}>
                                            <FontAwesomeIcon style={{ marginRight: '0.3rem' }} icon={faCheck} />
                                        </When>
                                        {language.name}
                                        <Unless condition={completed}>
                                            <StatusCircle required={true} />
                                        </Unless>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    )}
                </Await>
            </Suspense>
        </>
    );
};

export default AuthoringBottomNav;
