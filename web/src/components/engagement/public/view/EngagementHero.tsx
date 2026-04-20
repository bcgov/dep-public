import { BodyText, EyebrowText, Heading1 } from 'components/common/Typography';
import React, { Suspense } from 'react';
import { Button } from 'components/common/Input/Button';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { Engagement } from 'models/engagement';
import { Box, Grid2 as Grid, Skeleton } from '@mui/material';
import { colors } from 'components/common';
import {
    EngagementStatusChip,
    getStatusFromStatusId,
    getSubmissionStatusFromPreviewState,
} from 'components/common/Indicators';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { Await } from 'react-router';
import { StatusChipSkeleton } from 'components/common/Indicators/StatusChip';
import { EngagementViewSections } from '.';
import { usePreview } from 'components/engagement/preview/PreviewContext';
import { SubmissionStatus } from 'constants/engagementStatus';
import { BlueprintImagePlaceholder } from 'components/engagement/preview/placeholders/BlueprintImagePlaceholder';
import { TextPlaceholder } from 'components/engagement/preview/placeholders/TextPlaceholder';
import { previewValue, PreviewRender, PreviewSwitch } from 'components/engagement/preview/PreviewSwitch';
import { EngagementPreviewTag } from './EngagementPreviewTag';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';

export const EngagementHero = () => {
    const dateFormat = 'MMM DD, YYYY';
    const semanticDateFormat = 'YYYY-MM-DD';
    const { engagement } = useEngagementLoaderData();
    const { isPreviewMode, previewStateType } = usePreview();
    const startDate = engagement?.then((engagement) => dayjs(engagement.start_date));
    const endDate = engagement?.then((engagement) => dayjs(engagement.end_date));
    const engagementInfo = Promise.all([engagement, startDate, endDate]);

    return (
        <section aria-label="Engagement Overview" id={EngagementViewSections.HERO} style={{ position: 'relative' }}>
            <EngagementPreviewTag required>Hero Banner Section</EngagementPreviewTag>
            <Suspense
                fallback={
                    <Skeleton variant="rectangular" sx={{ width: '100%', height: { xs: '160px', md: '840px' } }} />
                }
            >
                <Await resolve={engagement}>
                    {(engagement: Engagement) => (
                        <PreviewSwitch
                            isPreviewMode={isPreviewMode}
                            hasValue={Boolean(engagement.banner_url)}
                            value={
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: { xs: '160px', md: '840px' },
                                        background: `url(${engagement.banner_url}) no-repeat center center`,
                                        backgroundSize: 'cover',
                                    }}
                                />
                            }
                            previewFallback={
                                <Box sx={{ width: '100%', height: { xs: '160px', md: '840px' } }}>
                                    <BlueprintImagePlaceholder
                                        title="Hero Image"
                                        description="(fills the entire hero banner area)"
                                        height="100%"
                                    />
                                </Box>
                            }
                        />
                    )}
                </Await>
            </Suspense>
            <Box
                sx={{
                    boxSizing: 'border-box',
                    backgroundColor: colors.surface.white,
                    width: { xs: '100%', md: '720px' },
                    minHeight: '540px',
                    maxWidth: '100vw',
                    position: { xs: 'relative', md: 'absolute' },
                    marginTop: { xs: '-24px', md: '-715px' },
                    marginBottom: { xs: '24px', md: '161px' },
                    borderRadius: {
                        xs: '0px 24px 0px 0px', // upper right corner
                        md: '0px 24px 24px 0px', // upper right and lower right corners
                    },
                    padding: { xs: '43px 16px 75px 16px', md: '88px 48px 88px 5vw', lg: '88px 48px 88px 10em' },
                    boxShadow:
                        '0px 20px 11px 0px rgba(0, 0, 0, 0.00), 0px 12px 10px 0px rgba(0, 0, 0, 0.01), 0px 7px 9px 0px rgba(0, 0, 0, 0.05), 0px 3px 6px 0px rgba(0, 0, 0, 0.09), 0px 1px 3px 0px rgba(0, 0, 0, 0.10)',
                    alignSelf: { xs: 'flex-start', md: 'center' },
                    alignContent: 'center',
                }}
            >
                <Suspense
                    fallback={
                        <>
                            <Skeleton>
                                <EyebrowText m="0">Sponsor Name</EyebrowText>
                            </Skeleton>
                            <Skeleton>
                                <Heading1 weight="thin" sx={{ mb: '32px' }}>
                                    Engagement Name
                                </Heading1>
                            </Skeleton>
                            <Grid container mb="48px" flexDirection="row" alignItems="center" columnSpacing={1}>
                                <Grid>
                                    <StatusChipSkeleton />
                                </Grid>
                                <Grid>
                                    <Skeleton>
                                        <BodyText bold size="small" sx={{ color: 'gray.110' }}>
                                            <time dateTime="2022-02-02">Feb 02, 2022</time> to{' '}
                                            <time dateTime="2022-02-02">Feb 02, 2022</time>
                                        </BodyText>
                                    </Skeleton>
                                </Grid>
                            </Grid>
                            <Skeleton
                                variant="rectangular"
                                sx={{ borderRadius: '8px', height: '56px', width: '152px' }}
                            />
                        </>
                    }
                >
                    <Await resolve={engagementInfo}>
                        {([engagement, startDate, endDate]: [Engagement, dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
                            const usePreviewState = Boolean(isPreviewMode && previewStateType);
                            const effectiveSurveyStatus =
                                previewValue<string | null>({
                                    isPreviewMode,
                                    hasValue: usePreviewState,
                                    value: previewStateType ?? null,
                                    fallback: getStatusFromStatusId(engagement.submission_status),
                                }) ?? getStatusFromStatusId(engagement.submission_status);

                            const effectiveStatusId =
                                previewValue<SubmissionStatus>({
                                    isPreviewMode,
                                    hasValue: usePreviewState,
                                    value: getSubmissionStatusFromPreviewState(previewStateType),
                                    fallback: engagement.submission_status,
                                }) ?? engagement.submission_status;

                            const activeStatusBlock = effectiveSurveyStatus
                                ? engagement.status_block.find((block) => block.survey_status === effectiveSurveyStatus)
                                : null;
                            const shouldShowStateMessage =
                                effectiveSurveyStatus === 'Upcoming' || effectiveSurveyStatus === 'Closed';
                            const heroButtonContent =
                                activeStatusBlock && activeStatusBlock.link_type !== 'none'
                                    ? {
                                          href:
                                              activeStatusBlock.link_type === 'external'
                                                  ? activeStatusBlock.external_link || '#'
                                                  : `#${activeStatusBlock.internal_link || 'detailsTabs'}`,
                                          label: activeStatusBlock.button_text || 'Learn More',
                                      }
                                    : null;
                            const previewHeroButtonFallback =
                                isPreviewMode && (previewStateType === 'Open' || previewStateType === 'ViewResults')
                                    ? {
                                          href:
                                              previewStateType === 'ViewResults' ? '#viewResults' : '#provideFeedback',
                                          label: previewStateType === 'ViewResults' ? 'View results' : 'Learn More',
                                      }
                                    : null;

                            return (
                                <>
                                    <EyebrowText mb="24px">
                                        <PreviewSwitch
                                            hasValue={Boolean(engagement.sponsor_name?.trim())}
                                            value={engagement.sponsor_name}
                                            previewFallback={<TextPlaceholder type="short" />}
                                        />
                                    </EyebrowText>
                                    <Heading1 weight="thin" sx={{ color: colors.surface.gray[110], mb: '32px', mt: 0 }}>
                                        <PreviewSwitch
                                            hasValue={Boolean(engagement.name?.trim())}
                                            value={engagement.name}
                                            previewFallback={<TextPlaceholder type="short" />}
                                        />
                                    </Heading1>
                                    <Grid container mb="48px" flexDirection="row" alignItems="center" columnSpacing={1}>
                                        <Grid>
                                            <EngagementStatusChip statusId={effectiveStatusId} />
                                        </Grid>
                                        <Grid>
                                            <BodyText bold size="small" sx={{ color: '#201F1E' }}>
                                                <time dateTime={`${startDate?.format(semanticDateFormat)}`}>
                                                    {startDate?.format(dateFormat)}
                                                </time>{' '}
                                                to{' '}
                                                <time dateTime={`${endDate?.format(semanticDateFormat)}`}>
                                                    {endDate?.format(dateFormat)}
                                                </time>
                                            </BodyText>
                                        </Grid>
                                    </Grid>
                                    {shouldShowStateMessage && (
                                        <Box sx={{ color: 'error.main', mt: '24px', mb: '8px' }}>
                                            <PreviewSwitch
                                                hasValue={Boolean(activeStatusBlock?.block_text)}
                                                value={
                                                    <RichTextArea
                                                        key={effectiveSurveyStatus}
                                                        readOnly
                                                        toolbarHidden
                                                        editorState={getEditorStateFromRaw(
                                                            activeStatusBlock?.block_text || '',
                                                        )}
                                                    />
                                                }
                                                previewFallback={<TextPlaceholder type="paragraph" />}
                                            />
                                        </Box>
                                    )}
                                    {(heroButtonContent || previewHeroButtonFallback) && (
                                        <PreviewRender<{ href: string; label: string }>
                                            hasValue={Boolean(heroButtonContent)}
                                            value={(heroButtonContent ?? previewHeroButtonFallback)!}
                                            previewFallback={previewHeroButtonFallback ?? undefined}
                                        >
                                            {(buttonContent) => (
                                                <Button
                                                    href={buttonContent.href}
                                                    LinkComponent={'a'}
                                                    variant="primary"
                                                    size="large"
                                                    icon={<FontAwesomeIcon fontSize={24} icon={faChevronRight} />}
                                                    iconPosition="right"
                                                    sx={{ borderRadius: '8px' }}
                                                >
                                                    {buttonContent.label}
                                                </Button>
                                            )}
                                        </PreviewRender>
                                    )}
                                </>
                            );
                        }}
                    </Await>
                </Suspense>
            </Box>
        </section>
    );
};
