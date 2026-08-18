import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    Link,
    ListItemButton,
    List,
    ListItem,
    Box,
    Drawer,
    Toolbar,
    SwipeableDrawer,
    Grid2 as Grid,
    ThemeProvider,
} from '@mui/material';
import { getAuthoringRoutes as getRoutes, AuthoringRoute as Route } from './AuthoringNavElements';
import { AdminDarkTheme, ZIndex } from 'styles/Theme';
import { AuthoringNavProps, DrawerBoxProps } from './types';
import { When } from 'react-if';
import { useAppSelector } from 'hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/pro-light-svg-icons/faPencil';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { BodyText } from 'components/common/Typography/Body';
import { USER_ROLES } from 'services/userService/constants';
import UserService from 'services/userService';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faArrowLeftLong } from '@fortawesome/pro-light-svg-icons';
import { faCheck, faLockAlt } from '@fortawesome/pro-regular-svg-icons';
import { StatusCircle } from '../../view/AuthoringTab';
import { useFetchers, useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import {
    AUTHORING_SECTION,
    AUTHORING_SECTION_NAMES,
    AuthoringSectionName,
    useAuthoringSectionCompletion,
} from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';
import { EngagementLoaderAdminData } from 'components/engagement/admin/EngagementLoaderAdmin';
import { UserAvatar } from 'components/common/Layout/UserAvatar';
import { AppConfig } from 'config';
import { Language } from 'models/language';
import LockOwnerAvatar from './LockOwnerAvatar';
import { findSectionLock } from './useAuthoringSectionLocks';
import useAuthoringSectionLockNavigation, { useSectionLockState } from './useAuthoringSectionLockNavigation';
import { useEngagementLocks } from 'services/resourceLockService/useEngagementLocks';

export const routeItemStyle = {
    padding: 0,
    backgroundColor: 'background.default',
    '&:hover, &:focus': {
        filter: 'brightness(96%)',
    },
    '&:active': {
        filter: 'brightness(92%)',
    },
    borderRadius: '8px',
};

const areLanguageCodesEqual = (left: string[], right: string[]) => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index++) {
        if (left[index] !== right[index]) {
            return false;
        }
    }

    return true;
};

