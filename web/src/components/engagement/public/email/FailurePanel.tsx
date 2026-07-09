import React from 'react';
import { Grid2 as Grid, Stack } from '@mui/material';
import { FailurePanelProps } from './types';
import { modalStyle } from 'components/common';
import { BodyText, Heading1 } from 'components/common/Typography';
import { When } from 'react-if';
import { Button } from 'components/common/Input/Button';
import { Link } from 'components/common/Navigation';

const FailurePanel = ({ email, handleClose, tryAgain, isInternal }: FailurePanelProps) => {
    /* TODO: Populate this with the tenant configuration from the API */
    const contactEmail = '********@gov.bc.ca';
    return (
        <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            sx={{ ...modalStyle }}
            spacing={1}
        >
            <Grid size={12}>
                <Heading1 bold>We're sorry!</Heading1>
            </Grid>
            <Grid size={12}>
                <BodyText>There was a problem verifying the email address you provided:</BodyText>
            </Grid>

            <Grid size={12} pb={1}>
                <BodyText bold size="large" fontFamily="ui-monospace, monospace">
                    {email}
                </BodyText>
            </Grid>
            <When condition={isInternal}>
                <Grid size={12}>
                    <BodyText color="error">
                        <strong>This is an internal engagement.</strong> Make sure you are using a government email.
                    </BodyText>
                </Grid>
            </When>
            <Grid size={12}>
                <BodyText>Please ensure you have entered your email address correctly and try again.</BodyText>
            </Grid>
            <Grid size={12}>
                <BodyText>
                    If this problem persists, please contact{' '}
                    <Link target="_blank" href={`mailto:${contactEmail}`}>
                        {contactEmail}
                    </Link>
                </BodyText>
            </Grid>
            <Grid size={12} container direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: '1em' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width="100%" justifyContent="flex-end">
                    <Button onClick={handleClose}>Back</Button>
                    <Button variant="primary" onClick={tryAgain}>
                        Try Again
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    );
};

export default FailurePanel;
