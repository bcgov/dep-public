import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { BodyText, Heading2 } from 'components/common/Typography';
import LandingSection from './LandingSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentExclamation, faMessageCheck, faSquarePollVertical } from '@fortawesome/pro-regular-svg-icons';
import { EngagementTallyRowProps } from './types';
import { colors } from 'styles/Theme';
import { useAppTranslation } from 'hooks';

const LandingStats = () => {
    const { t: translate } = useAppTranslation();

    // Replace counts with real values when they are available from the API
    const tallyData = [
        {
            icon: faCommentExclamation,
            count: 989,
            text: translate('landing.stats.publicResponses'),
        },
        {
            icon: faSquarePollVertical,
            count: 530,
            text: translate('landing.stats.totalEngagements'),
        },
        {
            icon: faMessageCheck,
            count: 13,
            text: translate('landing.stats.openOpportunities'),
        },
        {
            icon: faSquarePollVertical,
            count: 534,
            text: translate('landing.stats.upcomingOpportunities'),
        },
    ];

    // Styles

    const heading2Styles = {
        fontWeight: 'normal',
        fontSize: '1.25rem',
        color: 'white',
        m: 0,
        minWidth: '16.6875rem',
    };

    return (
        <LandingSection
            colour={colors.surface.blue[10]}
            outerStyles={{
                position: 'relative',
                background: colors.surface.blue[90],
                py: '1.5rem',
                px: { xs: '1rem', sm: '2rem' },
            }}
            innerStyles={{
                position: 'relative',
                flexDirection: { xs: 'column', md: 'row' },
                gap: '2rem',
                flexWrap: 'nowrap',
            }}
        >
            <Grid
                container
                direction="row"
                flexWrap={{ xs: 'wrap', lg: 'nowrap' }}
                alignItems="center"
                width="100%"
                gap="3rem"
                sx={{ borderRadius: 'none' }}
            >
                <Heading2 sx={heading2Styles}>{translate('landing.stats.title')}</Heading2>
                <Grid
                    container
                    direction="row"
                    flexWrap={{ xs: 'wrap', lg: 'nowrap' }}
                    justifyContent="space-between"
                    rowGap="2rem"
                    width="100%"
                    maxWidth="100%"
                    overflow="hidden"
                >
                    {tallyData.map((td) => (
                        <EngagementStatsItem key={td.text} icon={td.icon} count={td.count} text={td.text} />
                    ))}
                </Grid>
            </Grid>
        </LandingSection>
    );
};

const EngagementStatsItem = (props: EngagementTallyRowProps) => {
    return (
        <Grid
            flexWrap="nowrap"
            direction="column"
            flexBasis={{ xs: '50%', md: '25%' }}
            justifyContent="flex-start"
            minWidth="8.75rem"
        >
            <Grid container alignItems="center" gap={1} color="white" fontSize="1.125rem">
                <FontAwesomeIcon icon={props.icon} />
                <BodyText bold color="white" sx={{ fontSize: '1.125rem' }}>
                    {props.count}
                </BodyText>
            </Grid>
            <BodyText color="white" sx={{ fontSize: '0.75rem' }}>
                {props.text}
            </BodyText>
        </Grid>
    );
};

export default LandingStats;
