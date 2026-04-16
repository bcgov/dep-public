import { Grid2 as Grid } from '@mui/material';
import React, { useEffect } from 'react';
import { useOutletContext, useRouteLoaderData } from 'react-router';
import { TextField } from 'components/common/Input';
import { AuthoringTemplateOutletContext } from './types';
import { Heading3, ErrorMessage, BodyText } from 'components/common/Typography';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { convertToRaw, EditorState } from 'draft-js';
import { Controller, useFormContext } from 'react-hook-form';
import { defaultValuesObject, EngagementUpdateData } from './AuthoringContext';
import { EngagementLoaderAdminData } from 'components/engagement/admin/EngagementLoaderAdmin';
import WidgetPicker from '../widgets';
import { WidgetLocation } from 'models/widget';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import { AuthoringFormContainer, AuthoringFormSection } from './AuthoringFormLayout';
import { tryParse } from './utils';

const AuthoringSummary = () => {
    const { setDefaultValues, fetcher, pageName }: AuthoringTemplateOutletContext = useOutletContext(); // Access the form functions and values from the authoring template.
    const {
        setValue,
        getValues,
        reset,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useFormContext<EngagementUpdateData>();

    const { engagement } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const hasUnsavedWork = isDirty && !isSubmitting;

    // Set current values to default state after saving form
    useEffect(() => {
        if (typeof fetcher.data !== 'string' || fetcher.data !== 'success') {
            return;
        }
        const newDefaults = getValues();
        setDefaultValues(newDefaults);
        reset(newDefaults);
    }, [fetcher.data]);

    // Reset values to default and retrieve relevant content from loader.
    useEffect(() => {
        engagement.then((eng) => {
            reset(defaultValuesObject);
            setValue('form_source', pageName);
            setValue('id', Number(eng.id));
            // Make sure it is valid JSON.
            if (tryParse(eng.rich_description)) {
                setValue('rich_description', eng.rich_description);
            }
            setValue('description_title', eng.description_title || '');
            setValue('description', eng.description);
            setValue('summary_editor_state', getEditorStateFromRaw(eng.rich_description || ''));
            // Update default values so that our loaded values are default.
            setDefaultValues(getValues());
            reset(getValues());
        });
    }, []);

    const toolbar = {
        options: ['inline', 'list', 'link', 'blockType', 'history'],
        inline: {
            options: ['bold', 'italic', 'underline', 'superscript', 'subscript'],
        },
        blockType: { options: ['Normal', 'H2', 'H3', 'Blockquote'] },
        list: { options: ['unordered', 'ordered'] },
    };

    const handleEditorChange = (newEditorState: EditorState) => {
        const plainText = newEditorState.getCurrentContent().getPlainText();
        const stringifiedEditorState = JSON.stringify(convertToRaw(newEditorState.getCurrentContent()));
        setValue('description', plainText);
        setValue('rich_description', stringifiedEditorState);
        return newEditorState;
    };

    return (
        <>
            {/* prevent navigating away when the user has unsaved work */}
            <UnsavedWorkConfirmation blockNavigationWhen={hasUnsavedWork} />

            <AuthoringFormContainer>
                <Grid sx={{ mt: '1rem' }} direction="column" gap="0.5rem">
                    <Heading3 bold>Primary Content (Required)</Heading3>
                    <BodyText size="small">
                        This section of content should provide a brief overview of your approach to feedback and what
                        you would like your audience to do.
                    </BodyText>
                </Grid>
                <AuthoringFormSection
                    name="Section Heading"
                    required
                    labelFor="description_title"
                    details="Your section heading should be descriptive, short and succinct."
                >
                    <Controller
                        control={control}
                        name="description_title"
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <TextField
                                    {...field}
                                    id="description_title"
                                    counter
                                    maxLength={60}
                                    placeholder="Section heading text"
                                    error={errors.description_title?.message ?? ''}
                                />
                            );
                        }}
                    />
                </AuthoringFormSection>

                <AuthoringFormSection
                    name="Body Copy"
                    required
                    labelFor="summary_editor_state"
                    details="Body copy for the summary section of your engagement should provide a short overview of what your engagement is about and describe what you are asking your audience to do."
                >
                    <ErrorMessage error={errors.summary_editor_state?.message ?? ''} />
                    <Controller
                        control={control}
                        name="summary_editor_state"
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <RichTextArea
                                    ariaLabel="Body Copy: Body copy for the summary section of your engagement should provide a short overview of what your engagement is about and describe what you are asking your audience to do."
                                    spellCheck
                                    editorState={field.value}
                                    onEditorStateChange={(value) => {
                                        field.onChange(handleEditorChange(value));
                                    }}
                                    placeholder="Body copy"
                                    handlePastedText={() => false}
                                    toolbar={toolbar}
                                />
                            );
                        }}
                    />
                </AuthoringFormSection>

                <Grid sx={{ mt: '1rem' }}>
                    <Heading3 bold pb="0.5rem">
                        Supporting Content (Optional)
                    </Heading3>
                    <BodyText size="small">
                        You may use a widget to add supporting content to your primary content.
                    </BodyText>
                    <Grid container sx={{ maxWidth: '700px', mt: '1rem' }} direction="column">
                        <WidgetPicker location={WidgetLocation.Summary} />
                    </Grid>
                </Grid>
            </AuthoringFormContainer>
        </>
    );
};

export default AuthoringSummary;
