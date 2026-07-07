import React, { useContext } from 'react';
import { Grid2 as Grid, Theme, useMediaQuery } from '@mui/material';
import LandingPageBanner from 'assets/images/LandingPageBanner.png';
import { BodyText, Heading1 } from 'components/common/Typography';
import { LandingBannerProps } from './types';
import LandingSection from './LandingSection';
import { AuthKeyCloakContext } from 'components/auth/AuthKeycloakContext';
import { colors } from 'styles/Theme';

export const LandingHero = (props: LandingBannerProps) => {
    const { isAuthenticated } = useContext(AuthKeyCloakContext);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });

    return (
        <LandingSection
            outerStyles={{
                pt: isAuthenticated ? { xs: '10px', sm: '87px' } : { xs: 0, sm: '24px' },
                pb: { xs: 0, sm: '78px' },
                minHeight: isMobile ? 'auto' : '282px',
            }}
            innerStyles={{ position: 'relative' }}
            image={isMobile ? 'none' : props.tenant.heroImageUrl || LandingPageBanner}
        >
            <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems="flex-start"
                sx={(theme) => ({
                    backgroundColor: isMobile ? colors.surface.blue[90] : `${colors.surface.blue[90]}d9`, // d9 adds opacity at 85%
                    borderRadius: isMobile ? '0 1.5rem 0 0' : '0 1.5rem 1.5rem 0',
                    margin: '0 !important',
                    marginLeft: 'calc(-50vw + 50%) !important',
                    padding: isMobile ? '2em 1em 4em 1em' : '1em',
                    paddingLeft: 'calc(50vw - 50%)',
                    width: isMobile ? 'calc(100vw - 8px)' : 'calc((50vw - 50%) + 430px)',
                    maxWidth: '100vw',
                    minHeight: '200px',
                    gap: 0,
                })}
            >
                <Heading1 sx={{ mt: '0.5rem', color: 'white' }}>{props.tenant.title}</Heading1>
                <BodyText sx={{ color: 'white' }}>{props.tenant.description}</BodyText>
            </Grid>
        </LandingSection>
    );
};
