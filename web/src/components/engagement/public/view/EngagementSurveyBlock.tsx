import React, { Suspense } from 'react';
import { Button } from 'components/common/Input/Button';
import { Box, Grid2 as Grid, Skeleton, ThemeProvider } from '@mui/material';
import { useParams } from 'react-router';
import { SubmissionStatus } from 'constants/engagementStatus';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { getStatusFromStatusId, getSubmissionStatusFromPreviewState } from 'components/common/Indicators';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { WidgetLocation } from 'models/widget';
import { BaseTheme, DarkTheme } from 'styles/Theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { Switch, Case } from 'react-if';
import { useAppSelector, useAppTranslation } from 'hooks';
import EmailModal from 'engagements/public/email/EmailModal';
import { EngagementViewSections } from '.';
import { EngagementPreviewTag } from 'engagements/public/view/EngagementPreviewTag';
import { usePreview } from 'components/engagement/preview/PreviewContext';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { EngagementWidgetDisplay } from './EngagementWidgetDisplay';
import { TextPlaceholder } from 'components/engagement/preview/placeholders/TextPlaceholder';
import { previewValue, PreviewSwitch } from 'engagements/preview/PreviewSwitch';
import { BodyText, Heading2 } from 'components/common/Typography';
import { ROUTES, getPath } from 'routes/routes';
import { AppConfig } from 'config';

const gridContainerStyles = {
    bgcolor: 'blue.90',
    borderRadius: '0px 24px 0px 0px' /* upper right corner */,
    padding: {
        xs: '3em 16px',
        md: '4em 5vw',
        lg: '4.5em 10em',
    },
};

