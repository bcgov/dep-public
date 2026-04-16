import React, { useState, useEffect, Suspense } from 'react';
import { FormControlLabel, Grid2 as Grid, MenuItem, Radio, RadioGroup, Select } from '@mui/material';
import { Await, useOutletContext, useRouteLoaderData } from 'react-router';
import { TextField } from 'components/common/Input';
import { AuthoringTemplateOutletContext } from './types';
import { BodyText, ErrorMessage } from 'components/common/Typography/Body';
import ImageUpload from 'components/imageUpload';
import { AuthoringFormContainer, AuthoringFormSection } from './AuthoringFormLayout';
import { Heading3 } from 'components/common/Typography/Headings';
import { EngagementViewSections as Sections } from 'engagements/public/view';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';
import { Controller, useFormContext } from 'react-hook-form';
import { SUBMISSION_STATUS } from 'constants/engagementStatus';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { convertToRaw, EditorState } from 'draft-js';
import { defaultValuesObject, EngagementUpdateData } from './AuthoringContext';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import { Engagement } from 'models/engagement';

const ENGAGEMENT_UPLOADER_HEIGHT = '360px';
const ENGAGEMENT_CROPPER_ASPECT_RATIO = 1920 / 700;

const sectionOptions = [
    ['Summary', Sections.DESCRIPTION],
    ['Details', Sections.DETAILS_TABS],
    ['Provide Feedback', Sections.PROVIDE_FEEDBACK],
    ['Results', Sections.VIEW_RESULTS],
    ['Subscribe', Sections.SUBSCRIBE],
].map((section) => (
    <MenuItem value={section[1]} key={section[1]}>
        {section[0]} Section
    </MenuItem>
));