const DrawerBox = ({ isMediumScreenOrLarger, setOpen, engagementId }: DrawerBoxProps) => {
    const permissions = useAppSelector((state) => state.user.roles);
    const { languageCode } = useParams() as { languageCode?: string };
    const defaultLanguageCode = AppConfig.language.defaultLanguageId.toLowerCase();
    const defaultLanguageName = AppConfig.language.defaultLanguageName;
    const { engagement, languages, details, locks } = useRouteLoaderData(
        'single-engagement',
    ) as EngagementLoaderAdminData;
    const revalidator = useRevalidator();
    const fetchers = useFetchers();
    const inFlightFetcherKeysRef = useRef<Set<string>>(new Set());
    const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
    const selectedLanguageCodes = useMemo(() => {
        if (selectedLanguages.length > 0) {
            return selectedLanguages.map((language) => language.code);
        }

        return [defaultLanguageCode];
    }, [defaultLanguageCode, selectedLanguages]);

    const fetchersByKey = useMemo(() => {
        return fetchers.map((fetcher) => ({
            key: fetcher.key,
            state: fetcher.state,
            data: fetcher.data,
        }));
    }, [fetchers]);

    useEffect(() => {
        const currentInFlightKeys = new Set<string>();
        let shouldRefreshAfterSave = false;

        for (const fetcher of fetchersByKey) {
            if (fetcher.state !== 'idle') {
                currentInFlightKeys.add(fetcher.key);
                continue;
            }

            if (fetcher.data === 'success' && inFlightFetcherKeysRef.current.has(fetcher.key)) {
                shouldRefreshAfterSave = true;
            }
        }

        inFlightFetcherKeysRef.current = currentInFlightKeys;

        if (shouldRefreshAfterSave) {
            revalidator.revalidate();
        }
    }, [fetchersByKey, revalidator]);

    useLayoutEffect(() => {
        let isMounted = true;

        void languages.then((resolvedLanguages) => {
            if (!isMounted) {
                return;
            }

            const normalizedLanguages =
                resolvedLanguages.length > 0
                    ? resolvedLanguages
                    : [{ id: 0, code: defaultLanguageCode, name: defaultLanguageName, right_to_left: false }];
            const nextCodes = normalizedLanguages.map((language) => language.code);

            if (areLanguageCodesEqual(selectedLanguageCodes, nextCodes) && selectedLanguages.length > 0) {
                return;
            }

            setSelectedLanguages(normalizedLanguages);
        });

        return () => {
            isMounted = false;
        };
    }, [defaultLanguageCode, defaultLanguageName, languages, selectedLanguageCodes, selectedLanguages.length]);

    const { completionBySection } = useAuthoringSectionCompletion({
        engagementId: Number(engagementId),
        languageCode: languageCode ?? defaultLanguageCode,
        selectedLanguageCodes,
        engagementPromise: engagement,
        detailsTabsPromise: details,
    });
    const { locks: liveLocks } = useEngagementLocks({
        engagementId: Number(engagementId),
        initialLocksPromise: locks,
    });
    const locksBySection = useMemo(() => {
        const entries = AUTHORING_SECTION_NAMES.map((sectionName) => {
            return [
                sectionName,
                findSectionLock({
                    locks: liveLocks,
                    sectionName,
                    languageId:
                        selectedLanguages.find((language) => language.code === (languageCode ?? defaultLanguageCode))
                            ?.id ?? undefined,
                }),
            ] as const;
        });

        return Object.fromEntries(entries) as Record<AuthoringSectionName, ReturnType<typeof findSectionLock>>;
    }, [defaultLanguageCode, languageCode, liveLocks, selectedLanguages]);
    const { breakLockModal, requestNavigation } = useAuthoringSectionLockNavigation();

    const authoringRoutes = getRoutes(Number(engagementId), languageCode ?? defaultLanguageCode);
    const matchingRoutePaths: string[] = authoringRoutes
        .map((route) => route.path)
        .filter((route) => globalThis.location.pathname.includes(route));
    const sortedMatchingRoutePaths = [...matchingRoutePaths].sort((a: string, b: string) => {
        if (a.length !== b.length) {
            return a.length - b.length;
        }

        return a.localeCompare(b);
    });
    const currentRoutePath = sortedMatchingRoutePaths.length > 0 ? sortedMatchingRoutePaths.at(-1) : '';

    const allowedRoutes = authoringRoutes.filter((route) => {
        return !route.authenticated || route.allowedRoles.some((role) => permissions.includes(role));
    });

    const renderListItem = (route: Route, isSelected: boolean) => {
        if (route.name === 'Engagement Home') {
            return null;
        }

        const sectionName: AuthoringSectionName = route.name;
        const isCompleted = completionBySection[sectionName] ?? false;
        const shouldShowStatusCircle = isCompleted === false;
        const sectionLock = locksBySection[sectionName];
        const { isDisabled } = useSectionLockState({ lock: sectionLock });

        const fadeWhenDisabled = (color: string) => {
            if (isDisabled) return color;
            return `color-mix(in srgb, ${color} 60%, white)`;
        };

        return (
            <React.Fragment key={route.name}>
                <When
                    condition={
                        AUTHORING_SECTION.HERO_BANNER === route.name || AUTHORING_SECTION.VIEW_RESULTS === route.name
                    }
                >
                    <BodyText bold size="small" sx={{ textTransform: 'uppercase', mt: '2rem', mb: '1rem' }}>
                        {AUTHORING_SECTION.HERO_BANNER === route.name ? 'Required' : 'Optional'} Sections
                    </BodyText>
                </When>
                <ListItem
                    key={route.name}
                    sx={{
                        ...routeItemStyle,
                        backgroundColor: isSelected ? 'blue.10' : 'background.default',
                    }}
                >
                    <ListItemButton
                        component={RouterLinkRenderer}
                        disableRipple
                        disabled={isDisabled}
                        sx={{
                            '&:hover, &:active, &:focus': {
                                backgroundColor: 'transparent',
                            },
                            padding: 2,
                        }}
                        data-testid={`SideNav/${route.name}-button`}
                        href={route.path}
                        onClick={(event) => {
                            event.preventDefault();
                            requestNavigation({
                                href: route.path,
                                sectionName,
                                lock: sectionLock,
                                onBeforeNavigate: () => setOpen(false),
                            });
                        }}
                    >
                        <BodyText
                            sx={{
                                color: isSelected ? 'primary.main' : fadeWhenDisabled('text.primary'),
                                fontWeight: isSelected ? 'bold' : '500',
                                fontSize: '1rem',
                            }}
                        >
                            <span
                                style={{
                                    paddingRight: '0.6rem',
                                }}
                            >
                                {isCompleted && (
                                    <FontAwesomeIcon
                                        icon={faCheck}
                                        style={{
                                            color: 'inherit',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                            </span>

                            {route.name}
                        </BodyText>
                        {shouldShowStatusCircle && <StatusCircle required={Boolean(route.required)} />}
                        <span
                            style={{
                                marginLeft: 'auto',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                paddingRight: '1.9rem',
                            }}
                        >
                            <LockOwnerAvatar size={24} lock={sectionLock ?? undefined} />
                        </span>
                        <When condition={currentRoutePath === route.path}>
                            <BodyText
                                sx={{
                                    position: 'absolute',
                                    right: '1.2rem',
                                    color: isSelected ? 'primary.main' : 'text.primary',
                                }}
                            >
                                <FontAwesomeIcon icon={faPencil} fontSize="1rem" />
                            </BodyText>
                        </When>
                        <When condition={currentRoutePath !== route.path && Boolean(sectionLock)}>
                            <BodyText
                                style={{
                                    position: 'absolute',
                                    right: '1.2rem',
                                    color: 'text.primary',
                                }}
                            >
                                <FontAwesomeIcon icon={faLockAlt} fontSize="1rem" />
                            </BodyText>
                        </When>
                    </ListItemButton>
                </ListItem>
            </React.Fragment>
        );
    };

    return (
        <Box
            component="nav"
            aria-label="Authoring Navigation"
            sx={{
                mt: { xs: '5.625rem', md: '9rem' },
                padding: { xs: '1rem', md: '0 0 0 3.1rem' },
                overflow: 'auto',
                backgroundColor: 'background.default',
                zIndex: ZIndex.sideNav,
                borderRadius: '0 8px 8px 0',
            }}
        >
            {breakLockModal}
            <List sx={{ pt: { xs: 4, md: 0 }, pb: '0' }}>
                {/* Engagement Home link */}
                <Link
                    component={RouterLinkRenderer}
                    href={authoringRoutes[0].path}
                    sx={{
                        height: '3rem',
                        color: 'text.primary',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <FontAwesomeIcon
                        style={{ fontSize: '1.3rem', fontWeight: 'normal', paddingRight: '0.5rem' }}
                        icon={faArrowLeftLong}
                    />
                    <span style={{ fontWeight: 'bold' }}>{authoringRoutes[0].name}</span>
                </Link>
                {/* All other menu items */}
                {allowedRoutes.map(
                    (route, index) => 0 !== index && renderListItem(route, currentRoutePath === route.path),
                )}
            </List>
        </Box>
    );
};

const AuthoringSideNav = ({ open, setOpen, isMediumScreen, engagementId }: AuthoringNavProps) => {
    const currentUser = useAppSelector((state) => state.user.userDetail.user);
    const [sideNavOffset, setSideNavOffset] = useState(0);

    useLayoutEffect(() => {
        if (!isMediumScreen) return;
        const handleScroll = () => {
            const footerBox = document.querySelector('footer')?.getBoundingClientRect();
            if (!footerBox) return;
            // How far down the side nav can be in "absolute" mode and not overlap the footer
            const footerClearance =
                footerBox.top - (document.querySelector('#authoring-sidenav-drawer')?.clientHeight ?? 0);
            setSideNavOffset(footerClearance);
        };
        globalThis.addEventListener('scroll', handleScroll, { passive: true });
        globalThis.addEventListener('resize', handleScroll, { passive: true });
        handleScroll(); // Initial run on load
        return () => {
            globalThis.removeEventListener('scroll', handleScroll);
            globalThis.removeEventListener('resize', handleScroll);
        };
    }, [isMediumScreen]);

    if (isMediumScreen)
        return (
            <Drawer
                ModalProps={{
                    hideBackdrop: true,
                }}
                slotProps={{
                    paper: {
                        id: 'authoring-sidenav-drawer',
                        sx: {
                            border: 'none',
                            width: '18.75rem',
                            boxSizing: 'border-box',
                            background: 'transparent',
                            height: '55rem',
                            position: sideNavOffset <= 0 ? 'absolute' : 'fixed',
                            top: sideNavOffset <= 0 ? sideNavOffset + globalThis.scrollY : 'auto',
                        },
                    },
                }}
                hideBackdrop
                elevation={0}
                variant="permanent"
                sx={{
                    height: '100vh',
                    width: '18.75rem',
                    flexShrink: 0,
                }}
            >
                <Toolbar />
                <DrawerBox isMediumScreenOrLarger={isMediumScreen} setOpen={setOpen} engagementId={engagementId} />
            </Drawer>
        );
    return (
        <SwipeableDrawer
            slotProps={{
                paper: {
                    sx: {
                        width: '100%',
                        height: '100%',
                        minHeight: 'calc(100vh)',
                        background: (theme) => theme.palette.primary.main,
                    },
                },
            }}
            sx={{
                mt: '4rem',
                zIndex: (theme) => theme.zIndex.drawer + 3, // render above feedback button
            }}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            anchor={'top'}
            open={open}
            disableEnforceFocus
            disablePortal
            swipeAreaWidth={64}
        >
            <Box>
                <DrawerBox isMediumScreenOrLarger={isMediumScreen} setOpen={setOpen} engagementId={engagementId} />
                <ThemeProvider theme={AdminDarkTheme}>
                    <Grid
                        m={2}
                        container
                        sx={{ width: 'calc(100% - 16px) ' }}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                    >
                        <Grid>
                            <UserAvatar />
                        </Grid>
                        <Grid sx={{ textAlign: 'left' }}>
                            <BodyText size="small" sx={{ userSelect: 'none' }}>
                                Hello {currentUser?.first_name}
                            </BodyText>
                            <BodyText sx={{ fontSize: '10px', lineHeight: 1 }}>
                                {currentUser?.roles.includes(USER_ROLES.SUPER_ADMIN)
                                    ? 'Super Admin'
                                    : (currentUser?.main_role ?? 'User')}
                            </BodyText>
                        </Grid>
                        <Grid sx={{ marginLeft: 'auto', marginRight: '2rem' }}>
                            <Link onClick={UserService.doLogout} href="#">
                                Logout
                                <FontAwesomeIcon style={{ marginLeft: '0.25rem' }} icon={faArrowRight} />
                            </Link>
                        </Grid>
                    </Grid>
                </ThemeProvider>
            </Box>
        </SwipeableDrawer>
    );
};

export default AuthoringSideNav;
