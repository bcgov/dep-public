import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
    AppBar,
    Avatar,
    ButtonBase,
    Box,
    Collapse,
    CssBaseline,
    Drawer,
    Grid2 as Grid,
    Grow,
    LinearProgress,
    Link,
    MenuList,
    MenuItem,
    Theme,
    ThemeProvider,
    Toolbar,
    useMediaQuery,
} from '@mui/material';
import { colors, AdminDarkTheme, Palette } from 'styles/Theme';
import { ReactComponent as BCLogo } from 'assets/images/BritishColumbiaLogoDark.svg';
import { useAppSelector } from '../../../hooks';
import { BodyText } from 'components/common/Typography/Body';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faChevronDown, faClose, faSignOut } from '@fortawesome/pro-regular-svg-icons';
import UserService from 'services/userService';
import { Await, useRouteLoaderData, useParams, useNavigation } from 'react-router';
import { Tenant } from 'models/tenant';
import { When, If, Else, Then } from 'react-if';
import { Button } from 'components/common/Input/Button';
import DropdownMenu, { dropdownMenuStyles } from 'components/common/Navigation/DropdownMenu';
import { elevations } from 'components/common';
import { AuthenticatedRootLoaderData } from 'routes/AuthenticatedRootRouteLoader';
import TrapFocus from '@mui/material/Unstable_TrapFocus';
import SideNav from '../SideNav/SideNav';
import { USER_ROLES } from 'services/userService/constants';
import AuthoringSideNav from '../../engagement/admin/create/authoring/AuthoringSideNav';
import { getAuthoringRoutes } from '../../engagement/admin/create/authoring/AuthoringNavElements';
import { ROUTES, getPath } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';

