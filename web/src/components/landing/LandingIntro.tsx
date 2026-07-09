import React from 'react';
import { Grid2 as Grid, Theme, useMediaQuery } from '@mui/material';
import { BodyText, Heading2 } from 'components/common/Typography';
import LandingSection from './LandingSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentExclamation, faMessageCheck, faSquarePollVertical } from '@fortawesome/pro-regular-svg-icons';
import { EngagementTallyRowProps } from './types';
import { colors } from 'styles/Theme';

const EngagementTallyRow = (props: EngagementTallyRowProps) => {
    return (
        <Grid
            container
            width="100%"
            gap="24px"
            sx={{
                flexWrap: 'nowrap',
                flexDirection: 'row',
                justifyContent: { xs: 'flex-start', sm: 'center', md: 'flex-end' },
            }}
        >
            <Grid
                container
                sx={{
                    width: '84px',
                    minWidth: '84px',
                    height: '84px',
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    border: `2px solid ${colors.surface.blue[50]}`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    color: colors.surface.blue[90],
                    background: colors.surface.white,
                }}
            >
                <FontAwesomeIcon icon={props.icon} />
            </Grid>
            <Grid container direction="column" align-items="flex-start" width="200px" sx={{ justifyContent: 'center' }}>
                <BodyText bold sx={{ fontSize: '20px' }}>
                    {props.count}
                </BodyText>
                <BodyText sx={{ fontSize: '16px' }}>{props.text}</BodyText>
            </Grid>
        </Grid>
    );
};

const LandingIntro = () => {
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });

    const tallyData = [
        {
            icon: faCommentExclamation,
            count: 989,
            text: 'Responses from the public',
        },
        {
            icon: faMessageCheck,
            count: 13,
            text: 'open engagements',
        },
        {
            icon: faSquarePollVertical,
            count: 534,
            text: 'engagements since 2012',
        },
    ];

    return (
        <LandingSection
            colour={colors.surface.blue[10]}
            outerStyles={{ mt: '-20px', borderRadius: '16px 16px 0 0', minHeight: '435px', position: 'relative' }}
            innerStyles={{
                position: 'relative',
                flexDirection: { xs: 'column', md: 'row' },
                gap: '2rem',
                flexWrap: 'nowrap',
            }}
        >
            <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems="flex-start"
                sx={(theme) => ({
                    borderRadius: 'none',
                    minHeight: '400px',
                    gap: 0,
                    width: '60%',
                    pt: isMobile ? '40px' : undefined,

                    [theme.breakpoints.down(900)]: {
                        width: '100%',
                    },
                })}
            >
                <Heading2
                    sx={{
                        mt: '0.5rem',
                        fontWeight: '300',
                        '&::before': {
                            backgroundColor: colors.surface.gold['bc'],
                            content: '""',
                            display: 'block',
                            width: '40px',
                            height: '4px',
                            position: 'relative',
                            bottom: '4px',
                        },
                    }}
                >
                    Why you should participate
                </Heading2>
                <BodyText>
                    {'Donec sed odio dui. Nullam id dolor id nibh ultricies vehicula ut id elit. Nullam quis risus eget urna mollis ' +
                        'ornare vel eu leo. Donec ullamcorper nulla non metus auctor fringilla. Curabitur blandit tempus porttitor. Sed ' +
                        'posuere consectetur est at lobortis.' +
                        'Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Fusce dapibus, tellus ac cursus commodo, tortor mauris ' +
                        'condimentum nibh, ut fermentum massa justo sit amet risus. Praesent commodo cursus magna, vel scelerisque nisl consectetur ' +
                        'et. Vestibulum id ligula porta felis euismod semper. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. ' +
                        'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec ullamcorper nulla non metus auctor fringilla.'}
                </BodyText>
            </Grid>
            <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems={{ xs: 'center', md: 'flex-end' }}
                sx={(theme) => ({
                    borderRadius: 'none',
                    minHeight: '400px',
                    gap: '24px',
                    width: '40%',

                    [theme.breakpoints.down(900)]: {
                        width: '100%',
                    },
                })}
            >
                {tallyData.map((td) => (
                    <EngagementTallyRow key={td.text} icon={td.icon} count={td.count} text={td.text} />
                ))}
            </Grid>
        </LandingSection>
    );
};

export default LandingIntro;