const EngagementSurveyContent = ({}) => {
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const { t: translate } = useAppTranslation();
    const { language, slug } = useParams();
    const { isPreviewMode, previewStateType } = usePreview();
    const { engagement, widgets } = useEngagementLoaderData();
    const loadedEngagement = React.use(engagement);
    const loadedWidgets = React.use(widgets);
    const hasWidget = loadedWidgets.some((widget) => widget.location === WidgetLocation.Feedback);
    const baseSurveyStatus = getStatusFromStatusId(loadedEngagement.submission_status);
    const [currentPanel, setCurrentPanel] = React.useState('email');
    const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
    const languageId = sessionStorage.getItem('languageId') ?? language ?? AppConfig.language.defaultLanguageId;
    const handleOpenEmailModal = () => {
        setCurrentPanel('email');
        setIsEmailModalOpen(true);
        try {
            window.snowplow('trackPageView', 'Verify Email Modal');
        } catch (error) {
            console.log('Verify email modal snowplow error:', error);
        }
    };
    const handleCloseEmailModal = () => {
        setCurrentPanel('email');
        setIsEmailModalOpen(false);
    };

    const effectiveSurveyStatus =
        previewValue<string>({
            isPreviewMode,
            hasValue: Boolean(isPreviewMode && previewStateType),
            value: previewStateType ?? baseSurveyStatus,
            fallback: baseSurveyStatus,
        }) ?? baseSurveyStatus;
    const effectiveStatus =
        previewValue<SubmissionStatus>({
            isPreviewMode,
            hasValue: Boolean(isPreviewMode && previewStateType),
            value: getSubmissionStatusFromPreviewState(previewStateType),
            fallback: loadedEngagement.submission_status,
        }) ?? loadedEngagement.submission_status;
    const isErrorMessage = isPreviewMode && (previewStateType === 'Upcoming' || previewStateType === 'Closed');
    const statusBlockEditorState = getEditorStateFromRaw(
        loadedEngagement.status_block.find((block) => block.survey_status === effectiveSurveyStatus)?.block_text ?? '',
    );
    const hasStatusBlockText = Boolean(statusBlockEditorState?.getCurrentContent()?.hasText?.());
    const feedbackBodyEditorState = getEditorStateFromRaw(loadedEngagement.feedback_body || '');
    const hasFeedbackContent =
        Boolean(loadedEngagement.feedback_heading?.trim()) ||
        Boolean(feedbackBodyEditorState?.getCurrentContent()?.hasText?.());
    const shouldDisplayFeedbackColumn =
        isPreviewMode || (hasStatusBlockText && !isErrorMessage) || effectiveStatus !== SubmissionStatus.Upcoming;

    // Outside preview mode, skip if there's nothing to show.
    if (!isPreviewMode && !hasStatusBlockText && !hasWidget && !hasFeedbackContent) return null;

    return (
        <Grid container size={12} spacing={4} justifyContent="space-between" sx={gridContainerStyles}>
            <Grid
                container
                size={{ xs: 12, md: 6 }}
                direction="column"
                minHeight="60px"
                display={shouldDisplayFeedbackColumn ? 'flex' : 'none'}
            >
                <Box>
                    <PreviewSwitch
                        hasValue={Boolean(loadedEngagement.feedback_heading?.trim())}
                        value={
                            <Heading2 decorated weight="thin" mt={0} mb={'16px'}>
                                {loadedEngagement.feedback_heading}
                            </Heading2>
                        }
                        previewFallback={
                            <Heading2 decorated weight="thin" mt={0} mb={'16px'}>
                                <TextPlaceholder text="Provide Feedback Section" />
                            </Heading2>
                        }
                    />
                    <BodyText component="div">
                        <PreviewSwitch
                            hasValue={Boolean(feedbackBodyEditorState?.getCurrentContent()?.hasText?.())}
                            value={<RichTextArea readOnly toolbarHidden editorState={feedbackBodyEditorState} />}
                            previewFallback={<TextPlaceholder type="paragraph" />}
                        />
                    </BodyText>
                    {/* block_text only shown when it's not in the hero (not Upcoming/Closed in preview) */}
                    {!isPreviewMode && !isErrorMessage && hasStatusBlockText && (
                        <RichTextArea readOnly toolbarHidden editorState={statusBlockEditorState} />
                    )}
                    <ThemeProvider theme={BaseTheme}>
                        <EmailModal
                            engagement={loadedEngagement}
                            defaultPanel={currentPanel}
                            open={isEmailModalOpen}
                            handleClose={() => handleCloseEmailModal()}
                        />
                    </ThemeProvider>
                    <PreviewSwitch
                        hasValue={loadedEngagement.surveys.length > 0}
                        value={
                            <Switch>
                                <Case condition={effectiveStatus === SubmissionStatus.Open}>
                                    <Button
                                        sx={{ mt: '40px' }}
                                        variant="primary"
                                        size="large"
                                        icon={<FontAwesomeIcon fontSize={24} icon={faChevronRight} />}
                                        iconPosition="right"
                                        onClick={handleOpenEmailModal}
                                    >
                                        Provide Feedback Now
                                    </Button>
                                </Case>
                                <Case condition={effectiveStatus === SubmissionStatus.Closed}>
                                    <Button
                                        sx={{ mt: '40px' }}
                                        variant="primary"
                                        size="large"
                                        icon={<FontAwesomeIcon fontSize={24} icon={faChevronRight} />}
                                        iconPosition="right"
                                        href={
                                            isLoggedIn
                                                ? getPath(ROUTES.ENGAGEMENT_DASHBOARD, {
                                                      engagementId: loadedEngagement.id,
                                                      dashboardType: 'public',
                                                  })
                                                : getPath(ROUTES.PUBLIC_DASHBOARD_BY_SLUG, {
                                                      slug: slug ?? '',
                                                      dashboardType: 'public',
                                                      language: languageId,
                                                  })
                                        }
                                    >
                                        {translate('buttonText.viewFeedback')}
                                    </Button>
                                </Case>
                            </Switch>
                        }
                        previewFallback={
                            <Box
                                sx={{
                                    mt: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                }}
                            >
                                {loadedEngagement.surveys.map((survey, index) => (
                                    <Button
                                        key={`${survey.name}-${index}`}
                                        variant="primary"
                                        icon={<FontAwesomeIcon fontSize={16} icon={faChevronRight} />}
                                        iconPosition="right"
                                        sx={{ width: 'fit-content' }}
                                        onClick={() => {
                                            return;
                                        }}
                                    >
                                        <TextPlaceholder text={survey.name} />
                                    </Button>
                                ))}
                            </Box>
                        }
                    />
                </Box>
            </Grid>
            <Grid
                container
                size={{ xs: 12, md: 6 }}
                sx={{
                    display: hasWidget || isPreviewMode ? 'flex' : 'none',
                }}
            >
                <EngagementWidgetDisplay location={WidgetLocation.Feedback} />
            </Grid>
        </Grid>
    );
};

export const EngagementSurveyBlock = () => {
    return (
        <section
            id={EngagementViewSections.PROVIDE_FEEDBACK}
            aria-label="Survey Section"
            style={{ position: 'relative' }}
        >
            <EngagementPreviewTag required>Provide Feedback Section</EngagementPreviewTag>
            <ThemeProvider theme={DarkTheme}>
                <Suspense
                    fallback={
                        <Grid container size={12} spacing={4} justifyContent="space-between" sx={gridContainerStyles}>
                            <Grid container direction="column" size={{ xs: 12, md: 6 }} minHeight="60px" rowGap={1.5}>
                                <Skeleton variant="text" sx={{ width: '60%', fontSize: '2rem' }} />
                                <Skeleton variant="text" sx={{ width: '95%', fontSize: '1rem' }} />
                                <Skeleton variant="text" sx={{ width: '90%', fontSize: '1rem' }} />
                                <Skeleton variant="rounded" sx={{ mt: 2, width: '240px', height: '48px' }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} minHeight="60px">
                                <Skeleton variant="rounded" sx={{ width: '100%', height: '360px' }} />
                            </Grid>
                        </Grid>
                    }
                >
                    <EngagementSurveyContent />
                </Suspense>
            </ThemeProvider>
        </section>
    );
};
