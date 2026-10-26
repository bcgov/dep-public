import React, { useContext } from 'react';
import { Box, Grid2 as Grid, Input, InputAdornment, MenuItem, Select, Theme, useMediaQuery } from '@mui/material';
import LandingPageBanner from 'assets/images/LandingPageBanner.png';
import { BodyText, Heading1 } from 'components/common/Typography';
import LandingSection from './LandingSection';
import { AuthKeyCloakContext } from 'components/auth/AuthKeycloakContext';
import { useAppSelector, useAppTranslation } from 'hooks';
import { PrimaryButton } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong } from '@fortawesome/pro-light-svg-icons';
import { faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons';
import { colors } from 'styles/Theme';
import { Await, useLoaderData, useSearchParams } from 'react-router';
import { Link } from 'components/common/Navigation/Link';
import { getPath, ROUTES } from 'routes/routes';
import { LandingLoaderData } from './landingLoader';

export const LandingHero = () => {
    const { isAuthenticated } = useContext(AuthKeyCloakContext);
    const isTabletOrSmaller = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
    const tenant = useAppSelector((state) => state.tenant);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchText, setSearchText] = React.useState(searchParams.get('q') ?? searchParams.get('search_text') ?? '');
    const { regionFilter } = useLoaderData() as LandingLoaderData;
    const { t: translate } = useAppTranslation();

    const searchPageParams = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        q: searchText,
    });

    // Styles

    const landingOuterStyles = {
        pt: isAuthenticated ? '11.9375rem' : '8rem',
        pb: '8em',
        px: { xs: '1em', sm: '2em' },
        minHeight: { xs: 'auto', md: '17.625rem' },
    };

    const inputStyles = {
        width: { xs: '100%', sm: '35%', md: '14.6875rem' },
        minWidth: '9.375rem',
        height: '2.5rem',
        backgroundColor: 'white',
        fontSize: '1rem',
        boxShadow: 'none',
        border: '1px solid #605e5c',
        borderRadius: '0.5rem',
        padding: '6px 0.75rem',

        '&:hover': {
            borderWidth: '2px',
            padding: '0.3125rem 11px', // Compensate for border width change to avoid text shifting
        },
    };

    const selectStyles = {
        width: { xs: '100%', sm: '35%', md: '14.6875rem' },
        minWidth: '9.375rem',
        height: '2.5rem',
        fontSize: '1rem',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#605e5c',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
        },
    };

    const linkStyles = {
        alignSelf: { xs: 'flex-start', md: 'center' },
        mr: { xs: '0.5rem', sm: 0 },
        maxWidth: '100%',
    };

    const boxShadow =
        '0 20px 11px 0 rgba(0, 0, 0, 0.00), 0 12px 10px 0 rgba(0, 0, 0, 0.01), ' +
        '0 7px 9px 0 rgba(0, 0, 0, 0.05), 0 3px 6px 0 rgba(0, 0, 0, 0.09), 0 1px 3px 0 rgba(0, 0, 0, 0.10)';

    return (
        <LandingSection
            outerStyles={landingOuterStyles}
            innerStyles={{ position: 'relative' }}
            image={tenant.heroImageUrl || LandingPageBanner}
        >
            <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems="flex-start"
                boxShadow={boxShadow}
                borderRadius="1.5rem"
                margin="0"
                py="4em"
                px={{ xs: '1em', sm: '2em', md: '3em' }}
                maxWidth="45rem"
                gap="1.5em"
                sx={{ backgroundColor: `white` }}
            >
                <Grid container color="type.primary" direction="column" gap={1}>
                    <Heading1 sx={{ margin: 0 }}>{tenant.title}</Heading1>
                    <BodyText>{tenant.description}</BodyText>
                </Grid>
                <Grid
                    container
                    direction={{ xs: 'column', sm: 'row' }}
                    gap={{ xs: '0.5rem', sm: '1rem' }}
                    alignItems="center"
                    flexWrap="nowrap"
                    width="100%"
                >
                    <Input
                        id="hero-area-input"
                        name="hero-area-input"
                        value={searchText}
                        aria-label={translate('landing.hero.aria.search')}
                        placeholder={translate('landing.hero.searchPlaceholder')}
                        disableUnderline={true}
                        sx={inputStyles}
                        onChange={(event) => {
                            setSearchText(event.target.value);
                        }}
                        slotProps={{
                            input: {
                                sx: { height: '2.5rem', width: '100%', minHeight: '2.5rem' },
                            },
                        }}
                        startAdornment={
                            <InputAdornment position="start">
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    style={{ marginRight: '4px', color: colors.surface.gray[90] }}
                                />
                            </InputAdornment>
                        }
                    />
                    <Box component="span" style={{ fontSize: '0.75rem' }}>
                        or
                    </Box>
                    <React.Suspense fallback={null}>
                        <Await resolve={regionFilter}>
                            {(filterableRegion) =>
                                filterableRegion && (
                                    <Select
                                        id="hero-area-select"
                                        name="hero-area-select"
                                        aria-label={translate('landing.hero.aria.regionSelect')}
                                        displayEmpty={true}
                                        renderValue={(selected) =>
                                            selected && selected !== 'None' ? (
                                                searchParams.get('region')
                                            ) : (
                                                <Box component="span" style={{ opacity: 0.42 }}>
                                                    {translate('landing.hero.regionSelectPlaceholder')}
                                                </Box>
                                            )
                                        }
                                        sx={selectStyles}
                                        value={searchParams.get('region') || ''}
                                        onChange={(event) => {
                                            const newValue = event.target.value;
                                            const newParams = new URLSearchParams(searchParams);
                                            if (newValue === 'None') {
                                                newParams.delete('region');
                                            } else {
                                                newParams.set('region', newValue);
                                            }
                                            setSearchParams(newParams);
                                        }}
                                        inputProps={{
                                            'aria-label': `Select an area to filter the engagements.`,
                                        }}
                                        MenuProps={{
                                            disableScrollLock: true,
                                        }}
                                    >
                                        <MenuItem key="hero-area-none" value="None">
                                            {translate('landing.hero.regionSelectNoneValue')}
                                        </MenuItem>
                                        {filterableRegion.values.map((value) => (
                                            <MenuItem key={`hero-area-${value}-option`} value={value}>
                                                {value}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                )
                            }
                        </Await>
                    </React.Suspense>
                    <Grid
                        container
                        mt={{ xs: '1rem', sm: '0' }}
                        justifyContent="space-between"
                        alignItems="center"
                        rowGap="1rem"
                        width={{ xs: '100%', sm: 'fit-content' }}
                    >
                        <Link
                            sx={linkStyles}
                            to={`${getPath(ROUTES.PUBLIC_SEARCH)}${searchPageParams.size ? `?${searchPageParams}` : ''}`}
                        >
                            <PrimaryButton type="button" sx={{ height: '2.5rem', px: '1.5rem' }}>
                                {translate('landing.hero.search')}
                            </PrimaryButton>
                        </Link>
                        {isTabletOrSmaller && <BrowseAllLink>{translate('landing.hero.browseAllShort')}</BrowseAllLink>}
                    </Grid>
                </Grid>
                {!isTabletOrSmaller && <BrowseAllLink>{translate('landing.hero.browseAllLong')}</BrowseAllLink>}
            </Grid>
        </LandingSection>
    );
};

const BrowseAllLink = ({ children }: { children: React.ReactNode }) => {
    return (
        <Link
            to={`${getPath(ROUTES.PUBLIC_SEARCH)}`}
            sx={{
                color: 'type.primary',
                textDecoration: 'none',
                fontSize: 'small',
                display: 'flex',
                direction: 'row',
                flexWrap: 'nowrap',
                alignItems: 'center',

                '&:hover': {
                    textDecoration: 'underline',
                },
            }}
        >
            <Box component="span" sx={{ fontSize: '0.875rem' }}>
                {children}
            </Box>
            <FontAwesomeIcon icon={faArrowRightLong} style={{ marginLeft: '0.5rem' }} />
        </Link>
    );
};
