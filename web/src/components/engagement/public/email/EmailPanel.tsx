import React, { FormEvent, useState } from 'react';
import { Grid2 as Grid, Checkbox, FormControl, FormControlLabel, FormHelperText, Stack } from '@mui/material';
import { EmailPanelProps } from 'engagements/public/email/types';
import { modalStyle, DisclaimerBox } from 'components/common';
import { When } from 'react-if';
import { INTERNAL_EMAIL_DOMAIN } from 'constants/emailVerification';
import { Editor } from 'react-draft-wysiwyg';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { Button, CustomTextField } from 'components/common/Input';
import { useAsyncValue } from 'react-router';
import { Engagement } from 'models/engagement';
import { BodyText, Heading1 } from 'components/common/Typography';

const EmailPanel = ({ email, checkEmail, handleClose, updateEmail, isSaving, isInternal }: EmailPanelProps) => {
    const loadedEngagement = useAsyncValue() as [Engagement] | undefined;
    const engagement = loadedEngagement ? loadedEngagement[0] : undefined;
    const [checked, setChecked] = useState(false);
    const [emailFormError, setEmailFormError] = useState({
        terms: false,
        email: false,
    });

    const validateForm = () => {
        const errors = {
            terms: !checked,
            email: !email,
        };

        setEmailFormError(errors);

        return Object.values(errors).some((isError: unknown) => isError);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isSaving) {
            return;
        }
        const hasErrors = validateForm();

        if (!hasErrors) {
            checkEmail();
        }
    };

    return (
        <form onSubmit={(e) => handleSubmit(e)}>
            <Grid
                container
                direction="row"
                sx={{ ...modalStyle }}
                alignItems="flex-start"
                justifyContent="flex-start"
                rowSpacing={2}
            >
                <Grid size={12}>
                    <Heading1 bold sx={{ mb: 2 }}>
                        Verify your email address
                    </Heading1>
                </Grid>

                <Grid size={12}>
                    <BodyText>
                        To provide you with the best experience possible, we require you to validate your email address.
                    </BodyText>
                </Grid>

                <Grid size={12}>
                    <BodyText>
                        You will receive a link to provide your feedback at the email address you provide.
                    </BodyText>
                </Grid>

                <Grid size={12}>
                    <BodyText>
                        <strong>Why are we collecting your email?</strong> Email verification helps us to know you are
                        not a robot, and ensures we have your consent to collect your feedback. Your email address will
                        remain confidential and will only be used to authenticate your participation in this public
                        comment period.
                    </BodyText>
                </Grid>
                <Grid size={12}>
                    <DisclaimerBox>
                        <Editor
                            editorState={getEditorStateFromRaw(engagement?.consent_message ?? '')}
                            readOnly={true}
                            toolbarHidden
                        />
                    </DisclaimerBox>
                </Grid>
                <Grid
                    container
                    direction="row"
                    width="100%"
                    size={12}
                    alignItems="flex-start"
                    justifyContent="flex-start"
                    rowSpacing={1}
                >
                    <Grid size={12}>
                        <FormControl required error={emailFormError.terms} component="fieldset" variant="standard">
                            <FormControlLabel
                                sx={{ marginInline: '-11px 16px' }}
                                control={
                                    <Checkbox
                                        onChange={(event) => {
                                            setChecked(event.target.checked);
                                            setEmailFormError({ ...emailFormError, terms: false });
                                        }}
                                    />
                                }
                                label="I agree to the terms and conditions above."
                            />
                            <FormHelperText>
                                {emailFormError.terms ? 'Please accept the terms and conditions' : ''}
                            </FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid size={12}>
                        <BodyText bold>Email Address</BodyText>
                        <CustomTextField
                            onChange={(e) => {
                                updateEmail(e.target.value);
                                setEmailFormError({ ...emailFormError, email: false });
                            }}
                            label=" "
                            InputLabelProps={{
                                shrink: false,
                            }}
                            error={emailFormError.email}
                            helperText={emailFormError.email ? 'Please enter an email' : ''}
                            fullWidth
                        />
                    </Grid>
                </Grid>
                <When condition={isInternal}>
                    <Grid size={12}>
                        <BodyText>
                            <strong>This is an Internal Engagement!</strong> You can only use a {INTERNAL_EMAIL_DOMAIN}{' '}
                            email address to answer this survey.
                        </BodyText>
                    </Grid>
                </When>
                <Grid container direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: '1em' }}>
                    <Stack
                        direction={{ md: 'column-reverse', lg: 'row' }}
                        spacing={1}
                        width="100%"
                        justifyContent="flex-end"
                    >
                        <Button onClick={handleClose} disabled={isSaving} size="small">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="small" loading={isSaving}>
                            Submit
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </form>
    );
};

export default EmailPanel;
