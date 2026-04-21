import { Divider, Grid2 as Grid, Stack, useMediaQuery, Theme } from '@mui/material';
import { BodyText } from 'components/common/Typography/Body';
import React, { Suspense, useState } from 'react';
import { ReactComponent as BCLogo } from 'assets/images/BritishColumbiaLogoDarkCropped.svg';
import { Palette } from 'styles/Theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faUniversalAccess, faCodePullRequest, faCodeFork } from '@fortawesome/pro-solid-svg-icons';
import UserService from 'services/userService';
import { useAppSelector, useAppTranslation } from 'hooks';
import { Unless, When } from 'react-if';
import { getBaseUrl } from 'helper';
import { Link } from 'components/common/Navigation';
import { SocialLinkIconProps } from './types';
import { VersionInfo } from 'services/versionService';
import { AppConfig } from 'config';
import { IconButton } from 'components/common/Input';
import { useRouteLoaderData, Await } from 'react-router';
import { AuthenticatedRootLoaderData } from 'routes/AuthenticatedRootRouteLoader';
import { getPath, ROUTES } from 'routes/routes';

const LinkArrow = () => {
    return <span style={{ fontWeight: 'bold', marginLeft: '0.8rem' }}>&gt;</span>;
};

const SocialLinkIcon = ({ iconLink, fontAwesomeIcon }: SocialLinkIconProps) => {
    return (
        <Link
            href={iconLink}
            sx={{
                display: 'flex',
                alignItems: 'center',
                height: '2.5rem',
                width: '2.5rem',
                borderRadius: '50%',
                backgroundColor: Palette.text.primary,
                justifyContent: 'center',
                color: Palette.text.primary,
                textDecoration: 'none',
            }}
        >
            <FontAwesomeIcon
                style={{
                    fontSize: '1.5rem',
                    color: 'white',
                    width: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                icon={fontAwesomeIcon}
            />
        </Link>
    );
};

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
                sx={{ transform: { xs: 'scaleX(-1)', sm: 'none' } }}
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
    const isMediumScreenOrLarger: boolean = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
    const loaderData = useRouteLoaderData('authenticated-root') as AuthenticatedRootLoaderData | undefined;
    const [isVersionExpanded, setIsVersionExpanded] = useState(false);

    const linkStyles = {
        color: Palette.text.primary,
        textDecoration: 'none',
        '&:hover': { color: Palette.primary.light },
    };

    return (
        <Grid container component="footer" spacing={0} mt="2em" aria-label="footer">
            {/* Footer acknowledgement container */}
            <Grid
                size={12}
                sx={{
                    backgroundColor: Palette.acknowledgement.background,
                    borderTop: `0.375rem solid ${Palette.acknowledgement.border}`,
                    borderBottom: `0.375rem solid ${Palette.acknowledgement.border}`,
                }}
                padding={{ xs: '2em 1em', md: '2em 2em', lg: '2em 3em' }}
            >
                <p style={{ color: Palette.background.default }}>{translate('footer.body')}</p>
            </Grid>

            {/* Footer main container */}
            <Grid size={12} padding={{ xs: '2em 1em', md: '2em 2em', lg: '2em 3em' }} container rowSpacing={2}>
                <Grid
                    size={{ xs: 10, md: 6 }}
                    columns={10}
                    container
                    sx={{
                        pr: isMediumScreenOrLarger ? '4rem' : '2rem',
                        height: isMediumScreenOrLarger ? '15.625rem' : 'auto',
                    }}
                >
                    {/* Footer BC Gov Logo */}
                    <Stack spacing={3} height="100%">
                        <BCLogo
                            style={{
                                alignSelf: 'flex-start',
                                paddingBottom: '1rem',
                                maxWidth: isMediumScreenOrLarger ? '25rem' : '9.375rem',
                            }}
                            alt={translate('footer.defaultLogo')}
                        />

                        {/* Footer accessibility paragraph and link */}
                        <p style={{ margin: '0' }}>{translate('footer.statement')}</p>
                        <Stack
                            direction="row"
                            alignSelf="flex-end"
                            style={{ height: isMediumScreenOrLarger ? '100%' : 'auto', width: '100%' }}
                        >
                            <Link
                                href="https://www2.gov.bc.ca/gov/content/home/accessible-government"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    alignSelf: 'flex-end',
                                    ...linkStyles,
                                }}
                            >
                                <FontAwesomeIcon
                                    style={{
                                        fontSize: '2.5rem',
                                        color: Palette.text.primary,
                                        paddingRight: '0.75rem',
                                        width: '2.5rem',
                                    }}
                                    icon={faUniversalAccess}
                                />

                                {translate('footer.accessibility')}
                                <LinkArrow />
                            </Link>
                        </Stack>
                    </Stack>
                </Grid>

                {/* Footer more info */}
                <Grid
                    size={{ xs: 10, md: 2 }}
                    container
                    sx={{
                        height: isMediumScreenOrLarger ? '15.625rem' : 'auto',
                        pr: isMediumScreenOrLarger ? '1rem' : '0',
                    }}
                >
                    <Stack spacing={3}>
                        <BodyText bold>{translate('footer.moreInfo')}</BodyText>
                        <Link href="#" sx={linkStyles}>
                            {translate('footer.aboutEngageBC')}
                            <LinkArrow />
                        </Link>
                        <Link href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca" sx={linkStyles}>
                            {translate('footer.aboutGov')}
                            <LinkArrow />
                        </Link>
                    </Stack>
                </Grid>

                {/* Footer connect with us */}
                <Grid
                    size={{ xs: 10, md: 2 }}
                    columns={10}
                    container
                    sx={{ height: isMediumScreenOrLarger ? '15.625rem' : 'auto' }}
                >
                    <Stack spacing={3}>
                        <BodyText bold>{translate('footer.connectWithUs')}</BodyText>
                        <Link href="#" sx={linkStyles}>
                            {translate('footer.contactInformation')}
                            <LinkArrow />
                        </Link>
                        <Link href="#" sx={linkStyles}>
                            {translate('footer.serviceCentres')}
                            <LinkArrow />
                        </Link>
                        <Grid container sx={{ flexBasis: { xs: 'auto', md: '100%' } }}>
                            <Stack direction="row" spacing={2} alignSelf={'flex-end'}>
                                <SocialLinkIcon iconLink="#" fontAwesomeIcon={faXTwitter} />
                                <SocialLinkIcon iconLink="#" fontAwesomeIcon={faInstagram} />
                                <SocialLinkIcon iconLink="#" fontAwesomeIcon={faFacebookF} />
                            </Stack>
                        </Grid>
                    </Stack>
                </Grid>

                {/* Footer divider */}
                <Grid size={12}>
                    <Divider sx={{ borderColor: Palette.text.primary }} />
                </Grid>

                {/* Footer copyright date */}
                <Grid size={{ xs: 12, sm: 6 }} container justifyContent={'flex-start'} alignItems="flex-start">
                    <p style={{ margin: '0' }}>{translate('footer.copyrightNotice')}</p>
                </Grid>

                {/* Footer copyright, privacy, and disclaimer links */}
                <Grid size={{ xs: 12, sm: 6 }} container justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                    <Stack direction="row" spacing={4}>
                        <Link href="https://www2.gov.bc.ca/gov/content/home/copyright" sx={linkStyles}>
                            {translate('footer.copyright')}
                        </Link>
                        <Link href="https://www2.gov.bc.ca/gov/content/home/privacy" sx={linkStyles}>
                            {translate('footer.privacy')}
                        </Link>
                        <Link href="https://www2.gov.bc.ca/gov/content/home/disclaimer" sx={linkStyles}>
                            {translate('footer.disclaimer')}
                        </Link>
                    </Stack>
                </Grid>

                {/* Footer admin login */}
                <Grid size={{ xs: 12, sm: 6 }} container justifyContent={'flex-start'} alignItems="baseline">
                    <Unless condition={isLoggedIn}>
                        <Grid size={12}>
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
                                <LinkArrow />
                            </Link>
                        </Grid>
                    </Unless>
                </Grid>

                {/* Footer version info */}
                <When condition={isLoggedIn}>
                    <Grid
                        container
                        size={{ xs: 12, sm: 6 }}
                        gap={1}
                        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                    >
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
                    </Grid>
                </When>
            </Grid>
        </Grid>
    );
};

export default Footer;
