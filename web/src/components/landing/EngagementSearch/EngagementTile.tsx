import React, { useEffect, useState } from 'react';
import { Grid2 as Grid, Card, CardContent, CardMedia, CardActionArea, ThemeProvider, Chip, Stack } from '@mui/material';
import { Engagement } from 'models/engagement';
import { getEngagement } from 'services/engagementService';
import dayjs from 'dayjs';
import { EngagementStatusChip } from 'components/common/Indicators/StatusChip';
import { TileSkeleton } from './TileSkeleton';
import { useAppTranslation } from 'hooks';
import { BodyText, Heading2 } from 'components/common/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import { faCubes } from '@fortawesome/pro-light-svg-icons';
import { colors, elevations, globalFocusShadow } from 'components/common';
import { BaseTheme, DarkTheme } from 'styles/Theme';
import { Link, RouterLinkRenderer } from 'components/common/Navigation/Link';
import { getPath, ROUTES } from 'routes/routes';
import BlueprintImagePlaceholder from 'components/engagement/preview/placeholders/BlueprintImagePlaceholder';
import { SubmissionStatus } from 'constants/engagementStatus';

interface EngagementTileProps {
    passedEngagement?: Engagement;
    engagementId: number;
}
const EngagementTile = ({ passedEngagement, engagementId }: EngagementTileProps) => {
    const { t: translate } = useAppTranslation();
    const [loadedEngagement, setLoadedEngagement] = useState<Engagement | null>(passedEngagement || null);
    const [isLoadingEngagement, setIsLoadingEngagement] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const startDate = dayjs(loadedEngagement?.start_date);
    const endDate = dayjs(loadedEngagement?.end_date);
    const dateFormat = 'MMM DD, YYYY';
    const semanticDateFormat = 'YYYY-MM-DD';
    const language = sessionStorage.getItem('languageId');
    const engagementUrl = getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
        slug: loadedEngagement?.slug ?? '',
        language: language ?? '',
    });

    const loadEngagement = async () => {
        if (passedEngagement) {
            setLoadedEngagement(passedEngagement);
            setIsLoadingEngagement(false);
            return;
        }

        if (!engagementId) {
            setIsLoadingEngagement(false);
            return;
        }

        try {
            const engagement = await getEngagement(engagementId);
            setLoadedEngagement(engagement);
        } catch {
        } finally {
            setIsLoadingEngagement(false);
        }
    };
    useEffect(() => {
        loadEngagement();
    }, [passedEngagement, engagementId]);

    if (isLoadingEngagement) {
        return <TileSkeleton />;
    }

    if (!loadedEngagement) {
        return <BodyText size="large">{translate('landingPage.tile.error')}</BodyText>;
    }

    const getEngagementCTA = () => {
        switch (loadedEngagement?.submission_status) {
            case SubmissionStatus.Upcoming:
                return translate('landingPage.tile.cta.upcoming');
            case SubmissionStatus.Open:
                return translate('landingPage.tile.cta.open');
            case SubmissionStatus.Closed:
                return translate('landingPage.tile.cta.closed');
            case SubmissionStatus.ClosedWithResults:
                return translate('landingPage.tile.cta.closedWithResults');
            default:
                return translate('landingPage.tile.cta.upcoming');
        }
    };

    const getEngagementImportantDate = () => {
        switch (loadedEngagement?.submission_status) {
            case SubmissionStatus.Upcoming:
                return translate('landingPage.tile.opensOn').replace('{0}', startDate.format(dateFormat));
            case SubmissionStatus.Open:
                return translate('landingPage.tile.openUntil').replace('{0}', endDate.format(dateFormat));
            case SubmissionStatus.Closed:
            case SubmissionStatus.ClosedWithResults:
                return translate('landingPage.tile.closedOn').replace('{0}', endDate.format(dateFormat));
            default:
                return '';
        }
    };

    const { name, banner_url } = loadedEngagement;

    return (
        <ThemeProvider theme={isHovered || isFocused ? DarkTheme : BaseTheme}>
            <Card
                draggable={false}
                className={isActive ? 'active' : ''}
                sx={{
                    cursor: isLoadingEngagement ? 'not-allowed' : 'pointer',
                    borderRadius: '24px',
                    width: '343px',
                    '&:hover, &:has(:hover)': {
                        boxShadow: elevations.hover,
                        background: colors.surface.blue[90],
                    },
                    '&:focus, &:has(:focus)': {
                        boxShadow: elevations.hover,
                        background: colors.surface.blue[90],
                    },
                    '&:focus-visible, &:has(:focus-visible)': {
                        boxShadow: [globalFocusShadow, elevations.hover].join(','),
                        '& .MuiCardMedia-root': {
                            borderRadius: '24px 24px 0px 0px',
                            boxShadow: globalFocusShadow,
                        },
                        outline: `2px solid ${colors.focus.regular.outer}`,
                        background: colors.surface.blue[90],
                    },
                    '&.active': {
                        boxShadow: elevations.pressed,
                        '&:focus-visible, &:has(:focus-visible)': {
                            boxShadow: [globalFocusShadow, elevations.pressed].join(','),
                        },
                        background: colors.surface.blue[100],
                    },
                }}
            >
                <CardActionArea
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        setIsActive(false);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onMouseDown={() => setIsActive(true)}
                    onMouseUp={() => setIsActive(false)}
                    LinkComponent={RouterLinkRenderer}
                    href={isLoadingEngagement ? '#' : engagementUrl}
                    sx={{
                        cursor: isLoadingEngagement ? 'progress' : 'pointer',
                        '&:focus-visible': {
                            // focus visible styling is applied by the parent Card component
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            padding: 'unset',
                            margin: 'unset',
                        },
                    }}
                >
                    <CardMedia sx={{ height: '147px' }} image={banner_url ?? ''}>
                        <EngagementStatusChip
                            sx={{ position: 'absolute', zIndex: 2, margin: '0.75rem 1.5rem' }}
                            hovered={isHovered || isFocused || isActive}
                            statusId={loadedEngagement.submission_status}
                        />
                        {!banner_url && <BlueprintImagePlaceholder height="100%" />}
                    </CardMedia>
                    <CardContent
                        sx={{
                            height: '300px',
                            p: 3,
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Grid container spacing={3} flexDirection="column">
                            {/* Next important date */}
                            <Grid size={12} container>
                                <BodyText size="small" sx={{ lineHeight: 1, textWrap: 'nowrap' }}>
                                    {getEngagementImportantDate()}
                                </BodyText>
                            </Grid>
                            <Heading2
                                weight="thin"
                                component="p"
                                sx={{
                                    fontSize: '22px',
                                    m: 0,
                                    lineHeight: 'normal',
                                }}
                            >
                                {name}
                            </Heading2>

                            {/* Engagement Metadata Chips */}
                            <Stack
                                direction="row"
                                spacing={1}
                                useFlexGap
                                flexWrap="wrap"
                                maxHeight="64px"
                                overflow="clip"
                            >
                                {loadedEngagement.metadata?.map((metadatum) => (
                                    <Chip
                                        size="small"
                                        sx={{
                                            height: '28px',
                                            fontSize: '12px',
                                            color:
                                                isHovered || isFocused || isActive
                                                    ? 'text.invertPrimary'
                                                    : 'text.primary',
                                            borderRadius: '4px',
                                            backgroundColor: 'gray.30',
                                            '& .MuiChip-icon': { color: 'gray.80' },
                                        }}
                                        key={metadatum.id}
                                        icon={<FontAwesomeIcon fontSize="18px" icon={faCubes} />}
                                        label={metadatum.value}
                                    />
                                ))}
                            </Stack>
                        </Grid>

                        {/* Call to Action */}
                        <Grid container>
                            <Link component="p" display="flex" gap="8px" alignItems="center">
                                {getEngagementCTA()}
                                <FontAwesomeIcon icon={faArrowRight} />
                            </Link>
                        </Grid>
                    </CardContent>
                </CardActionArea>
            </Card>
        </ThemeProvider>
    );
};

export default EngagementTile;
