import { Grid2 as Grid } from '@mui/material';
import { TextField } from 'components/common/Input';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { BodyText, ErrorMessage, Heading3 } from 'components/common/Typography';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { ContentState, EditorState } from 'draft-js';
import React, { useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { defaultValuesObject, EngagementUpdateData } from './AuthoringContext';
import { AuthoringFormContainer, AuthoringFormSection } from './AuthoringFormLayout';
import { AuthoringTemplateOutletContext } from './types';
import { getEngagementTranslationByCode } from 'services/engagementService';
import { useAuthoringPageHydration } from './useAuthoringPageHydration';
import { AppConfig } from 'config';
import { tryParse } from 'helper';

type SubscribeAuthoringData = EngagementUpdateData & {
    subscribe_section_heading: string;
    subscribe_section_description: EditorState;
    subscribe_consent_message: EditorState;
};

const AuthoringSubscribe = () => {
    const { setDefaultValues, fetcher, pageName, engagement: eng }: AuthoringTemplateOutletContext = useOutletContext();
    const { languageCode } = useParams();
    const activeLanguageCode = (languageCode ?? AppConfig.language.defaultLanguageId).toLowerCase();
    const {
        getValues,
        reset,
        control,
        formState: { errors },
    } = useFormContext<SubscribeAuthoringData>();

    const loadSubscribeValues = useCallback(async () => {
        const translation = await getEngagementTranslationByCode(Number(eng.id), activeLanguageCode);
        const subscribeHeading = translation?.subscribe_section_heading ?? eng.subscribe_section_heading;
        const subscribeDescription = translation?.subscribe_section_description ?? eng.subscribe_section_description;
        const subscribeConsent =
            translation?.subscribe_consent_message ??
            translation?.consent_message ??
            eng.subscribe_consent_message ??
            eng.consent_message;

        return {
            ...defaultValuesObject,
            form_source: pageName,
            id: Number(eng.id),
            subscribe_section_heading: subscribeHeading || '',
            subscribe_section_description: getEditorState(subscribeDescription),
            subscribe_consent_message: getEditorState(subscribeConsent),
        };
    }, [activeLanguageCode, eng, pageName]);

    const { isHydrating } = useAuthoringPageHydration<SubscribeAuthoringData>({
        deps: [eng, activeLanguageCode, pageName],
        fetcherData: fetcher.data,
        getValues,
        loadValues: loadSubscribeValues,
        reset,
        setDefaultValues,
    });

    const getEditorState = (value?: string) => {
        if (!value) {
            return EditorState.createEmpty();
        }

        if (tryParse(value)) {
            return getEditorStateFromRaw(value);
        }

        return EditorState.createWithContent(ContentState.createFromText(value));
    };

    const toolbar = {
        options: ['inline', 'list', 'link', 'blockType', 'history'],
        inline: {
            options: ['bold', 'italic', 'underline', 'superscript', 'subscript'],
        },
        blockType: { options: ['Normal', 'H2', 'H3', 'Blockquote'] },
        list: { options: ['unordered', 'ordered'] },
    };

    return (
        <AuthoringFormContainer isHydrating={isHydrating}>
            <Grid container direction="column" mt="1rem">
                <Heading3 bold>Primary Content (Required)</Heading3>
                <BodyText size="small">
                    The content in this section will be shown to users in the subscription section. It should include a
                    heading and some body copy that encourages users to subscribe to updates about the engagement. Also
                    include any necessary information about the update process or what users can expect after
                    subscribing.
                </BodyText>
            </Grid>

            <AuthoringFormSection
                name="Section Heading"
                required={true}
                labelFor={'subscribe_section_heading'}
                details="Your section heading should be descriptive, short and succinct."
            >
                <Controller
                    control={control}
                    name="subscribe_section_heading"
                    rules={{ required: true, maxLength: 60 }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            id="subscribe_section_heading"
                            aria-label="Section heading. Your section heading should be descriptive, short and succinct."
                            counter
                            maxLength={60}
                            placeholder="Section heading text"
                            error={errors.subscribe_section_heading?.message ?? ''}
                            onChange={(value) => {
                                field.onChange(value);
                            }}
                        />
                    )}
                />
            </AuthoringFormSection>

            <AuthoringFormSection
                name="Body Copy"
                required={true}
                labelFor={'subscribe_section_description'}
                details="Tell your users some more about why they want to subscribe, or about the update process"
            >
                <ErrorMessage error={errors.subscribe_section_description?.message?.toString() || ''} />
                <Controller
                    control={control}
                    name="subscribe_section_description"
                    rules={{ required: true }}
                    render={({ field }) => (
                        <RichTextArea
                            ariaLabel="Body Copy: Tell your users some more about why they want to subscribe, or about the update process"
                            spellCheck
                            editorStyle={{ cursor: 'text' }}
                            editorState={field.value}
                            onEditorStateChange={(value) => {
                                field.onChange(value);
                            }}
                            handlePastedText={() => false}
                            toolbar={toolbar}
                        />
                    )}
                />
            </AuthoringFormSection>

            <AuthoringFormSection
                name="Privacy Notice"
                required={true}
                labelFor={'subscribe_consent_message'}
                details={
                    'A Privacy Notice must be displayed and agreed to by potential ' +
                    'subscribers before they subscribe. Updates to the following notice ' +
                    'should only be made if you have been provided with legally approved revisions.'
                }
            >
                <ErrorMessage error={errors.subscribe_consent_message?.message?.toString() || ''} />
                <Controller
                    control={control}
                    name="subscribe_consent_message"
                    rules={{ required: true }}
                    render={({ field }) => (
                        <RichTextArea
                            ariaLabel="Privacy Notice: A Privacy Notice must be displayed and agreed to by potential subscribers before they subscribe."
                            spellCheck
                            editorStyle={{ cursor: 'text' }}
                            editorState={field.value}
                            onEditorStateChange={(value) => {
                                field.onChange(value);
                            }}
                            handlePastedText={() => false}
                            toolbar={toolbar}
                        />
                    )}
                />
            </AuthoringFormSection>
        </AuthoringFormContainer>
    );
};

export default AuthoringSubscribe;
