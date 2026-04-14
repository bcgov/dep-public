import React, { useContext } from 'react';
import { AppBar, Box, Toolbar } from '@mui/material';
import { colors, Palette } from 'styles/Theme';
import { ReactComponent as BCLogo } from 'assets/images/BritishColumbiaLogoDark.svg';
import { BodyText } from 'components/common/Typography';
import { Link } from 'components/common/Navigation';
import { elevations } from 'components/common';
import EnvironmentBanner from './EnvironmentBanner';
import { LanguageContext } from 'components/common/LanguageContext';
import LanguageSelector from 'components/common/LanguageSelector';
import { getPath, ROUTES } from 'routes/routes';

const PublicHeader = () => {
    const { engagementViewMounted, availableEngagementTranslations } = useContext(LanguageContext);
    const sidePadding = { xs: '0px 16px 0px 16px', md: '0px 5vw 0px 5vw', lg: '0px 10em 0px 10em' };

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
                borderBottom: '1px solid',
                borderColor: 'gray.10',
            }}
            data-testid="simplified-header"
        >
            <Toolbar
                sx={{
                    height: '4em',
                    padding: sidePadding,
                    backgroundColor: Palette.internalHeader.backgroundColor,
                }}
            >
                {/* BC Government Logo */}
                <Link underline="none" sx={{ height: '100%', mr: '2px' }} href="https://www2.gov.bc.ca/">
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

                {/* Divider */}
                <Box
                    sx={{
                        borderLeft: `1px solid ${colors.surface.gray[80]}`,
                        height: '1.5em',
                        width: '1px',
                        marginRight: '1em',
                    }}
                />

                <Link to={getPath(ROUTES.HOME)} underline="none">
                    {/* engageBC Branding */}
                    <BodyText thin sx={{ color: colors.surface.blue[80], userSelect: 'none' }}>
                        engage{/*no space*/}
                        <span style={{ color: colors.surface.blue[90], fontWeight: 'normal' }}>BC</span>
                    </BodyText>
                </Link>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {engagementViewMounted && availableEngagementTranslations.length > 0 && <LanguageSelector />}
                </Box>
            </Toolbar>
            <EnvironmentBanner />
        </AppBar>
    );
};

export default PublicHeader;
