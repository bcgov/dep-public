import React, { Suspense } from 'react';
import { BodyText, Heading2 } from 'components/common/Typography';
import { Engagement } from 'models/engagement';
import { Grid2 as Grid, Skeleton, ThemeProvider } from '@mui/material';
import { colors } from 'components/common';
import { Await } from 'react-router';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeftLong } from '@fortawesome/pro-light-svg-icons';
import { WidgetLocation } from 'models/widget';
import { DarkTheme } from 'styles/Theme';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { EngagementViewSections } from '.';
import { usePreview } from 'components/engagement/preview/PreviewContext';
import { TextPlaceholder } from 'components/engagement/preview/placeholders/TextPlaceholder';
import { PreviewSwitch } from 'engagements/preview/PreviewSwitch';
import { EngagementPreviewTag } from './EngagementPreviewTag';
import { EngagementWidgetDisplay } from './EngagementWidgetDisplay';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { getPath, ROUTES } from 'routes/routes';

export const EngagementDescription = () => {
    const { engagement } = useEngagementLoaderData();
    const { isPreviewMode } = usePreview();
    return (
        <section
            id={EngagementViewSections.DESCRIPTION}
            aria-labelledby="description-header"
            style={{ position: 'relative' }}
        >
            <EngagementPreviewTag required>Summary Section</EngagementPreviewTag>
            <ThemeProvider theme={DarkTheme}>
                <Grid
                    container
                    size={12}
                    justifyContent="space-between"
                    rowSpacing={3}
                    columnSpacing={11}
                    margin={0}
                    sx={{
                        background: colors.surface.blue[90],
                        color: colors.surface.white,
                        borderRadius: '0px 1.5rem 0px 0px' /* upper right corner */,
                        padding: { xs: '2rem 2rem 4rem 2rem', md: '2rem 5vw 4rem 5vw', lg: '2rem 10rem 4rem 10rem' },
                        marginTop: '-56px',
                        zIndex: 10,
                        position: 'relative',
                        flexDirection: { xs: 'column', md: 'row' },
                    }}
                >
                    <Grid size={12}>
                        <Grid
                            container
                            component={RouterLinkRenderer}
                            href={getPath(ROUTES.PUBLIC_LANDING)}
                            alignItems="center"
                            display="flex"
                        >
                            <FontAwesomeIcon
                                icon={faArrowLeftLong}
                                color={colors.surface.white}
                                fontSize={'24px'}
                                style={{ paddingRight: '8px' }}
                            />
                            <BodyText thin size="small">
                                All engagements
                            </BodyText>
                        </Grid>
                    </Grid>
                    <Suspense fallback={<Skeleton variant="rectangular" height="288px" width="100%" />}>
                        <Await resolve={engagement}>
                            {(engagement: Engagement) => {
                                const summaryEditorState = getEditorStateFromRaw(engagement.rich_description);
                                const hasSummaryBody = summaryEditorState?.getCurrentContent()?.hasText?.() ?? false;

                                return (
                                    <>
                                        <Grid size={12}>
                                            <Heading2 decorated id="description-header" sx={{ mb: 1 }}>
                                                <PreviewSwitch
                                                    isPreviewMode={isPreviewMode}
                                                    hasValue={Boolean(engagement.description_title?.trim())}
                                                    value={engagement.description_title}
                                                    fallback={'Summary'}
                                                    previewFallback={<TextPlaceholder text="Summary Section" />}
                                                />
                                            </Heading2>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }} direction="column" minHeight="60px">
                                            <PreviewSwitch
                                                isPreviewMode={isPreviewMode}
                                                hasValue={hasSummaryBody}
                                                value={
                                                    <RichTextArea
                                                        toolbarHidden
                                                        readOnly
                                                        editorState={summaryEditorState}
                                                    />
                                                }
                                                previewFallback={<TextPlaceholder type="long" />}
                                            />
                                        </Grid>
                                    </>
                                );
                            }}
                        </Await>
                    </Suspense>
                    <Grid container size={{ xs: 12, md: 6 }} justifyContent="flex-end" alignItems="flex-start">
                        <EngagementWidgetDisplay location={WidgetLocation.Summary} />
                    </Grid>
                </Grid>
            </ThemeProvider>
        </section>
    );
};
