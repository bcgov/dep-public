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
import { DarkTheme, Layout } from 'styles/Theme';
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
import { TranslationBundle, resolveTranslationValue } from './engagementTranslationResolution';

export const EngagementDescription = () => {
    const { engagement, translationBundle } = useEngagementLoaderData();
    const { isPreviewMode } = usePreview();
    const descriptionInfo = Promise.all([engagement, translationBundle]);
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
                    gap={0}
                    justifyContent="space-between"
                    size={12}
                    color="text.primary"
                    rowSpacing={3}
                    columnSpacing={11}
                    borderRadius="0 1.5rem 0 0"
                    margin="-2rem 0 0" // For right border radius overlap effect
                    p={`2rem ${Layout.padding.default}`}
                    pb={{ xs: '4.5rem', md: '6.5rem' }}
                    direction={{ xs: 'column', md: 'row' }}
                    sx={{ background: colors.surface.blue[90] }}
                >
                    <Grid
                        container
                        rowGap={0}
                        alignItems="center"
                        maxWidth="100%"
                        width={Layout.width.default}
                        margin="0 auto"
                    >
                        <Grid
                            container
                            gap={0}
                            component={RouterLinkRenderer}
                            href={getPath(ROUTES.PUBLIC_LANDING)}
                            sx={{
                                textDecoration: 'none !important',
                                '&:hover': { textDecoration: 'underline !important' },
                            }}
                            mb="3rem"
                        >
                            <FontAwesomeIcon
                                icon={faArrowLeftLong}
                                color={'inherit'}
                                fontSize={'24px'}
                                style={{ paddingRight: '8px' }}
                            />
                            <BodyText thin size="small">
                                All engagements
                            </BodyText>
                        </Grid>
                        <Grid container direction="row" columnGap="5.5rem" rowGap={0} size={12}>
                            <Suspense fallback={<Skeleton variant="rectangular" height="20rem" width="45%" />}>
                                <Await resolve={descriptionInfo}>
                                    {([engagement, resolvedTranslationBundle]: [Engagement, TranslationBundle]) => {
                                        const resolvedSummaryTitle = resolveTranslationValue<string>({
                                            translatedValue:
                                                resolvedTranslationBundle.currentTranslation?.description_title,
                                            defaultValue:
                                                resolvedTranslationBundle.defaultTranslation?.description_title,
                                            baseValue: engagement.description_title,
                                        }).value;

                                        const resolvedSummaryBody = resolveTranslationValue<string>({
                                            translatedValue:
                                                resolvedTranslationBundle.currentTranslation?.rich_description,
                                            defaultValue:
                                                resolvedTranslationBundle.defaultTranslation?.rich_description,
                                            baseValue: engagement.rich_description,
                                        }).value;

                                        const summaryEditorState = getEditorStateFromRaw(resolvedSummaryBody || '');
                                        const hasSummaryBody =
                                            summaryEditorState?.getCurrentContent()?.hasText?.() ?? false;

                                        return (
                                            <>
                                                <Grid size={12}>
                                                    <Heading2 decorated id="description-header" sx={{ mb: 1 }}>
                                                        <PreviewSwitch
                                                            isPreviewMode={isPreviewMode}
                                                            hasValue={Boolean(resolvedSummaryTitle?.trim())}
                                                            value={resolvedSummaryTitle}
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
                    </Grid>
                </Grid>
            </ThemeProvider>
        </section>
    );
};
