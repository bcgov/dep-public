import React, { Suspense } from 'react';
import { Await } from 'react-router';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { BodyText, EyebrowText, Heading1 } from 'components/common/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkSlash } from '@fortawesome/pro-regular-svg-icons';
import {
    EngagementStatusDateRow,
    EngagementStatusDateRowSkeleton,
} from 'components/engagement/public/view/EngagementStatusDateRow';
import { SurveyLoaderData } from 'components/survey/building/SurveyLoader';
import { elevations } from 'styles/Theme';

interface SurveyBannerProps {
    loaderData: Pick<SurveyLoaderData, 'survey' | 'engagement'>;
    eyebrowText?: string;
    errorText?: string;
    actions?: React.ReactNode;
    marginBottom?: number;
    alignContentToPublicPageBounds?: boolean;
    showUnlinkedFallback?: boolean;
}

export const SurveyBanner: React.FC<SurveyBannerProps> = ({
    loaderData,
    eyebrowText = 'Survey',
    errorText = 'Error loading survey data.',
    actions,
    marginBottom = 4,
    alignContentToPublicPageBounds = false,
    showUnlinkedFallback = false,
}) => {
    const publicContentMaxWidth = 1120;
    const publicMinGutter = 2;
    const alignedLeftPadding = `max(${publicMinGutter}rem, calc((100vw - ${publicContentMaxWidth}px) / 2))`;
    const unlinkedFallback = showUnlinkedFallback ? (
        <>
            <Grid container alignItems="center" columnSpacing={1} sx={{ mb: '0.75rem' }}>
                <Grid>
                    <FontAwesomeIcon icon={faLinkSlash} style={{ fontSize: '1rem' }} />
                </Grid>
                <Grid>
                    <BodyText bold sx={{ color: 'gray.100', mb: 0 }}>
                        No linked engagement
                    </BodyText>
                </Grid>
            </Grid>
            <BodyText sx={{ color: 'gray.90', mb: 0 }}>
                Link this survey to an engagement to preview banner imagery, live status, and engagement dates.
            </BodyText>
        </>
    ) : null;

    return (
        <Grid container size={12} mb={marginBottom} justifyContent="center">
            <Suspense
                fallback={
                    <SurveyBannerSkeleton
                        eyebrowText={eyebrowText}
                        alignContentToPublicPageBounds={alignContentToPublicPageBounds}
                        alignedLeftPadding={alignedLeftPadding}
                    />
                }
            >
                <Await
                    resolve={Promise.all([loaderData.survey, loaderData.engagement])}
                    errorElement={<div>{errorText}</div>}
                >
                    {([survey, engagement]) => (
                        <Grid
                            container
                            size={12}
                            sx={{
                                borderRadius: alignContentToPublicPageBounds ? 0 : '4px',
                                position: 'relative',
                                bgcolor: 'surface.gray.10',
                                overflow: 'clip',
                                height: '24rem',
                                ml: { xs: '0', md: alignContentToPublicPageBounds ? 0 : '-2rem' },
                                pr: { xs: '0', md: alignContentToPublicPageBounds ? 0 : '2rem' },
                                background: engagement?.banner_url
                                    ? `url(${engagement.banner_url}) no-repeat center right, linear-gradient(140deg, #A9C5DD 0%, #D6E3EE 55%, #EDF3F9 100%)`
                                    : 'linear-gradient(140deg, #A9C5DD 0%, #D6E3EE 55%, #EDF3F9 100%)',
                                maskImage:
                                    alignContentToPublicPageBounds || !engagement?.banner_url
                                        ? 'none'
                                        : {
                                              xs: 'none',
                                              md: 'linear-gradient(to right, transparent 0px, black 32px, black 100%)',
                                          },
                                backgroundSize: 'cover',
                                boxShadow: elevations.pressed,
                                alignItems: { xs: 'flex-end', md: 'center' },
                                justifyContent: { xs: 'center', md: 'flex-start' },
                                boxSizing: 'content-box',
                            }}
                        >
                            <Grid
                                container
                                direction="column"
                                sx={{
                                    width: { xs: '100%', md: 'min(600px, 100%)' },
                                    mt: { xs: '-20px', md: '1rem' },
                                    mb: { xs: '0', md: '24px' },
                                    mr: { xs: '0', md: '4rem' },
                                    borderRadius: { xs: '18px 18px 0 0', md: '0 18px 18px 0' },
                                    px: { xs: '1rem', md: '2rem' },
                                    pl: alignContentToPublicPageBounds
                                        ? { xs: '2rem', md: alignedLeftPadding }
                                        : { xs: '1rem', md: '2rem' },
                                    py: { xs: '1.25rem', md: '1.75rem' },
                                    bgcolor: 'rgba(255, 255, 255, 0.94)',
                                    boxShadow: elevations.hover,
                                    position: 'relative',
                                    zIndex: 1,
                                    backdropFilter: 'blur(8px)',
                                    boxSizing: 'content-box',
                                }}
                            >
                                <EyebrowText mb="8px">{eyebrowText}</EyebrowText>
                                <Heading1 weight="thin" sx={{ mt: 0, mb: '0.5rem' }}>
                                    {survey.name}
                                </Heading1>
                                {engagement ? (
                                    <>
                                        <BodyText bold sx={{ color: 'gray.100', mb: '1rem' }}>
                                            {engagement.name}
                                        </BodyText>
                                        <EngagementStatusDateRow
                                            statusId={engagement.submission_status}
                                            startDate={engagement.start_date}
                                            endDate={engagement.end_date}
                                        />
                                    </>
                                ) : (
                                    unlinkedFallback
                                )}
                            </Grid>
                        </Grid>
                    )}
                </Await>
            </Suspense>
            {actions ? (
                <Grid
                    container
                    size={12}
                    mt="32px"
                    maxWidth={alignContentToPublicPageBounds ? publicContentMaxWidth : undefined}
                    spacing={2}
                >
                    {actions}
                </Grid>
            ) : null}
        </Grid>
    );
};

