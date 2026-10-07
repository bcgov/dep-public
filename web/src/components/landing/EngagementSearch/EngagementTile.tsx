import React, { useEffect, useState } from 'react';
import { Grid2 as Grid, Card, CardContent, CardMedia, CardActionArea, ThemeProvider, Chip, Stack } from '@mui/material';
import { ResponsiveStyleValue } from '@mui/system';
import { Engagement } from 'models/engagement';
import { getEngagement } from 'services/engagementService';
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
import { convertToPacific } from 'components/common/dateHelper';

interface EngagementTileProps {
    passedEngagement?: Engagement;
    engagementId: number;
    orientation?: ResponsiveStyleValue<'horizontal' | 'vertical'>;
}

export function mapOrientation<T extends string>(
    orientation: ResponsiveStyleValue<'horizontal' | 'vertical'>,
    horizontalValue: T,
    verticalValue: T,
): ResponsiveStyleValue<T> {
    const getValue = (value: 'horizontal' | 'vertical' | null) =>
        value === 'horizontal' ? horizontalValue : verticalValue;

    if (Array.isArray(orientation)) return orientation.map(getValue);

    if (typeof orientation === 'object') {
        const breakpointValues = Object.fromEntries(
            Object.entries(orientation)
                .filter(([, value]) => value !== null)
                .map(([breakpoint, value]) => [breakpoint, getValue(value)]),
        );
        // Ensure that the default value for the smallest breakpoint is set to verticalValue
        return { xs: verticalValue, ...breakpointValues };
    }

    return orientation === 'horizontal' ? horizontalValue : verticalValue;
}

const EngagementTile = ({ passedEngagement, engagementId, orientation = 'vertical' }: EngagementTileProps) => {
    const { t: translate } = useAppTranslation();
    const [loadedEngagement, setLoadedEngagement] = useState<Engagement | null>(passedEngagement || null);
    const [isLoadingEngagement, setIsLoadingEngagement] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isActive, setIsActive] = useState(false);
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
        void loadEngagement();
    }, [passedEngagement, engagementId]);

    if (isLoadingEngagement) {
        return <TileSkeleton orientation={orientation} />;
    }

    if (!loadedEngagement) {
        return <BodyText size="large">{translate('landingPage.tile.error')}</BodyText>;
    }

    const getEngagementCTA = () => {
        switch (loadedEngagement?.submission_status) {
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

    const getImportantDateLabel = () => {
        switch (loadedEngagement?.submission_status) {
            case SubmissionStatus.Open:
                return translate('landingPage.tile.openUntil');
            case SubmissionStatus.Closed:
            case SubmissionStatus.ClosedWithResults:
                return translate('landingPage.tile.closedOn');
            default:
                return translate('landingPage.tile.opensOn');
        }
    };

    const nextImportantDate = convertToPacific(
        loadedEngagement.submission_status == SubmissionStatus.Upcoming
            ? loadedEngagement.start_date
            : loadedEngagement.end_date,
    );

    const { name, banner_url } = loadedEngagement;

    const cardMinWidth = mapOrientation(orientation, '704px', '343px');
    const cardMaxWidth = mapOrientation(orientation, '806px', '343px');
    const mediaHeight = mapOrientation(orientation, '289px', '147px');
    const mediaWidth = mapOrientation(orientation, '33.3%', '343px');
    const contentWidth = mapOrientation(orientation, '426px', '100%');
    const contentHeight = mapOrientation(orientation, '289px', '345px');

    return (
        <ThemeProvider theme={isHovered || isFocused ? DarkTheme : BaseTheme}>
            <Card
                draggable={false}
                className={isActive ? 'active' : ''}
                sx={{
                    '& a': {
                        display: 'flex',
                        flexDirection: mapOrientation(orientation, 'row', 'column'),
                        justifyContent: 'flex-start',
                    },
                    cursor: isLoadingEngagement ? 'not-allowed' : 'pointer',
                    borderRadius: '24px',
                    width: '100%',
                    minWidth: cardMinWidth,
                    maxWidth: cardMaxWidth,
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
                    <CardMedia
                        sx={{ height: mediaHeight, minWidth: mediaWidth, backgroundPositionX: '85%' }}
                        image={banner_url ?? ''}
                    >
                        <EngagementStatusChip
                            sx={{ position: 'absolute', zIndex: 2, margin: '0.75rem 1.5rem' }}
                            hovered={isHovered || isFocused || isActive}
                            statusId={loadedEngagement.submission_status}
                        />
                        {!banner_url && <BlueprintImagePlaceholder height="100%" />}
                    </CardMedia>
                    <CardContent
                        sx={{
                            height: contentHeight,
                            width: contentWidth,
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
                                    {getImportantDateLabel().split('{0}')[0]}
                                    <time dateTime={nextImportantDate.format(semanticDateFormat)}>
                                        {nextImportantDate.format(dateFormat)}
                                    </time>
                                    {getImportantDateLabel().split('{0}')[1] ?? ''}
                                </BodyText>
                            </Grid>
                            <Heading2
                                weight="thin"
                                component="p"
                                sx={{
                                    // Required for multi-line text truncation
                                    // https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp
                                    // Works on: Chrome, Firefox, Safari, Opera, Edge
                                    // On unsupported browsers, displays as 3 lines with no ellipsis
                                    flexGrow: 1,
                                    display: '-webkit-box',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    WebkitLineClamp: mapOrientation(orientation, '2', '3'),
                                    WebkitBoxOrient: 'vertical',
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
                                        key={metadatum.id}
                                        icon={
                                            <FontAwesomeIcon
                                                style={{ marginLeft: '12px' }}
                                                fontSize="18px"
                                                icon={faCubes}
                                            />
                                        }
                                        label={metadatum.value}
                                        sx={{
                                            transition: '0s',
                                            height: '28px',
                                            fontSize: '12px',
                                            borderRadius: '4px',
                                            backgroundColor:
                                                isHovered || isFocused || isActive ? 'blue.100' : 'gray.30',
                                        }}
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
