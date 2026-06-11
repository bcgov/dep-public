import React, { Suspense, useState } from 'react';
import { EngagementViewSections } from 'engagements/public/view';
import { useEngagementLoaderData } from 'engagements/preview/PreviewLoaderDataContext';
import PreviewSwitch, { PreviewRender } from 'engagements/preview/PreviewSwitch';
import { Heading2, BodyText } from 'components/common/Typography';
import { EngagementPreviewTag } from './EngagementPreviewTag';
import { Await } from 'react-router';
import TextPlaceholder from 'engagements/preview/placeholders/TextPlaceholder';
import Grid from '@mui/material/Grid2';
import { usePreview } from 'engagements/preview/PreviewContext';
import { Box, Checkbox, FormControlLabel, Paper } from '@mui/material';
import { Button, CustomTextField } from 'components/common/Input';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { useAppDispatch, useAppSelector } from 'hooks';
import { createSubscribeEmailVerification } from 'services/emailVerificationService';
import { createSubscription } from 'services/subscriptionService';
import { EmailVerificationType } from 'models/emailVerification';
import { SubscriptionType } from 'constants/subscriptionType';
import { LanguageState } from 'reduxSlices/languageSlice';
import { openNotification } from 'services/notificationService/notificationSlice';
import { resolveTranslationValue } from './engagementTranslationResolution';

const previewSubscribeSummary = (
    <Grid container gap={0} direction="column">
        <BodyText mb="24px" lineHeight="28px">
            <TextPlaceholder text="Stay informed by subscribing to email updates on public engagements." />
        </BodyText>
        <BodyText lineHeight="28px">
            <TextPlaceholder text="Nam at lectus urna duis convallis convallis tellus id interdum. Enim ut tellus elementum sagittis vitae et. Feugiat scelerisque." />
        </BodyText>
    </Grid>
);

const defaultConsentMessage =
    'Personal information collected by the Ministry of Citizens’ Services is under the authority of section 26(c) and 26(e) of the Freedom of Information and Protection of Privacy Act for the purpose of informing this engagement.';

