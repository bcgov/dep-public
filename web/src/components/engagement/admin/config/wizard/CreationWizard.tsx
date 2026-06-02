import React from 'react';
import { ResponsiveContainer } from 'components/common/Layout';
import { useFetcher, createSearchParams } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import EngagementForm, { EngagementConfigurationData } from '.';
import { Heading1, Heading2 } from 'components/common/Typography';
import { SystemMessage } from 'components/common/Layout/SystemMessage';
import Grid from '@mui/material/Grid2';
import { ROUTES, getPath } from 'routes/routes';
import { formatToUTC } from 'components/common/dateHelper';

const EngagementCreationWizard = () => {
    const fetcher = useFetcher({ key: 'config-update' });

    const engagementCreationForm = useForm<EngagementConfigurationData>({
        defaultValues: {
            name: '',
            feedback_methods: [],
            start_date: undefined,
            start_time: undefined,
            end_date: undefined,
            end_time: undefined,
            _dateConfirmed: true,
            languages: [],
            is_internal: undefined,
            _visibilityConfirmed: false,
            slug: '',
            users: [],
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });

    const onSubmit = async (data: EngagementConfigurationData) => {
        const startDate = `${data.start_date.format('YYYY-MM-DD')} ${data.start_time.format('HH:mm')}:00`; // Don't save seconds
        const endDate = `${data.end_date.format('YYYY-MM-DD')} ${data.end_time.format('HH:mm')}:00`; // Don't save seconds
        fetcher.submit(
            createSearchParams({
                name: data.name,
                feedback_methods: data.feedback_methods,
                start_date: formatToUTC(startDate, 'YYYY-MM-DD HH:mm:ss'),
                end_date: formatToUTC(endDate, 'YYYY-MM-DD HH:mm:ss'),
                languages: data.languages.map((l) => l.code),
                is_internal: data.is_internal ? 'true' : 'false',
                slug: data.slug,
                users: data.users.map((u) => u.external_id),
            }),
            {
                method: 'post',
                action: `${getPath(ROUTES.ENGAGEMENT_CREATE)}/`,
            },
        );
    };

    return (
        <ResponsiveContainer gap={1}>
            <AutoBreadcrumbs />
            <Grid size={12}>
                <Heading1 mb={0}>New Engagement</Heading1>
            </Grid>
            <Grid size={12}>
                <Heading2 weight="thin" mb="1rem">
                    Create a new engagement in six easy configuration steps.
                </Heading2>
            </Grid>
            <Grid>
                <SystemMessage status="info">
                    You will be able to modify the configuration of your engagement later in the case the parameters of
                    your engagement change.
                </SystemMessage>
            </Grid>
            <Grid size={12} mt={5}>
                <FormProvider {...engagementCreationForm}>
                    <EngagementForm engagement={null} onSubmit={onSubmit} />
                </FormProvider>
            </Grid>
        </ResponsiveContainer>
    );
};

export default EngagementCreationWizard;
