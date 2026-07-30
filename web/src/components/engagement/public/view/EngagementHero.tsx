import { EyebrowText, Heading1 } from 'components/common/Typography';
import React, { Suspense } from 'react';
import { Button } from 'components/common/Input/Button';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { Engagement } from 'models/engagement';
import { Box, Skeleton } from '@mui/material';
import { colors } from 'components/common';
import { getStatusFromStatusId, getSubmissionStatusFromPreviewState } from 'components/common/Indicators';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { Await } from 'react-router';
import { EngagementViewSections } from '.';
import { usePreview } from 'components/engagement/preview/PreviewContext';
import { SubmissionStatus } from 'constants/engagementStatus';
import { BlueprintImagePlaceholder } from 'components/engagement/preview/placeholders/BlueprintImagePlaceholder';
import { TextPlaceholder } from 'components/engagement/preview/placeholders/TextPlaceholder';
import { previewValue, PreviewRender, PreviewSwitch } from 'components/engagement/preview/PreviewSwitch';
import { EngagementPreviewTag } from './EngagementPreviewTag';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { TranslationBundle, resolveTranslationValue } from './engagementTranslationResolution';
import { EngagementStatusDateRow, EngagementStatusDateRowSkeleton } from './EngagementStatusDateRow';

const getStatusMessageFromTranslation = (
    translation: TranslationBundle['currentTranslation'] | TranslationBundle['defaultTranslation'] | undefined,
    status: string | null,
) => {
    if (status === 'Upcoming') {
        return translation?.upcoming_status_block_text;
    }
    if (status === 'Closed') {
        return translation?.closed_status_block_text;
    }
    return undefined;
};

const getStatusButtonTextFromTranslation = (
    translation: TranslationBundle['currentTranslation'] | TranslationBundle['defaultTranslation'] | undefined,
    status: string | null,
) => {
    if (status === 'Open') {
        return translation?.open_status_block_button_text;
    }
    if (status === 'ViewResults') {
        return translation?.view_results_status_block_button_text;
    }
    return undefined;
};

const getResolvedHeroText = ({
    engagement,
    translationBundle,
    status,
    activeStatusBlockText,
    activeStatusButtonText,
}: {
    engagement: Engagement;
    translationBundle?: TranslationBundle;
    status: string | null;
    activeStatusBlockText?: string;
    activeStatusButtonText?: string;
}) => {
    const resolvedSponsorName = resolveTranslationValue<string>({
        translatedValue: translationBundle?.currentTranslation?.sponsor_name,
        defaultValue: translationBundle?.defaultTranslation?.sponsor_name,
        baseValue: engagement.sponsor_name,
    }).value;

    const resolvedEngagementName = resolveTranslationValue<string>({
        translatedValue: translationBundle?.currentTranslation?.name,
        defaultValue: translationBundle?.defaultTranslation?.name,
        baseValue: engagement.name,
    }).value;

    const currentStatusMessage = getStatusMessageFromTranslation(translationBundle?.currentTranslation, status);
    const defaultStatusMessage = getStatusMessageFromTranslation(translationBundle?.defaultTranslation, status);

    const resolvedStateMessage = resolveTranslationValue<string>({
        translatedValue: currentStatusMessage,
        defaultValue: defaultStatusMessage,
        baseValue: activeStatusBlockText,
    }).value;

    const currentStatusButtonText = getStatusButtonTextFromTranslation(translationBundle?.currentTranslation, status);
    const defaultStatusButtonText = getStatusButtonTextFromTranslation(translationBundle?.defaultTranslation, status);

    const resolvedButtonLabel = resolveTranslationValue<string>({
        translatedValue: currentStatusButtonText,
        defaultValue: defaultStatusButtonText,
        baseValue: activeStatusButtonText,
    }).value;

    return {
        resolvedSponsorName,
        resolvedEngagementName,
        resolvedStateMessage,
        resolvedButtonLabel,
    };
};

export const EngagementHero = () => {
    const { engagement, translationBundle } = useEngagementLoaderData();
    const { isPreviewMode, previewStateType } = usePreview();
    const engagementInfo = Promise.all([engagement, translationBundle ?? Promise.resolve(undefined)]);

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
                    '@supports (backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))': {
                        backgroundColor: `color-mix(in srgb, ${colors.surface.white} 90%, transparent)`,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                    },
                }}
            >
                <Suspense
                    fallback={
                        <>
                            <Skeleton variant="text">
                                <EyebrowText m="0">Sponsor Name Goes Here</EyebrowText>
                            </Skeleton>
                            <Skeleton variant="text">
                                <Heading1 weight="thin" sx={{ mb: '32px' }}>
                                    Example Engagement Name
                                </Heading1>
                            </Skeleton>
                            <EngagementStatusDateRowSkeleton marginBottom={'3rem'} />
                            <Skeleton
                                variant="rectangular"
                                sx={{ borderRadius: '8px', height: '56px', width: '152px' }}
                            />
                        </>
                    }
                >
                    <Await resolve={engagementInfo}>
                        {([engagement, resolvedTranslationBundle]: [Engagement, TranslationBundle | undefined]) => {
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
                            const {
                                resolvedSponsorName,
                                resolvedEngagementName,
                                resolvedStateMessage,
                                resolvedButtonLabel,
                            } = getResolvedHeroText({
                                engagement,
                                translationBundle: resolvedTranslationBundle,
                                status: effectiveSurveyStatus,
                                activeStatusBlockText: activeStatusBlock?.block_text,
                                activeStatusButtonText: activeStatusBlock?.button_text,
                            });

                            const heroButtonContent =
                                activeStatusBlock && activeStatusBlock.link_type !== 'none'
                                    ? {
                                          href:
                                              activeStatusBlock.link_type === 'external'
                                                  ? activeStatusBlock.external_link || '#'
                                                  : `#${activeStatusBlock.internal_link || 'detailsTabs'}`,
                                          label: resolvedButtonLabel || 'Learn More',
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
                                            hasValue={Boolean(resolvedSponsorName?.trim())}
                                            value={resolvedSponsorName}
                                            previewFallback={<TextPlaceholder type="short" />}
                                        />
                                    </EyebrowText>
                                    <Heading1 weight="thin" sx={{ color: colors.surface.gray[110], mb: '32px', mt: 0 }}>
                                        <PreviewSwitch
                                            hasValue={Boolean(resolvedEngagementName?.trim())}
                                            value={resolvedEngagementName}
                                            previewFallback={<TextPlaceholder type="short" />}
                                        />
                                    </Heading1>
                                    <EngagementStatusDateRow
                                        statusId={effectiveStatusId}
                                        startDate={engagement.start_date}
                                        endDate={engagement.end_date}
                                        marginBottom={'3rem'}
                                    />
                                    {shouldShowStateMessage && (
                                        <Box sx={{ color: 'error.main', mt: '24px', mb: '-4px' }}>
                                            <PreviewSwitch
                                                hasValue={Boolean(resolvedStateMessage?.trim())}
                                                value={
                                                    <RichTextArea
                                                        key={effectiveSurveyStatus}
                                                        readOnly
                                                        toolbarHidden
                                                        editorState={getEditorStateFromRaw(resolvedStateMessage || '')}
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
