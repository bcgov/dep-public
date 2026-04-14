import React, { Suspense } from 'react';
import { Box, Grid2 as Grid, Skeleton } from '@mui/material';
import { TileSkeleton } from 'components/landing/TileSkeleton';
import EngagementTile from 'components/landing/EngagementTile';
import { Heading2 } from 'components/common/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeftLong } from '@fortawesome/pro-regular-svg-icons';
import { Link } from 'components/common/Navigation';
import { Await, useLoaderData } from 'react-router';

import { EngagementLoaderPublicData } from './EngagementLoaderPublic';
import { EngagementViewSections } from '.';
import { SuggestedEngagementWithAttachment } from 'models/suggestedEngagement';
import { Engagement } from 'models/engagement';
import { previewValue } from 'engagements/preview/PreviewSwitch';
import { usePreview } from 'engagements/preview/PreviewContext';
import { EngagementPreviewTag } from './EngagementPreviewTag';
import { getPath, ROUTES } from 'routes/routes';

export const SuggestedEngagements = () => {
    const { suggestions, engagement } = useLoaderData() as EngagementLoaderPublicData;
    const engagementSlots = Array.from({ length: 3 });
    const { isPreviewMode } = usePreview();

    const placeholderStyles = {
        border: `2px dashed`,
        borderColor: 'primary.light',
        borderRadius: '16px',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'primary.light',
        minHeight: '442px',
        userSelect: 'none',
    };

    return (
        // Outer boundary: resolves suggestions to decide whether to render the section at all
        <Suspense
            fallback={
                <Box
                    sx={{
                        padding: {
                            xs: '64px 16px 24px 16px',
                            md: '64px 5vw 40px 5vw',
                            lg: '64px 10em 40px 10em',
                        },
                    }}
                >
                    <Skeleton variant="text" width="40%" sx={{ mb: '42px', fontSize: '2rem' }} />
                    <Grid
                        container
                        justifyContent="space-between"
                        alignItems="center"
                        size={12}
                        columnSpacing={2}
                        wrap="nowrap"
                        overflow="auto"
                        pb={1}
                    >
                        {engagementSlots.map((_, i) => (
                            <Grid
                                size="auto"
                                key={`placeholder-${i + 1}`}
                                container
                                width="320px"
                                sx={placeholderStyles}
                            >
                                <TileSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            }
        >
            <Await resolve={suggestions}>
                {(sugs: SuggestedEngagementWithAttachment[]) =>
                    !sugs || sugs.length < 1 ? null : ( // Do not render section if there are no suggested engagements
                        <section
                            id={EngagementViewSections.MORE_ENGAGEMENTS}
                            aria-label="Suggested Engagements"
                            style={{ position: 'relative' }}
                        >
                            <EngagementPreviewTag>Suggested Engagements Section</EngagementPreviewTag>
                            <Box
                                sx={{
                                    padding: {
                                        xs: '64px 16px 24px 16px',
                                        md: '64px 5vw 40px 5vw',
                                        lg: '64px 10em 40px 10em',
                                    },
                                }}
                            >
                                {/* Inner boundary: resolves engagement only for the heading text */}
                                <Suspense
                                    fallback={
                                        <Skeleton variant="text" width="40%" sx={{ mb: '42px', fontSize: '2rem' }} />
                                    }
                                >
                                    <Await resolve={engagement}>
                                        {(eng: Engagement) => (
                                            <Heading2 weight="thin" sx={{ mb: '42px' }} decorated>
                                                {eng?.more_engagements_heading || 'You may also be interested in'}
                                            </Heading2>
                                        )}
                                    </Await>
                                </Suspense>
                                <Grid
                                    container
                                    justifyContent="space-between"
                                    alignItems="center"
                                    size={12}
                                    columnSpacing={2}
                                    wrap="nowrap"
                                    overflow="auto"
                                    p={2}
                                    m={-2}
                                >
                                    {engagementSlots.map((_, i) => {
                                        const sug = sugs.find((s) => s.sort_index === i + 1);
                                        return previewValue<React.ReactNode>({
                                            isPreviewMode: isPreviewMode,
                                            hasValue: Boolean(sug),
                                            value: sug ? (
                                                <Grid size="auto" key={`suggestion-${sug.suggested_engagement_id}`}>
                                                    <EngagementTile
                                                        passedEngagement={sug.engagement as Engagement}
                                                        engagementId={sug.suggested_engagement_id}
                                                    />
                                                </Grid>
                                            ) : null,
                                            previewFallback: (
                                                <Grid
                                                    key={`placeholder-${i + 1}`}
                                                    size="auto"
                                                    container
                                                    width="320px"
                                                    sx={placeholderStyles}
                                                >
                                                    <p
                                                        aria-label="There is no engagement loaded in this slot."
                                                        style={{ fontSize: '1.25rem' }}
                                                    >
                                                        Engagement Card
                                                    </p>
                                                </Grid>
                                            ),
                                            fallback: null,
                                        });
                                    })}
                                </Grid>
                                <Grid size={12} mt="64px" textAlign={'center'}>
                                    <Link to={getPath(ROUTES.HOME)} sx={{ color: 'text.primary' }}>
                                        <FontAwesomeIcon icon={faArrowLeftLong} style={{ paddingRight: '8px' }} />
                                        All engagements
                                    </Link>
                                </Grid>
                            </Box>
                        </section>
                    )
                }
            </Await>
        </Suspense>
    ); // end outer Suspense
};