const AuthoringBanner = () => {
    // Access the form functions and values from the authoring template
    const { setDefaultValues, pageName, fetcher }: AuthoringTemplateOutletContext = useOutletContext();
    const {
        setValue,
        getValues,
        watch,
        reset,
        control,
        formState: { errors, isDirty, isSubmitting },
    } = useFormContext<EngagementUpdateData>();
    const { engagement } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;

    const [upcomingEditorState, setUpcomingEditorState] = useState<EditorState>(getEditorStateFromRaw(''));
    const [closedEditorState, setClosedEditorState] = useState<EditorState>(getEditorStateFromRaw(''));
    const hasUnsavedWork = isDirty && !isSubmitting;

    const handleAddBannerImage = (files: File[]) => {
        if (files.length > 0) {
            setValue('image_file', files[0], { shouldDirty: true });
            return;
        }
        setValue('image_file', null, { shouldDirty: true });
        setValue('image_url', '');
    };

    useEffect(() => {
        engagement.then((eng) => {
            reset(defaultValuesObject);
            setValue('form_source', pageName);
            setValue('id', Number(eng.id));
            setValue('name', eng.name);
            setValue('image_url', eng.banner_url);
            setValue('eyebrow', eng.sponsor_name);
            const openSection = eng.status_block.find((block) => block.survey_status === SUBMISSION_STATUS.OPEN);
            const closedSection = eng.status_block.find((block) => block.survey_status === SUBMISSION_STATUS.CLOSED);
            const upcomingSection = eng.status_block.find(
                (block) => block.survey_status === SUBMISSION_STATUS.UPCOMING,
            );
            const viewResultsSection = eng.status_block.find(
                (block) => block.survey_status === SUBMISSION_STATUS.VIEW_RESULTS,
            );
            setValue('open_cta', openSection?.button_text);
            setValue('open_cta_link_type', openSection?.link_type || 'internal');
            setValue('open_section_link', openSection?.internal_link);
            setValue('open_external_link', openSection?.external_link);
            setValue('view_results_cta', viewResultsSection?.button_text);
            setValue('view_results_link_type', viewResultsSection?.link_type || 'internal');
            setValue('view_results_section_link', viewResultsSection?.internal_link);
            setValue('view_results_external_link', viewResultsSection?.external_link);
            setValue('closed_message', closedSection?.block_text);
            setValue('upcoming_message', upcomingSection?.block_text);
            setUpcomingEditorState(getEditorStateFromRaw(upcomingSection?.block_text || ''));
            setClosedEditorState(getEditorStateFromRaw(closedSection?.block_text || ''));
            setDefaultValues(getValues());
            reset(getValues());
        });
    }, [engagement]);

    // Set current values to default state after saving form
    useEffect(() => {
        if (typeof fetcher.data !== 'string' || fetcher.data !== 'success') {
            return;
        }
        const newDefaults = getValues();
        setDefaultValues(newDefaults);
        reset(newDefaults);
    }, [fetcher.data]);

    const updateEditorState = (editorState: EditorState, field: 'upcoming_message' | 'closed_message') => {
        const stateSetters = {
            upcoming_message: setUpcomingEditorState,
            closed_message: setClosedEditorState,
        };
        stateSetters[field](editorState);
        setValue(field, JSON.stringify(convertToRaw(editorState.getCurrentContent())), { shouldDirty: true });
        // Set the plain text value for the editor state for length validation
        setValue(`_${field}_plain`, editorState.getCurrentContent().getPlainText());
    };

    return (
        <>
            {/* prevent navigating away when the user has unsaved work */}
            <UnsavedWorkConfirmation blockNavigationWhen={hasUnsavedWork} />

            <AuthoringFormContainer>
                <AuthoringFormSection
                    required
                    name="Engagement Title"
                    labelFor="name"
                    details="This is the title that will display for your engagement and should be descriptive, short and succinct."
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                id="name"
                                title="Title"
                                counter
                                maxLength={60}
                                placeholder="Engagement title"
                                error={errors.name?.message}
                            />
                        )}
                    />
                </AuthoringFormSection>
                <AuthoringFormSection
                    name="Eyebrow Text"
                    labelFor="eyebrow"
                    details={
                        'If your audience will need additional context to interpret the topic of your ' +
                        'engagement, or it is important for them to understand who, within BC Gov, is ' +
                        'requesting feedback, you may wish to add two to five words of eyebrow text.'
                    }
                >
                    <Controller
                        name="eyebrow"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                value={field.value || undefined}
                                id="eyebrow"
                                title="Eyebrow"
                                counter
                                maxLength={40}
                                placeholder="Eyebrow text"
                                error={errors.eyebrow?.message}
                            />
                        )}
                    />
                </AuthoringFormSection>
                <AuthoringFormSection
                    required
                    name="Hero Image"
                    labelFor="select-file-button"
                    details={
                        'Please ensure you use high quality images that help to communicate the topic of your ' +
                        'engagement. You must ensure that any important subject matter is positioned on the right side.'
                    }
                >
                    <ErrorMessage error={errors.image_url?.message} />
                    <Suspense>
                        <Await resolve={engagement}>
                            {(eng: Engagement) => (
                                <ImageUpload
                                    bgColor="background.default"
                                    margin={4}
                                    data-testid="engagement-form/image-upload"
                                    handleAddFile={handleAddBannerImage}
                                    savedImageUrl={eng.banner_url}
                                    savedImageName={eng.banner_filename}
                                    height={ENGAGEMENT_UPLOADER_HEIGHT}
                                    cropAspectRatio={ENGAGEMENT_CROPPER_ASPECT_RATIO}
                                />
                            )}
                        </Await>
                    </Suspense>
                </AuthoringFormSection>

                <Grid sx={{ mt: '1rem' }}>
                    <Heading3>Engagement State Content Variants</Heading3>
                    <BodyText size="small">
                        The content in this section of your engagement may be changed based on the state or status of
                        your engagement. Select the Section Preview or Page Preview button to see each of these states.
                    </BodyText>
                </Grid>
                <AuthoringFormSection
                    name="“Upcoming” State Message Text "
                    details={
                        'If you are going to publish your engagement before it is “Open”, ' +
                        'you may add message text to your hero banner advising your engagement ' +
                        'audience to come back later to provide feedback.'
                    }
                >
                    <BodyText size="small" bold>
                        Message Text
                    </BodyText>
                    <ErrorMessage error={errors._upcoming_message_plain?.message} />
                    <RichTextArea
                        ariaLabel="Upcoming State Message Text"
                        toolbar={{
                            options: ['inline', 'link', 'history'],
                            inline: { options: ['bold', 'italic', 'underline', 'superscript', 'subscript'] },
                        }}
                        placeholder="This engagement is not available for feedback yet; please visit again later."
                        editorState={upcomingEditorState}
                        onEditorStateChange={(value) => updateEditorState(value, 'upcoming_message')}
                    />
                    <BodyText size="small" ml="auto" mt={-2}>
                        {upcomingEditorState.getCurrentContent().getPlainText().length}/150
                    </BodyText>
                </AuthoringFormSection>
                <AuthoringFormSection
                    required
                    name="“Open” State Primary CTA"
                    labelFor="cta_button_text"
                    details={
                        'When your engagement is open the Primary CTA (button) in your engagement’s hero banner should ' +
                        'link to the most important action you want your engagement audience to take. Enter text for the ' +
                        'Primary CTA (button) below and then indicate where you would like it to link to.'
                    }
                >
                    <Controller
                        name="open_cta"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                id="cta_button_text"
                                title="Primary CTA (Button) Text"
                                counter
                                maxLength={20}
                                placeholder="Learn More"
                                error={errors.open_cta?.message}
                            />
                        )}
                    />
                    <Controller
                        name="open_cta_link_type"
                        control={control}
                        render={({ field }) => (
                            <Grid
                                container
                                size={12}
                                direction="row"
                                columnSpacing={4}
                                component={RadioGroup}
                                row
                                id="cta_link_radio"
                                {...field}
                            >
                                <Grid container size={6} direction="column">
                                    <FormControlLabel
                                        value="internal"
                                        control={<Radio color={'info'} />}
                                        slotProps={{
                                            typography: {
                                                sx: {
                                                    fontSize: '0.875rem',
                                                    fontWeight: 'bold',
                                                    color: 'text.secondary',
                                                },
                                            },
                                        }}
                                        label="In-Page Section Link"
                                    />
                                    <Controller
                                        name="open_section_link"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                disabled={watch('open_cta_link_type') !== 'internal'}
                                                aria-label="Section Link"
                                                sx={{
                                                    width: 'calc(100% - 1.5rem)',
                                                    ml: 3,
                                                    mt: 1,
                                                    height: '3em',
                                                    '& fieldset': { borderColor: '#7A7876' },
                                                }}
                                                id="section_link"
                                            >
                                                {sectionOptions}
                                            </Select>
                                        )}
                                    />
                                </Grid>
                                <Grid container direction="column" size={6}>
                                    <FormControlLabel
                                        value="external"
                                        control={<Radio color="info" />}
                                        slotProps={{
                                            typography: {
                                                sx: {
                                                    fontSize: '0.875rem',
                                                    fontWeight: 'bold',
                                                    color: 'text.secondary',
                                                },
                                            },
                                        }}
                                        label="External URL"
                                    />
                                    <Controller
                                        name="open_external_link"
                                        aria-label="External URL"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                width="calc(100% - 1.5rem)"
                                                value={field.value || undefined}
                                                disabled={watch('open_cta_link_type') !== 'external'}
                                                sx={{ ml: 3 }}
                                                id="external_link"
                                                placeholder="Paste or type URL here"
                                                error={errors.open_external_link?.message}
                                                errorPosition="bottom"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    />
                </AuthoringFormSection>
                <AuthoringFormSection
                    name="“Closed” (Results Pending) State Message Text"
                    details={
                        'When your engagement is closed, you may wish to add message text to your hero banner advising ' +
                        'your engagement audience to come back later to view the results of your engagement.'
                    }
                >
                    <BodyText size="small" bold>
                        Message Text
                    </BodyText>
                    <ErrorMessage error={errors._closed_message_plain?.message} />
                    <RichTextArea
                        ariaLabel="Closed State Message Text"
                        toolbar={{
                            options: ['inline', 'link', 'history'],
                            inline: { options: ['bold', 'italic', 'underline', 'superscript', 'subscript'] },
                        }}
                        placeholder="This engagement is now closed. Please return later to view the results."
                        editorState={closedEditorState}
                        onEditorStateChange={(value) => updateEditorState(value, 'closed_message')}
                    />
                    <BodyText size="small" ml="auto" mt={-2}>
                        {closedEditorState.getCurrentContent().getPlainText().length}/150
                    </BodyText>
                </AuthoringFormSection>
                <AuthoringFormSection
                    name="“View Results” State Primary CTA"
                    labelFor="cta_button_text"
                    details={
                        'If you will be publishing the results of your engagement, you can use the primary CTA in your ' +
                        'hero banner do direct your engagement audience to those results. You may link to results ' +
                        'published within this engagement, or enter a URL to an external web page.'
                    }
                >
                    <Controller
                        name="view_results_cta"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                id="cta_button_text"
                                value={field.value || undefined}
                                title="Button (Primary CTA) Text"
                                counter
                                maxLength={20}
                                placeholder="View results"
                            />
                        )}
                    />
                    <Controller
                        name="view_results_link_type"
                        control={control}
                        render={({ field }) => (
                            <RadioGroup row id="cta_view_results_radio" defaultValue="internal" {...field}>
                                <Grid size={6} direction="column" sx={{ paddingRight: '2rem' }}>
                                    <FormControlLabel
                                        value="internal"
                                        control={<Radio />}
                                        label="In-Page Section Link"
                                    />
                                    <br />
                                    <Controller
                                        name="view_results_section_link"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                aria-label="Section Link"
                                                fullWidth
                                                disabled={watch('view_results_link_type') !== 'internal'}
                                                sx={{ mt: 1, height: '3em', '& fieldset': { borderColor: '#7A7876' } }}
                                                id="view_results_link"
                                            >
                                                {sectionOptions}
                                            </Select>
                                        )}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <FormControlLabel value="external" control={<Radio />} label="External URL" />
                                    <br />

                                    <Controller
                                        name="view_results_external_link"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                value={field.value || undefined}
                                                disabled={watch('view_results_link_type') !== 'external'}
                                                id="view_results_link"
                                                placeholder="Paste or type URL here"
                                            />
                                        )}
                                    />
                                </Grid>
                            </RadioGroup>
                        )}
                    />
                </AuthoringFormSection>
            </AuthoringFormContainer>
        </>
    );
};

export default AuthoringBanner;