const InternalHeader = () => {
    const isMediumScreenOrLarger = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
    const isMobileScreen = !useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
    const [sideNavOpen, setSideNavOpen] = useState(false);
    const [secondaryMenuOpen, setSecondaryMenuOpen] = useState(false);
    const user = useAppSelector((state) => state.user);
    const canNavigate = user.roles.length !== 0; // If user has no roles in this tenant, don't show the side nav
    const [tenantDrawerOpen, setTenantDrawerOpen] = useState(false);

    const handleTenantDrawerOpen = (isOpen: boolean) => {
        setTenantDrawerOpen(isOpen);
    };

    useEffect(() => {
        if (isMediumScreenOrLarger || sideNavOpen) {
            const timer = setTimeout(() => {
                setSecondaryMenuOpen(true);
            }, 200); // Delay to allow the sidenav to open first
            return () => clearTimeout(timer);
        } else {
            setSecondaryMenuOpen(false);
        }
    }, [isMediumScreenOrLarger, sideNavOpen]);

    // Get the authoring nav elements and current route so we can check their last two slugs against the current route's last two slugs.
    // This will be used to determine which sidenav menu is displayed.
    const pathname = window.location.href;
    const { engagementId } = useParams() as { engagementId: string };
    const currentAuthoringSlug = pathname.split('/').slice(-2).join('/');
    const authoringRoutes = getAuthoringRoutes(Number(engagementId)).map((route) => {
        // skip the "Engagement Home" link
        if ('Engagement Home' !== route.name) {
            const pathArray = route.path.split('/');
            return pathArray.slice(-2).join('/');
        }
    });

    const { myTenants } = useRouteLoaderData('authenticated-root') as AuthenticatedRootLoaderData;

    const sidePadding = { xs: '0 1em', md: '0 1.5em 0 2em', lg: '0 3em 0 2em' };
    const navigation = useNavigation();
    const isPending = navigation.state === 'loading' || navigation.state === 'submitting';
    const leftPositionSign = sideNavOpen ? -6 : 6;
    const leftPosition = isMobileScreen ? `${leftPositionSign}px` : '0px';

    // Add delayed state for user menu to prevent disappearing before collapse completes
    const [showUserMenu, setShowUserMenu] = useState(isMediumScreenOrLarger);

    useEffect(() => {
        if (isMediumScreenOrLarger) {
            setShowUserMenu(true);
        } else {
            // Delay hiding user menu to match collapse exit timing
            const timer = setTimeout(() => {
                setShowUserMenu(false);
            }, 250); // Match collapse exit timing
            return () => clearTimeout(timer);
        }
    }, [isMediumScreenOrLarger]);

    return (
        // Keep focus within the app bar + sidenav when sidenav is open on mobile
        <TrapFocus open={sideNavOpen && isMobileScreen}>
            <Box
                sx={{
                    '& div.PrivateSwipeArea-root': {
                        zIndex: (theme: Theme) => theme.zIndex.drawer + 4,
                    },
                }}
            >
                <CssBaseline />
                <Grow
                    in={!isMediumScreenOrLarger && canNavigate}
                    timeout={{
                        enter: 300,
                        exit: 250,
                    }}
                    style={{
                        transformOrigin: 'center right',
                    }}
                >
                    <Button
                        onClick={() => {
                            setSideNavOpen(!sideNavOpen);
                        }}
                        icon={
                            <FontAwesomeIcon
                                icon={sideNavOpen ? faClose : faBars}
                                fontSize={20}
                                style={{
                                    width: '20px',
                                    transform: `rotate(${sideNavOpen ? '180deg' : '0'})`,
                                    transition:
                                        'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    left: leftPosition,
                                }}
                            />
                        }
                        iconPosition={sideNavOpen ? 'right' : 'left'}
                        sx={{
                            zIndex: (theme: Theme) => theme.zIndex.drawer + 5, // render above PrivateSwipeArea
                            position: 'fixed',
                            right: '1em',
                            top: '0.5em',
                            minWidth: 'unset',
                            alignContent: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& .MuiSvgIcon-root': {
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            },
                        }}
                    >
                        <Collapse
                            in={!isMobileScreen && !isMediumScreenOrLarger}
                            orientation="horizontal"
                            timeout={250}
                        >
                            <BodyText>Menu</BodyText>
                        </Collapse>
                    </Button>
                </Grow>
                <AppBar
                    position="fixed"
                    sx={{
                        zIndex: (theme: Theme) => theme.zIndex.drawer + 4, // render above sidenav
                        backgroundColor: 'transparent',
                        color: Palette.internalHeader.color,
                        backgroundClip: 'padding-box',
                        overflow: 'hidden',
                        left: 0,
                        boxShadow: tenantDrawerOpen ? 'none' : elevations.default,
                        borderRadius: 0,
                        borderBottomLeftRadius: '1em',
                        borderBottomRightRadius: '1em',
                        transition: 'box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        paddingRight: '0 !important',
                    }}
                    data-testid="appbar-header"
                >
                    <Toolbar
                        sx={{
                            height: '4em',
                            padding: sidePadding,
                            backgroundColor: Palette.internalHeader.backgroundColor,
                            transition: 'padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <Link underline="none" href="https://gov.bc.ca" sx={{ height: '100%', mr: '2px' }}>
                            <Box
                                component={BCLogo}
                                sx={{
                                    height: '100%',
                                    width: 'auto',
                                    padding: '0 0',
                                    ml: '-13px',
                                }}
                                alt="British Columbia Logo"
                            />
                        </Link>
                        <Box
                            sx={{
                                borderLeft: `1px solid ${colors.surface.gray[80]}`,
                                height: '1.5em',
                                width: '1px',
                                marginRight: '1em',
                            }}
                        />
                        <BodyText thin sx={{ color: colors.surface.blue[80], userSelect: 'none' }}>
                            engage{/*no space*/}
                            <span style={{ color: colors.surface.blue[90], fontWeight: 'normal' }}>BC</span>
                        </BodyText>
                    </Toolbar>
                    <If condition={isPending}>
                        <Then>
                            <LinearProgress sx={{ marginTop: '-0.25em' }} />
                        </Then>
                    </If>
                    <Collapse
                        in={secondaryMenuOpen}
                        timeout={{
                            appear: 0,
                            enter: 300,
                            exit: 250,
                        }}
                        easing={{
                            enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
                            exit: 'cubic-bezier(0.4, 0, 0.6, 1)',
                        }}
                    >
                        <Box
                            sx={{
                                zIndex: (theme: Theme) => theme.zIndex.drawer + 3, // render above sidenav
                                background: colors.surface.blue[90],
                                height: '3.5em',
                                minHeight: 0,
                                justifyContent: 'space-between',
                                padding: sidePadding,
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            <ThemeProvider theme={AdminDarkTheme}>
                                <Suspense>
                                    <Await resolve={myTenants}>
                                        {(tenants: Tenant[]) => (
                                            <TenantSelector
                                                isVisible={isMediumScreenOrLarger || sideNavOpen}
                                                onStateChange={handleTenantDrawerOpen}
                                                tenants={tenants}
                                            />
                                        )}
                                    </Await>
                                </Suspense>
                                <When condition={showUserMenu}>
                                    <UserMenu />
                                </When>
                            </ThemeProvider>
                        </Box>
                    </Collapse>
                </AppBar>
                <When condition={canNavigate}>
                    <If condition={authoringRoutes.includes(currentAuthoringSlug)}>
                        <Then>
                            <AuthoringSideNav
                                open={sideNavOpen}
                                setOpen={setSideNavOpen}
                                data-testid="authoringnav-header"
                                isMediumScreen={isMediumScreenOrLarger}
                                engagementId={engagementId}
                            />
                        </Then>
                        <Else>
                            <SideNav
                                open={sideNavOpen}
                                setOpen={setSideNavOpen}
                                data-testid="sidenav-header"
                                isMediumScreen={isMediumScreenOrLarger}
                            />
                        </Else>
                    </If>
                </When>
            </Box>
        </TrapFocus>
    );
};

const TenantSelector = ({
    isVisible,
    onStateChange,
    tenants: allTenants,
}: {
    isVisible: boolean;
    onStateChange?: (isOpen: boolean) => void;
    tenants: Tenant[];
}) => {
    const shouldUseMobileView = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
    const currentTenant = useAppSelector((state) => state.tenant);
    const tenants = allTenants.filter((tenant) => tenant.short_name !== currentTenant.short_name);
    const noOtherTenants = tenants.length === 0;
    const hasOtherTenants = tenants.length > 0;
    const currentTenantName = currentTenant.name;
    const tenantDropdownButton = useRef<HTMLButtonElement>(null);
    const [tenantDrawerOpen, setTenantDrawerOpen] = useState(false);

    useEffect(() => {
        if (!isVisible) setTenantDrawerOpen(false);
    }, [isVisible, setTenantDrawerOpen]);

    useEffect(() => {
        if (onStateChange) onStateChange(tenantDrawerOpen);
    }, [tenantDrawerOpen, onStateChange]);

    if (noOtherTenants) {
        return (
            <Link component={RouterLinkRenderer} href={getPath(ROUTES.HOME)}>
                <BodyText sx={{ userSelect: 'none' }}>{currentTenant.name}</BodyText>
            </Link>
        );
    }

    const tenantList = tenants.map((tenant) => (
        <MenuItem
            key={tenant.short_name}
            // Don't use a React Router link here - we need to escape the current
            // React Router context and navigate to a new base URL to pass the new
            // tenant in the path and trigger a full reload of the app with the
            // new tenant's context
            href={`/${tenant.short_name}${getPath(ROUTES.HOME)}`}
            sx={{
                paddingLeft: 2,
                paddingRight: 2,
                fontSize: '16px',
                textTransform: 'capitalize',
            }}
        >
            {tenant.name}
        </MenuItem>
    ));

    if (shouldUseMobileView) {
        return (
            <>
                <ButtonBase
                    aria-haspopup
                    aria-controls={tenantDrawerOpen ? 'tenant-drawer' : undefined}
                    aria-expanded={tenantDrawerOpen}
                    aria-label={'Tenant Switcher'}
                    onClick={() => {
                        setTenantDrawerOpen(!tenantDrawerOpen);
                    }}
                    sx={{
                        height: 'calc( 100% - 2px )' /* 1px on either side to show border*/,
                        ...dropdownMenuStyles,
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <TenantButtonContent
                        isOpen={tenantDrawerOpen}
                        currentTenantName={currentTenantName}
                        hasOtherTenants={hasOtherTenants}
                    />
                </ButtonBase>
                <Drawer
                    anchor="top"
                    open={tenantDrawerOpen}
                    onClose={() => {
                        setTenantDrawerOpen(false);
                    }}
                    sx={{
                        zIndex: (theme: Theme) => theme.zIndex.drawer + 3, // render under app bar but above side nav
                        '& .MuiDrawer-paper': {
                            padding: '1rem',
                            top: '6.5rem',
                            backgroundImage: 'none',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-out',
                        },
                        '& .MuiBackdrop-root': {
                            transition: 'opacity 0.25s ease-out',
                        },
                    }}
                >
                    <nav>
                        <MenuList
                            autoFocusItem
                            aria-label="Tenant Switcher"
                            role="navigation"
                            sx={{
                                mt: 0,
                                '& .MuiMenuItem-root': {
                                    marginBottom: '1rem',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:first-of-type': {
                                        marginTop: '-4px',
                                    },
                                    '&:last-of-type': {
                                        marginBottom: 0,
                                    },
                                },
                            }}
                        >
                            {tenantList}
                        </MenuList>
                    </nav>
                </Drawer>
            </>
        );
    }

    return (
        <DropdownMenu
            forNavigation
            name="Tenant Switcher"
            renderButtonContent={({ isOpen }) => (
                <TenantButtonContent
                    isOpen={isOpen}
                    currentTenantName={currentTenantName}
                    hasOtherTenants={hasOtherTenants}
                />
            )}
            buttonProps={{
                sx: {
                    marginLeft: '-16px' /*Visual alignment with nav bar*/,
                    height: 'calc( 100% - 2px )' /* 1px on either side to show border*/,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                },
            }}
            popperProps={{
                placement: 'bottom-start',
                sx: {
                    width: tenantDropdownButton.current?.offsetWidth,
                },
            }}
        >
            {tenantList}
        </DropdownMenu>
    );
};

const TenantButtonContent = ({
    isOpen,
    currentTenantName,
    hasOtherTenants,
}: {
    isOpen: boolean;
    currentTenantName: string;
    hasOtherTenants: boolean;
}) => {
    return (
        <Grid container data-testid="tenant-switcher-button" direction="row" alignItems="center" spacing={1}>
            <Grid sx={{ flex: '1 1 auto' }}>
                <BodyText
                    sx={{
                        userSelect: 'none',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {currentTenantName}
                </BodyText>
            </Grid>
            <Grid hidden={!hasOtherTenants} sx={{ flex: '0 0 auto' }}>
                <FontAwesomeIcon color="white" rotation={isOpen ? 180 : undefined} icon={faChevronDown} />
            </Grid>
        </Grid>
    );
};

const UserMenu = () => {
    const userGreeting = useRef<HTMLDivElement>(null);

    return (
        <DropdownMenu
            name="Account Menu"
            renderButtonContent={UserButtonContent}
            buttonProps={{
                sx: {
                    marginLeft: 'auto' /* float to the right */,
                    height: 'calc( 100% - 2px )' /* 1px on either side to show border*/,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                },
            }}
            popperProps={{
                placement: 'bottom-end',
                sx: {
                    width: userGreeting.current && userGreeting.current.offsetWidth + 34 + 13,
                },
            }}
        >
            <MenuItem
                component={ButtonBase}
                onClick={() => {
                    UserService.doLogout();
                }}
                sx={{
                    width: '100%',
                    paddingLeft: 2,
                    paddingRight: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                <FontAwesomeIcon style={{ marginRight: '0.5rem' }} icon={faSignOut} />
                Logout
            </MenuItem>
        </DropdownMenu>
    );
};

const UserButtonContent = ({ isOpen }: { isOpen: boolean }) => {
    const currentUser = useAppSelector((state) => state.user.userDetail.user);
    return (
        <Grid container data-testid="user-menu-button" direction="row" alignItems="center" spacing={1}>
            <Grid>
                <Avatar
                    sx={{
                        backgroundColor: colors.surface.blue[10],
                        height: 32,
                        width: 32,
                        fontSize: '16px',
                    }}
                >
                    {currentUser?.first_name[0]}
                    {currentUser?.last_name[0]}
                </Avatar>
            </Grid>
            <Grid>
                <BodyText size="small" sx={{ userSelect: 'none' }}>
                    Hello {currentUser?.first_name}
                </BodyText>
                <BodyText sx={{ fontSize: '10px', lineHeight: 1 }}>
                    {currentUser?.roles.includes(USER_ROLES.SUPER_ADMIN)
                        ? 'Super Admin'
                        : (currentUser?.main_role ?? 'User')}
                </BodyText>
            </Grid>
            <Grid>
                <FontAwesomeIcon color="white" rotation={isOpen ? 180 : undefined} icon={faChevronDown} />
            </Grid>
        </Grid>
    );
};

export default InternalHeader;
