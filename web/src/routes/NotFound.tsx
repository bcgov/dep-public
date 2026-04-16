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

const notFoundFallback = {
    header0: "The page you're looking for cannot be found.",
    header1: "The page you're looking for might have been removed, moved or is temporarily unavailable.",
    paragraph: "Suggestions to help you find what you're looking for:",
    list0: 'Check that the web URL has been entered correctly.',
    list1: 'Go to our',
    list2: 'homepage',
    list3: 'and browse through our past and current engagements',
    list4: 'Telephone Device for the Deaf (TDD) across B.C.: 711',
    list5: 'If you would like to email us, please contact *************@gov.bc.ca.',
};

const SuggestionsList = () => {
    const { t: translate, i18n } = useAppTranslation();
    const invalidTenant = findTenantInPath().toLowerCase() !== sessionStorage.getItem('tenantId')?.toLowerCase();
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const homeLink = getPath(isLoggedIn ? ROUTES.HOME : ROUTES.PUBLIC_LANDING);
    const { href, to } = invalidTenant ? { href: '/' } : { to: homeLink };

    const translateOrFallback = (key: string, fallback: string) => {
        if (!i18n.exists(`default:${key}`) && !i18n.exists(`common:${key}`)) {
            return fallback;
        }
        return translate(key);
    };

    return (
        <Box>
            <p style={{ ...listItemStyle, fontWeight: 'bold' }}>
                {translateOrFallback('notFound.paragraph', notFoundFallback.paragraph)}
            </p>
            <ul>
                <li style={listItemStyle}>{translateOrFallback('notFound.list.0', notFoundFallback.list0)}</li>
                <li style={listItemStyle}>
                    {translateOrFallback('notFound.list.1', notFoundFallback.list1)}{' '}
                    <Link href={href} to={to}>
                        {translateOrFallback('notFound.list.2', notFoundFallback.list2)}
                    </Link>{' '}
                    {translateOrFallback('notFound.list.3', notFoundFallback.list3)}
                </li>
                <li style={listItemStyle}>{translateOrFallback('notFound.list.4', notFoundFallback.list4)}</li>
                <li style={listItemStyle}>{translateOrFallback('notFound.list.5', notFoundFallback.list5)}</li>
            </ul>
        </Box>
    );
};

const NotFound = () => {
    const { t: translate, i18n } = useAppTranslation();

    const translateOrFallback = (key: string, fallback: string) => {
        if (!i18n.exists(`default:${key}`) && !i18n.exists(`common:${key}`)) {
            return fallback;
        }
        return translate(key);
    };

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
                    {translateOrFallback('notFound.header.0', notFoundFallback.header0)}
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
                    {translateOrFallback('notFound.header.1', notFoundFallback.header1)}
                </Heading4>
            </Grid>
            <Grid size={6} justifyContent={'left'}>
                <SuggestionsList />
            </Grid>
        </Grid>
    );
};

export default NotFound;
