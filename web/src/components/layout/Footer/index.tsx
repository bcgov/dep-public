import { Divider, Grid2 as Grid, Stack, Box } from '@mui/material';
import { BodyText } from 'components/common/Typography/Body';
import React, { Suspense, useState } from 'react';
import { ReactComponent as BCLogo } from 'assets/images/BritishColumbiaLogoDarkCropped.svg';
import { LayoutWidth, Palette } from 'styles/Theme';
import { faCodePullRequest, faCodeFork } from '@fortawesome/pro-solid-svg-icons';
import UserService from 'services/userService';
import { useAppSelector, useAppTranslation } from 'hooks';
import { Unless, When } from 'react-if';
import { getBaseUrl } from 'helper';
import { Link } from 'components/common/Navigation';
import { VersionInfo } from 'services/versionService';
import { AppConfig } from 'config';
import { IconButton } from 'components/common/Input';
import { useRouteLoaderData, Await } from 'react-router';
import { AuthenticatedRootLoaderData } from 'routes/AuthenticatedRootRouteLoader';
import { getPath, ROUTES } from 'routes/routes';
import { Heading2 } from 'components/common/Typography';

interface VersionInfoProps {
    label: string;
    version?: string;
    branch?: string;
    commitUrl?: string;
    buildDate?: string;
    isExpanded?: boolean;
    onToggle?: () => void;
}
const VersionInfoDisplay = ({
    label,
    version,
    branch,
    commitUrl,
    buildDate,
    isExpanded,
    onToggle,
}: VersionInfoProps) => {
    return (
        <Stack direction="row" width={{ xs: '100%', sm: 'auto' }} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Grid
                px="0.5rem"
                display="inline-flex"
                alignItems="baseline"
                justifyContent="center"
                order={{ xs: 2, sm: 1 }}
                sx={{ transform: { xs: 'scaleX(-1)', sm: 'none' }, pl: 0 }}
            >
                {onToggle && (
                    <IconButton
                        backgroundColor={Palette.blue[10]}
                        hoverBackgroundColor={Palette.blue[20]}
                        icon={isExpanded ? faCodePullRequest : faCodeFork}
                        size="24px"
                        iconSize="16px"
                        onClick={onToggle}
                        title={isExpanded ? 'Collapse version info' : 'Expand version info'}
                        iconProps={{ transform: { rotate: 180 } }}
                    />
                )}
            </Grid>
            <BodyText component="div" width="max-content" order={{ xs: 1, sm: 2 }}>
                {label}:{' '}
                <Link
                    color={Palette.gray[90]}
                    bgcolor={Palette.blue[10]}
                    padding="0.1rem 0.3rem"
                    borderRadius="4px"
                    fontFamily="monospace"
                    underline="hover"
                    sx={{ '&:hover': { bgcolor: Palette.blue[20] } }}
                    href={commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                >
                    {version || 'unknown'}
                    {branch && branch !== 'unknown' && `@${branch}`}
                </Link>{' '}
                <BodyText width="fit-content" display={isExpanded ? { xs: 'block', md: 'inline-block' } : 'none'}>
                    {buildDate && buildDate !== 'unknown' && `built ${buildDate}`}
                </BodyText>
            </BodyText>
        </Stack>
    );
};

const Footer = () => {
    const baseURL = getBaseUrl();
    const { t: translate } = useAppTranslation();
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const loaderData = useRouteLoaderData('authenticated-root') as AuthenticatedRootLoaderData | undefined;
    const isEngagementPage = document.querySelector('#hero') && document.querySelector('#description');
    const [isVersionExpanded, setIsVersionExpanded] = useState(false);
    const basename = sessionStorage.getItem('basename');
    console.log(basename);

    const linkStyles = {
        fontSize: '14px',
        color: Palette.text.primary,
        '&:hover': { color: Palette.primary.light },
    };

    const base = 'https://www2.gov.bc.ca/gov/content';

    const moreInfoLinks = [
        { label: translate('footer.moreInfo.home'), href: `${base}/home` },
        { label: translate('footer.moreInfo.about'), href: `${base}/about-gov-bc-ca` },
        { label: translate('footer.moreInfo.disclaimer'), href: `${base}/home/disclaimer` },
        { label: translate('footer.moreInfo.privacy'), href: `${base}/home/privacy` },
        { label: translate('footer.moreInfo.accessibility'), href: `${base}/home/accessible-government` },
        { label: translate('footer.moreInfo.copyright'), href: `${base}/home/copyright` },
        { label: translate('footer.moreInfo.contact'), href: `${base}/home/get-help-with-government-services` },
    ];

    return (
        <Grid container component="footer" spacing={0} sx={{ mt: isEngagementPage ? 0 : '2rem' }} aria-label="footer">
            {/* Footer acknowledgement container */}
            <Grid
                size={12}
                sx={{
                    backgroundColor: Palette.acknowledgement.background,
                    borderTop: `0.375rem solid ${Palette.acknowledgement.border}`,
                    borderBottom: `0.375rem solid ${Palette.acknowledgement.border}`,
                    padding: '2rem',
                }}
            >
                <p
                    style={{
                        color: Palette.background.default,
                        padding: 0,
                        margin: '0 auto',
                        maxWidth: LayoutWidth.footer,
                        width: '100%',
                        fontSize: '14px',
                    }}
                >
                    {translate('footer.acknowledgement')}
                </p>
            </Grid>

            {/* Footer main container */}
            <Grid
                size={12}
                sx={{
                    padding: '3.5rem 2rem 3rem',
                    gap: '0',
                }}
                container
                rowSpacing={2}
            >
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    sx={{
                        maxWidth: LayoutWidth.footer,
                        width: '100%',
                        ml: 'auto',
                        mr: 'auto',
                        flexWrap: 'nowrap',
                        gap: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Footer BC Gov Logo */}
                    <Stack spacing={3} height="100%" direction="column" width={{ xs: '100%', md: '50%' }}>
                        <Link underline="none" href="https://www2.gov.bc.ca">
                            <Box
                                component={BCLogo}
                                sx={{
                                    padding: '0.5rem',
                                    mb: '1rem',
                                    width: '130px',
                                    maxWidth: '100%',
                                }}
                                alt="Government of British Columbia Logo"
                            />
                        </Link>

                        {/* Footer accessibility paragraph and link */}
                        <p style={{ margin: '0', fontSize: '14px', display: 'inline', maxWidth: '600px' }}>
                            <span>{translate('footer.statement.sentence')} </span>
                            <Link
                                sx={linkStyles}
                                href="https://www2.gov.bc.ca/gov/content/home/get-help-with-government-services"
                            >
                                {translate('footer.statement.methods')}
                            </Link>
                            <span> {translate('footer.statement.or')} </span>
                            <Link sx={linkStyles} href="https://www2.gov.bc.ca/gov/content/home/services-a-z">
                                {translate('footer.statement.centre')}
                            </Link>
                        </p>
                    </Stack>

                    {/* Footer more info */}
                    <Grid
                        container
                        direction="column"
                        width={{ xs: '100%', md: '368px' }}
                        sx={{ flexBasis: 'auto', maxWidth: '100%' }}
                    >
                        <Heading2 sx={{ fontSize: '14px', margin: '1rem 0 !important', color: 'rgb(70, 67, 65)' }}>
                            {translate('footer.moreInfo.title')}
                        </Heading2>
                        <ul
                            style={{
                                gap: '4rem',
                                margin: '0 0 1rem',
                                columns: '2',
                                padding: '0',
                                listStyleType: 'none',
                            }}
                        >
                            {moreInfoLinks.map((link) => (
                                <li key={link.href} style={{ marginBottom: '1rem' }}>
                                    <Link href={link.href} sx={linkStyles}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Grid>
                </Stack>

                {/* Footer divider */}
                <Divider
                    sx={{
                        mb: '2rem',
                        pb: '2rem',
                        borderColor: 'rgb(1, 51, 102)',
                        width: '100%',
                        maxWidth: LayoutWidth.footer,
                        ml: 'auto',
                        mr: 'auto',
                    }}
                />

                {/* Footer copyright date */}
                <Grid container sx={{ width: '100%', maxWidth: LayoutWidth.footer, margin: '0 auto 1.5rem' }}>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                        © {new Date().getFullYear()} {translate('footer.copyrightNotice')}
                    </p>
                </Grid>

                {/* Footer admin area */}
                <Grid container sx={{ width: '100%', maxWidth: LayoutWidth.footer, margin: '0 auto' }}>
                    {/* Footer login link */}
                    <Unless condition={isLoggedIn}>
                        <Link
                            href="/"
                            onClick={(event) => {
                                event.preventDefault();
                                const currentUrl = new URL(window.location.href);
                                const basePath = new URL(baseURL).pathname.replace(/\/$/, '');
                                const currentPath = currentUrl.pathname.replace(/\/$/, '');
                                const isOnPublicLanding = currentPath === basePath;
                                const redirectUri = isOnPublicLanding
                                    ? `${baseURL}${getPath(ROUTES.HOME)}`
                                    : currentUrl.toString();

                                UserService.doLogin(redirectUri);
                            }}
                            sx={linkStyles}
                        >
                            {translate('footer.login')}
                        </Link>
                    </Unless>

                    {/* Footer version info */}
                    <When condition={isLoggedIn}>
                        <VersionInfoDisplay
                            label={translate('footer.appVersion')}
                            version={AppConfig.version.version}
                            branch={AppConfig.version.branch}
                            commitUrl={AppConfig.version.commitUrl}
                            buildDate={AppConfig.version.buildDate}
                            isExpanded={isVersionExpanded}
                            onToggle={() => setIsVersionExpanded(!isVersionExpanded)}
                        />
                        <When condition={isVersionExpanded}>
                            <Suspense>
                                <Await
                                    resolve={loaderData?.apiVersion}
                                    errorElement={<VersionInfoDisplay label={translate('footer.apiVersion')} />}
                                >
                                    {(apiVersionInfo?: VersionInfo) => (
                                        <VersionInfoDisplay
                                            label={translate('footer.apiVersion')}
                                            version={apiVersionInfo?.version}
                                            branch={apiVersionInfo?.branch}
                                            commitUrl={apiVersionInfo?.commit_url}
                                            buildDate={apiVersionInfo?.build_date}
                                            isExpanded={isVersionExpanded}
                                        />
                                    )}
                                </Await>
                            </Suspense>
                        </When>
                    </When>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Footer;