export const EngagementSubscribeBlock = () => {
    const { engagement, translationBundle } = useEngagementLoaderData();
    const { isPreviewMode } = usePreview();
    const dispatch = useAppDispatch();
    const language: LanguageState = useAppSelector((state) => state.language);
    const [email, setEmail] = useState('');
    const [hasConsent, setHasConsent] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubscribe = async (resolvedEngagement: { id: number; surveys: { id: number }[] }) => {
        if (!hasConsent) {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Please agree to the terms and conditions before subscribing.',
                }),
            );
            return;
        }

        if (!email.trim()) {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Please enter a valid email address.',
                }),
            );
            return;
        }

        if (!resolvedEngagement.surveys?.length) {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Subscription is not available for this engagement right now.',
                }),
            );
            return;
        }

        try {
            setIsSaving(true);

            const emailVerification = await createSubscribeEmailVerification(
                {
                    email_address: email.trim(),
                    survey_id: resolvedEngagement.surveys[0].id,
                    type: EmailVerificationType.Subscribe,
                    language: language.id,
                },
                SubscriptionType.ENGAGEMENT,
            );

            await createSubscription({
                engagement_id: resolvedEngagement.id,
                email_address: emailVerification.email_address,
                is_subscribed: false,
                participant_id: emailVerification.participant_id,
                type: SubscriptionType.ENGAGEMENT,
            });

            try {
                globalThis.snowplow('trackSelfDescribingEvent', {
                    schema: 'iglu:ca.bc.gov.dep/verify-email/jsonschema/1-0-0',
                    data: {
                        survey_id: resolvedEngagement.surveys[0].id,
                        engagement_id: resolvedEngagement.id,
                    },
                });
            } catch (error) {
                console.log('Create subscription snowplow error:', error);
            }

            dispatch(
                openNotification({
                    severity: 'success',
                    text: `We sent a confirmation email to ${email.trim()}. Please use the link in that email to complete your subscription.`,
                }),
            );
            setEmail('');
            setHasConsent(false);
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: `There was a problem with the email address provided: ${email.trim()}. Please verify it and try again.`,
                }),
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Suspense>
            <Await resolve={Promise.all([engagement, translationBundle])}>
                {([resolvedEngagement, resolvedTranslationBundle]) => {
                    const resolvedSubscribeHeading = resolveTranslationValue<string>({
                        translatedValue: resolvedTranslationBundle.currentTranslation?.subscribe_section_heading,
                        defaultValue: resolvedTranslationBundle.defaultTranslation?.subscribe_section_heading,
                        baseValue: resolvedEngagement.subscribe_section_heading,
                    }).value;

                    const resolvedSubscribeDescription = resolveTranslationValue<string>({
                        translatedValue: resolvedTranslationBundle.currentTranslation?.subscribe_section_description,
                        defaultValue: resolvedTranslationBundle.defaultTranslation?.subscribe_section_description,
                        baseValue: resolvedEngagement.subscribe_section_description,
                    }).value;

                    const resolvedConsentMessage = resolveTranslationValue<string>({
                        translatedValue: resolvedTranslationBundle.currentTranslation?.subscribe_consent_message,
                        defaultValue: resolvedTranslationBundle.defaultTranslation?.subscribe_consent_message,
                        baseValue: resolvedEngagement.subscribe_consent_message || resolvedEngagement.consent_message,
                        literalFallback: defaultConsentMessage,
                    }).value;

                    const subscribeDescriptionEditorState = getEditorStateFromRaw(resolvedSubscribeDescription || '');
                    const hasSubscribeDescription =
                        subscribeDescriptionEditorState?.getCurrentContent()?.hasText?.() ?? false;
                    const consentMessageEditorState = getEditorStateFromRaw(resolvedConsentMessage || '');
                    const hasConsentMessage = consentMessageEditorState?.getCurrentContent()?.hasText?.() ?? false;
                    const hasSubscribeHeading = Boolean(resolvedSubscribeHeading?.trim());
                    const isSubscribeSectionComplete =
                        hasSubscribeHeading && hasSubscribeDescription && hasConsentMessage;

                    if (!isPreviewMode && !resolvedEngagement.subscribe_section_shown && !isSubscribeSectionComplete) {
                        return null;
                    }
                    return (
                        <section
                            id={EngagementViewSections.SUBSCRIBE}
                            aria-label="Subscribe Section"
                            style={{ position: 'relative' }}
                        >
                            <EngagementPreviewTag>Subscribe Section (Optional)</EngagementPreviewTag>
                            <Grid
                                container
                                direction="row"
                                justifyContent="space-between"
                                size={12}
                                columns={12}
                                width="100%"
                                bgcolor="blue.10"
                                gap={{ xs: '12px', md: '24px', lg: '48px' }}
                                padding={{
                                    xs: '3em 16px',
                                    md: '4em 5vw',
                                    lg: '4.5em 10em',
                                }}
                            >
                                <Grid size={{ xs: 12, lg: 3.5 }}>
                                    <Heading2 weight="thin" decorated sx={{ mb: '24px' }}>
                                        <PreviewSwitch
                                            hasValue={!!resolvedSubscribeHeading}
                                            value={resolvedSubscribeHeading}
                                            previewFallback={<TextPlaceholder text="Subscribe Section" />}
                                            fallback="Subscribe Section"
                                        />
                                    </Heading2>

                                    <PreviewRender
                                        hasValue={hasSubscribeDescription}
                                        value={
                                            <RichTextArea
                                                toolbarHidden
                                                readOnly
                                                editorState={subscribeDescriptionEditorState}
                                            />
                                        }
                                        previewFallback={previewSubscribeSummary}
                                        fallback={null}
                                    >
                                        {(content) => content}
                                    </PreviewRender>
                                </Grid>

                                <Grid size={{ xs: 12, lg: 7.5 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: '24px 16px', md: '32px 24px' },
                                            borderRadius: '16px',
                                            backgroundColor: 'gray.10',
                                        }}
                                    >
                                        <BodyText bold color="text.secondary" mb="12px">
                                            Your Privacy
                                        </BodyText>

                                        <PreviewRender
                                            hasValue={hasConsentMessage}
                                            value={
                                                <RichTextArea
                                                    toolbarHidden
                                                    readOnly
                                                    editorState={consentMessageEditorState}
                                                />
                                            }
                                            previewFallback={
                                                <BodyText>
                                                    <TextPlaceholder text={defaultConsentMessage} />
                                                </BodyText>
                                            }
                                            fallback={<BodyText>{defaultConsentMessage}</BodyText>}
                                        >
                                            {(content) => <Box sx={{ mb: '24px' }}>{content}</Box>}
                                        </PreviewRender>

                                        <Box sx={{ mb: '20px' }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={hasConsent}
                                                        onChange={(_event, checked) => setHasConsent(checked)}
                                                        disabled={isPreviewMode || isSaving}
                                                    />
                                                }
                                                label={
                                                    <BodyText bold size="small" color="text.secondary">
                                                        I agree to the terms and conditions above.
                                                    </BodyText>
                                                }
                                            />
                                        </Box>

                                        <BodyText sx={{ mb: '8px' }}>Email</BodyText>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                gap: '12px',
                                                alignItems: { xs: 'stretch', sm: 'center' },
                                            }}
                                        >
                                            <CustomTextField
                                                label=" "
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                slotProps={{ inputLabel: { shrink: false } }}
                                                fullWidth
                                                disabled={isPreviewMode || isSaving}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '8px',
                                                    },
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="small"
                                                sx={{ minWidth: '96px', height: '44px' }}
                                                disabled={isPreviewMode || isSaving}
                                                onClick={() => handleSubscribe(resolvedEngagement)}
                                            >
                                                {isSaving ? 'Sending...' : 'Subscribe'}
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </section>
                    );
                }}
            </Await>
        </Suspense>
    );
};

export default EngagementSubscribeBlock;