const SurveyBannerSkeleton: React.FC<{
    eyebrowText: string;
    alignContentToPublicPageBounds: boolean;
    alignedLeftPadding: string;
}> = ({ eyebrowText, alignContentToPublicPageBounds, alignedLeftPadding }) => {
    return (
        <Grid
            container
            size={12}
            sx={{
                borderRadius: alignContentToPublicPageBounds ? 0 : '4px',
                position: 'relative',
                bgcolor: 'surface.gray.10',
                overflow: 'clip',
                height: '24rem',
                ml: { xs: '0', md: alignContentToPublicPageBounds ? '0' : '-2rem' },
                pr: { xs: '0', md: alignContentToPublicPageBounds ? '0' : '2rem' },
                background: 'linear-gradient(140deg, #A9C5DD 0%, #D6E3EE 55%, #EDF3F9 100%)',
                maskImage: alignContentToPublicPageBounds
                    ? 'none'
                    : {
                          xs: 'none',
                          md: 'linear-gradient(to right, transparent 0px, black 32px, black 100%)',
                      },
                backgroundSize: 'cover',
                boxShadow: elevations.pressed,
                alignItems: { xs: 'flex-end', md: 'center' },
                justifyContent: { xs: 'center', md: 'flex-start' },
                boxSizing: 'content-box',
            }}
        >
            <Grid
                container
                direction="column"
                sx={{
                    width: { xs: '100%', md: 'min(760px, 100%)' },
                    mt: { xs: '-20px', md: '1rem' },
                    mb: { xs: '0', md: '24px' },
                    mr: { xs: '0', md: '4rem' },
                    borderRadius: { xs: '18px 18px 0 0', md: '0 18px 18px 0' },
                    px: { xs: '1rem', md: '2rem' },
                    pl: alignContentToPublicPageBounds
                        ? { xs: '2rem', md: alignedLeftPadding }
                        : { xs: '1rem', md: '2rem' },
                    py: { xs: '1.25rem', md: '1.75rem' },
                    bgcolor: 'rgba(255, 255, 255, 0.94)',
                    boxShadow: elevations.hover,
                    position: 'relative',
                    zIndex: 1,
                    backdropFilter: 'blur(8px)',
                }}
            >
                <EyebrowText mb="8px">{eyebrowText}</EyebrowText>
                <Heading1 weight="thin" sx={{ mt: 0, mb: '0.5rem' }}>
                    <Skeleton variant="text" width="60%" />
                </Heading1>
                <BodyText bold sx={{ color: 'gray.100', mb: '1rem' }}>
                    <Skeleton variant="text" width="40%" />
                </BodyText>
                <EngagementStatusDateRowSkeleton />
            </Grid>
        </Grid>
    );
};
