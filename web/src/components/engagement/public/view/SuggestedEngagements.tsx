import React, { Suspense } from 'react';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { TileSkeleton } from 'components/landing/EngagementSearch/TileSkeleton';
import EngagementTile from 'components/landing/EngagementSearch/EngagementTile';
import { Heading2 } from 'components/common/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeftLong } from '@fortawesome/pro-regular-svg-icons';
import { Link } from 'components/common/Navigation';
import { Await } from 'react-router';

import { EngagementViewSections } from '.';
import { SuggestedEngagementWithAttachment } from 'models/suggestedEngagement';
import { Engagement } from 'models/engagement';
import { previewValue } from 'engagements/preview/PreviewSwitch';
import { usePreview } from 'engagements/preview/PreviewContext';
import { EngagementPreviewTag } from './EngagementPreviewTag';
import { getPath, ROUTES } from 'routes/routes';
import { TranslationBundle, resolveTranslationValue } from './engagementTranslationResolution';
import { useEngagementLoaderData } from 'engagements/preview/PreviewLoaderDataContext';
import { Layout } from 'styles/Theme';

export const SuggestedEngagements = () => {
    const { suggestions, engagement, translationBundle } = useEngagementLoaderData();
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
                <Grid
                    container
                    size={12}
                    pt={{ xs: '3rem', md: '4rem' }}
                    pb={{ xs: '24px', md: '40px' }}
                    px={Layout.padding.default}
                >
                    <Skeleton variant="text" width="40%" sx={{ mb: '42px', fontSize: '2rem' }} />
                    <Grid
                        container
                        direction={{ xs: 'column', md: 'row' }}
                        width={Layout.width.default}
                        maxWidth="100%"
                        margin="0 auto"
                        justifyContent="space-between"
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
                                width="343px"
                                sx={placeholderStyles}
                            >
                                <TileSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
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
                            <Grid
                                container
                                size={12}
                                pt={{ xs: '3rem', md: '4rem' }}
                                pb={{ xs: '24px', md: '40px' }}
                                px={Layout.padding.default}
                            >
                                <Grid container width={Layout.width.default} maxWidth="100%" margin="0 auto">
                                    <Suspense
                                        fallback={
                                            <Skeleton
                                                variant="text"
                                                width="40%"
                                                sx={{ mb: '42px', fontSize: '2rem' }}
                                            />
                                        }
                                    >
                                        <Await resolve={Promise.all([engagement, translationBundle])}>
                                            {([eng, resolvedTranslationBundle]: [Engagement, TranslationBundle]) =>
                                                (() => {
                                                    const resolvedHeading = resolveTranslationValue<string>({
                                                        translatedValue:
                                                            resolvedTranslationBundle.currentTranslation
                                                                ?.more_engagements_heading,
                                                        defaultValue:
                                                            resolvedTranslationBundle.defaultTranslation
                                                                ?.more_engagements_heading,
                                                        baseValue: eng?.more_engagements_heading,
                                                        literalFallback: 'You may also be interested in',
                                                    }).value;

                                                    return (
                                                        <Heading2 weight="thin" sx={{ mb: '42px' }} decorated>
                                                            {resolvedHeading}
                                                        </Heading2>
                                                    );
                                                })()
                                            }
                                        </Await>
                                    </Suspense>
                                    <Grid
                                        container
                                        size={12}
                                        maxWidth="100%"
                                        margin="0 auto"
                                        wrap="nowrap"
                                        overflow="auto"
                                        columnSpacing={2}
                                        justifyContent="space-between"
                                        alignItems="center"
                                        p="2px"
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
                                                        width="343px"
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
                                </Grid>
                                <Grid size={12} mt="64px" textAlign={'center'}>
                                    <Link to={getPath(ROUTES.HOME)} sx={{ color: 'text.primary' }}>
                                        <FontAwesomeIcon icon={faArrowLeftLong} style={{ paddingRight: '8px' }} />
                                        All engagements
                                    </Link>
                                </Grid>
                            </Grid>
                        </section>
                    )
                }
            </Await>
        </Suspense>
    ); // end outer Suspense
};
