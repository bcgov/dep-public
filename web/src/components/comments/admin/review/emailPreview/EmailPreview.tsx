import { Box, Grid2 as Grid, Stack, Link } from '@mui/material';
import * as React from 'react';
import { BodyText } from 'components/common/Typography/Body';
import { ReactComponent as BCLogo } from 'assets/images/BritishColumbiaLogoDark.svg';
import { Survey } from 'models/survey';
import dayjs from 'dayjs';
import { useAppSelector } from 'hooks';
import { TenantState } from 'reduxSlices/tenantSlice';
import { EngagementStatus } from 'constants/engagementStatus';

export default function EmailPreview({
    survey,
    children,
    ...rest
}: {
    survey: Survey;
    children: React.ReactNode;
    [prop: string]: unknown;
}) {
    const endDate = survey.engagement?.end_date ? dayjs(survey.engagement.end_date).format('MMM DD, YYYY') : '';
    const tenant: TenantState = useAppSelector((state) => state.tenant);
    const isClosed = survey.engagement?.engagement_status.id === EngagementStatus.Closed;
    const engagementName = survey.engagement?.name || '';
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={container}>
                <Stack direction={'row'}>
                    <Box
                        component={BCLogo}
                        sx={{
                            height: '5em',
                            width: { xs: '4em', md: '5em' },
                            marginRight: { xs: '0.5em', md: '0.5em' },
                        }}
                        alt="British Columbia Logo"
                    />
                </Stack>
                <Grid size={12}>
                    <BodyText sx={{ mb: 1 }}>
                        Thank you for taking the time to provide your feedback on {engagementName}.
                    </BodyText>
                </Grid>
                {children}
                <Grid size={12}>
                    <BodyText sx={{ mb: 2 }}>
                        {!isClosed ? (
                            <>
                                You can edit and re-submit your feedback. The comment period is open until {''}
                                {endDate}. You must re-submit your feedback before the comment period closes.
                            </>
                        ) : (
                            <>
                                We are sorry but the public commenting period for {engagementName} is now closed and
                                your feedback cannot be edited.
                            </>
                        )}
                    </BodyText>
                </Grid>
                <Grid size={12}>
                    {!isClosed ? (
                        <BodyText
                            sx={{
                                borderLeft: '4px solid grey',
                                paddingLeft: '8px',
                                color: '#555',
                                mb: 2,
                            }}
                        >
                            <Link sx={{ color: (theme) => theme.palette.action.active }}>Edit your feedback</Link>
                        </BodyText>
                    ) : null}
                </Grid>
                <Grid size={12}>
                    <BodyText sx={{ mb: 1 }}>Thank you,</BodyText>
                </Grid>
                <Grid size={12}>
                    <BodyText sx={{ mb: 1 }}>The {tenant.name} Team</BodyText>
                </Grid>
            </Box>
        </Box>
    );
}

const container = {
    backgroundColor: 'Background',
    border: '1px solid',
    borderColor: 'gray.30',
    borderRadius: '5px',
    boxShadow: 3,
    width: '80%',
    padding: '30px 20px 40px',
};
