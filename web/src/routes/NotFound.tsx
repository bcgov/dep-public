import { Grid2 as Grid, SvgIcon, Box } from '@mui/material';
import { Heading1, Heading4 } from 'components/common/Typography';
import React from 'react';
import { ReactComponent as ErrorSvg } from 'assets/images/404.svg';
import { Link } from 'components/common/Navigation';
import { useAppSelector, useAppTranslation } from 'hooks';
import { findTenantInPath } from 'utils';
import { getPath, ROUTES } from './routes';

const listItemStyle = { marginBottom: 1 };
const marginStyle = { mr: 2 };

const SuggestionsList = () => {
    const { t: translate } = useAppTranslation();
    const invalidTenant = findTenantInPath().toLowerCase() !== sessionStorage.getItem('tenantId')?.toLowerCase();
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const homeLink = getPath(isLoggedIn ? ROUTES.HOME : ROUTES.PUBLIC_LANDING);
    const { href, to } = invalidTenant ? { href: '/' } : { to: homeLink };
    return (
        <Box>
            <p style={{ ...listItemStyle, fontWeight: 'bold' }}>{translate('notFound.paragraph')}</p>
            <ul>
                <li style={listItemStyle}>{translate('notFound.list.0')}</li>
                <li style={listItemStyle}>
                    {translate('notFound.list.1')}{' '}
                    <Link href={href} to={to}>
                        {translate('notFound.list.2')}
                    </Link>{' '}
                    {translate('notFound.list.3')}
                </li>
                <li style={listItemStyle}>{translate('notFound.list.4')}</li>
                <li style={listItemStyle}>{translate('notFound.list.5')}</li>
            </ul>
        </Box>
    );
};

const NotFound = () => {
    const { t: translate } = useAppTranslation();

    return (
        <Grid
            mt={4}
            container
            direction={'column'}
            justifyContent="center"
            alignItems="center"
            spacing={1}
            padding={'2em 2em 1em 2em'}
        >
            <Grid sx={{ ...marginStyle, marginBottom: 3 }}>
                <Heading1 bold fontSize="2em">
                    {translate('notFound.header.0')}
                </Heading1>
            </Grid>
            <Grid sx={{ marginStyle, marginBottom: 2 }}>
                <SvgIcon
                    fontSize="inherit"
                    component={ErrorSvg}
                    viewBox="0 0 404 320"
                    sx={{
                        width: '25em', // adjust these values as per your needs
                        height: '15em',
                        marginX: 1,
                        boxSizing: 'border-box',
                        padding: '0px',
                    }}
                />
            </Grid>
            <Grid size={6} justifyContent="center" mb={4}>
                <Heading4 align="left" bold>
                    {translate('notFound.header.1')}
                </Heading4>
            </Grid>
            <Grid size={6} justifyContent={'left'}>
                <SuggestionsList />
            </Grid>
        </Grid>
    );
};

export default NotFound;
