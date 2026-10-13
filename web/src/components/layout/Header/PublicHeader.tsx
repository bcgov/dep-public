import React from 'react';
import { AppBar, Box, Grid2 as Grid, Toolbar } from '@mui/material';
import { colors, Layout, Palette } from 'styles/Theme';
import { ReactComponent as BCLogo } from 'assets/images/BritishColumbiaLogoDark.svg';
import { BodyText } from 'components/common/Typography';
import { Link } from 'components/common/Navigation';
import { elevations } from 'components/common';
import EnvironmentBanner from './EnvironmentBanner';
import { getPath, ROUTES } from 'routes/routes';

const PublicHeader = () => {
    return (
        <AppBar
            position="static"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: 'transparent',
                color: Palette.internalHeader.color,
                backgroundClip: 'padding-box',
                overflow: 'hidden',
                left: 0,
                boxShadow: elevations.default,
                borderRadius: 0,
                boxSizing: 'border-box',
            }}
            data-testid="simplified-header"
        >
            <Grid container sx={{ px: Layout.padding.default }}>
                <Toolbar
                    sx={{
                        height: '4em',
                        width: Layout.width.default,
                        margin: '0 auto !important',
                        padding: `0 !important`,
                        backgroundColor: Palette.internalHeader.backgroundColor,
                    }}
                >
                    {/* BC Government Logo */}
                    <Link
                        underline="none"
                        sx={{ height: '100%', marginInlineEnd: '2px', marginInlineStart: '-13px' }}
                        to={getPath(ROUTES.PUBLIC_LANDING)}
                    >
                        <Box component="span" dir="ltr">
                            <Box
                                component={BCLogo}
                                sx={{
                                    height: '100%',
                                    width: 'auto',
                                    padding: '0',
                                }}
                                alt="Government of British Columbia Logo"
                            />
                        </Box>
                    </Link>

                    {/* Divider */}
                    <Box
                        sx={{
                            borderLeft: `1px solid ${colors.surface.gray[80]}`,
                            height: '1.5em',
                            width: '1px',
                            marginInlineEnd: '1em',
                        }}
                    />

                    <Link to={getPath(ROUTES.PUBLIC_LANDING)} underline="none">
                        {/* engageBC Branding */}
                        <BodyText dir="ltr" thin sx={{ color: colors.surface.blue[80], userSelect: 'none' }}>
                            engage{/*no space*/}
                            <span style={{ color: colors.surface.blue[90], fontWeight: 'normal' }}>BC</span>
                        </BodyText>
                    </Link>
                </Toolbar>
            </Grid>
            <EnvironmentBanner />
        </AppBar>
    );
};

export default PublicHeader;
