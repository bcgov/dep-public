import React, { useState } from 'react';
import { BodyText, Heading2 } from 'components/common/Typography';
import { Button, TextField } from 'components/common/Input';
import { Form } from 'react-router';
import Grid from '@mui/material/Grid2';
import { Dayjs } from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';
import EngagementVisibilityControl from '../EngagementVisibilityControl';
import { FeedbackMethodSelector } from '../FeedbackMethodSelector';
import { DateRangePickerWithCalculation } from '../DateRangePickerWithCalculation';
import { LanguageManager } from '../LanguageManager';
import { UserManager } from '../UserManager';
import { User } from 'models/user';
import { Engagement } from 'models/engagement';
import { Language } from 'models/language';
import { FormStep } from 'components/common/Layout/FormStep';
import { Modal, CircularProgress } from '@mui/material';
import { modalStyle } from 'components/common';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';
import { ROUTES, getPath } from 'routes/routes';

export interface EngagementConfigurationData {
    // 1. Title
    name: string;
    // 2. Feedback methods
    feedback_methods: string[];
    // 3. Dates
    start_date: Dayjs;
    end_date: Dayjs;
    _dateConfirmed: boolean;
    // 4. Languages
    languages: Language[];
    // 5. Access control
    is_internal: boolean;
    slug: string;
    _visibilityConfirmed: boolean;
    // 6. Team members
    users: User[];
}

const EngagementForm = ({
    onSubmit,
    engagement,
}: {
    onSubmit: (data: EngagementConfigurationData) => void;
    engagement: Engagement | null;
}) => {
    const engagementForm = useFormContext<EngagementConfigurationData>();

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors, isDirty, isValid, isSubmitting, isSubmitted, touchedFields },
    } = engagementForm;

    const [nameHasBeenEdited, setNameHasBeenEdited] = useState(false);

    const parentPageLink = engagement
        ? getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG, { engagementId: engagement.id })
        : getPath(ROUTES.ENGAGEMENTS);

    return (
        <Form onSubmit={handleSubmit(onSubmit)} id="engagement-config-form">
            <Grid container sx={{ maxWidth: '49.25rem' }}>
                <Heading2 decorated>{engagement ? 'Edit Configuration' : 'Configure Engagement'}</Heading2>
                <Controller
                    control={control}
                    name="name"
                    rules={{ required: 'Engagement title is required' }}
                    render={({ field }) => {
                        return (
                            <FormStep
                                step={1}
                                completed={Boolean(field.value)}
                                completing={touchedFields.name && nameHasBeenEdited}
                                question="What is the title of your engagement?"
                                details="Titles should succinctly describe what your engagement is about in 60 characters or less."
                                labelFor="name"
                            >
                                <TextField
                                    id="name"
                                    {...field}
                                    error={nameHasBeenEdited ? errors.name?.message : undefined}
                                    counter
                                    maxLength={50}
                                    onChange={(value) => {
                                        setNameHasBeenEdited((current) => Boolean(value) || current);
                                        field.onChange(value);
                                    }}
                                    placeholder="Engagement title"
                                />
                            </FormStep>
                        );
                    }}
                />
                <FormStep
                    step={2}
                    completed={watch('feedback_methods').length > 0}
                    question="How will your engagement be gathering feedback?"
                    details="Select all that apply. These are the ways in which you will be collecting feedback from your participants. For example, you may choose to collect feedback through surveys, polls, or discussion forums."
                    isGroup
                >
                    <FeedbackMethodSelector />
                </FormStep>
                <FormStep
                    step={3}
                    completed={Boolean(watch('start_date')) && Boolean(watch('end_date')) && watch('_dateConfirmed')}
                    completing={Boolean(touchedFields.start_date) && Boolean(touchedFields.end_date)}
                    question="When will your engagement be open for receiving feedback?"
                    details="Please select the dates your engagement will be open and closed for receiving feedback. (These dates are not related to when your engagement will be published.)"
                    isGroup
                >
                    <DateRangePickerWithCalculation />
                </FormStep>
                <FormStep
                    step={4}
                    completed={watch('languages').some((l) => l.code)}
                    question="Will your engagement be offered in multiple languages?"
                    details="All engagements must be offered in English, but you may also add content in additional languages. If you select multi-language, you must include French."
                    isGroup
                >
                    <LanguageManager />
                </FormStep>
                <FormStep
                    step={5}
                    completed={Boolean(
                        watch('is_internal') !== undefined && watch('slug') && watch('_visibilityConfirmed'),
                    )}
                    completing={Boolean(touchedFields.is_internal)}
                    question="Who should be able to access your published engagement?"
                    details="If you select BC Gov, your engagement will only be accessible by BC Gov employees who have an IDIR."
                    isGroup
                >
                    <EngagementVisibilityControl />
                </FormStep>
                <FormStep
                    step={6}
                    completed={watch('users').some((u) => u)}
                    question="Who would you like to add to this engagement?"
                    details="In addition to yourself, please add the team members that you would like to have access to this engagement. You can only add individuals that have already signed into DEP."
                    isGroup
                >
                    <UserManager />
                </FormStep>
            </Grid>
            <Grid sx={{ mt: 3 }}>
                <Button
                    sx={{ mr: '16px' }}
                    disabled={
                        !isValid ||
                        !isDirty ||
                        isSubmitting ||
                        isSubmitted ||
                        !watch('_dateConfirmed') ||
                        !watch('_visibilityConfirmed')
                    }
                    variant="primary"
                    type="submit"
                >
                    {engagement ? 'Save Changes' : 'Create Engagement'}
                </Button>
                <Button href={parentPageLink}>Cancel</Button>
            </Grid>
            <UnsavedWorkConfirmation blockNavigationWhen={isDirty && !isSubmitting} />
            <Modal open={isSubmitting || isSubmitted}>
                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    sx={{ ...modalStyle, borderColor: 'notification.default.shade' }}
                >
                    <Grid size={1} sx={{ pt: 1.25, fontSize: '16px' }}>
                        <CircularProgress
                            variant="indeterminate"
                            sx={{
                                color: 'notification.default.shade',
                                width: '24px',
                                height: '24px',
                                animationDuration: '550ms',
                                '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round',
                                },
                            }}
                        />
                    </Grid>
                    <Grid
                        size={11}
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="space-between"
                        rowSpacing={1}
                    >
                        <Grid container direction="row" size={12}>
                            <Grid size={12}>
                                <Heading2 mb={0}>We're just looking over your configuration.</Heading2>
                            </Grid>
                        </Grid>
                        <Grid container direction="row" size={12}>
                            <BodyText bold>This should only take a few seconds.</BodyText>
                        </Grid>
                    </Grid>
                </Grid>
            </Modal>
        </Form>
    );
};

export default EngagementForm;
