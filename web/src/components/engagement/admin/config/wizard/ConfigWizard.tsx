import React, { Suspense, useEffect } from 'react';
import { ResponsiveContainer } from 'components/common/Layout';
import { useFetcher, createSearchParams, useRouteLoaderData, Await } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import EngagementForm, { EngagementConfigurationData } from '.';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';
import { Engagement } from 'models/engagement';
import { ENGAGEMENT_MEMBERSHIP_STATUS, EngagementTeamMember } from 'models/engagementTeamMember';
import { Heading1, Heading2 } from 'components/common/Typography';
import { Language } from 'models/language';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { ROUTES, getPath } from 'routes/routes';
import { formatToUTC, convertToPacific } from 'components/common/dateHelper';

const EngagementConfigurationWizard = () => {
    const loaderData = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const engagement = React.use(loaderData.engagement);
    const teamMembers = React.use(loaderData.teamMembers);
    const slug = engagement.slug;
    const languages = React.use(loaderData.languages);
    return (
        <ResponsiveContainer>
            <AutoBreadcrumbs />
            <Grid size={12}>
                <Suspense
                    fallback={
                        <Skeleton variant="text">
                            <Heading1 mb={0}>Example Engagement</Heading1>
                        </Skeleton>
                    }
                >
                    <Await resolve={engagement}>
                        {(resolvedEngagement) => <Heading1 mb={0}>{resolvedEngagement.name}</Heading1>}
                    </Await>
                </Suspense>
            </Grid>
            <Grid size={12} mt={4}>
                <Suspense fallback={<Heading2 decorated>Edit Configuration</Heading2>}>
                    <ConfigForm engagement={engagement} teamMembers={teamMembers} slug={slug} languages={languages} />
                </Suspense>
            </Grid>
        </ResponsiveContainer>
    );
};

const ConfigForm = ({
    engagement,
    teamMembers,
    slug,
    languages,
}: {
    engagement: Engagement;
    teamMembers: EngagementTeamMember[];
    slug: string;
    languages: Language[];
}) => {
    const fetcher = useFetcher();
    const start = convertToPacific(engagement.start_date);
    const end = convertToPacific(engagement.end_date);
    const engagementConfigForm = useForm<EngagementConfigurationData>({
        defaultValues: {
            name: engagement.name,
            feedback_methods: [],
            start_date: start,
            start_time: start,
            end_date: end,
            end_time: end,
            _dateConfirmed: true,
            languages,
            is_internal: engagement.is_internal,
            _visibilityConfirmed: true,
            slug: slug,
            users: teamMembers.filter((tm) => tm.status == ENGAGEMENT_MEMBERSHIP_STATUS.Active).map((tm) => tm.user),
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });

    const onSubmit = async (data: EngagementConfigurationData) => {
        // Concat date and time as a string
        const startDate = `${data.start_date.format('YYYY-MM-DD')} ${data.start_time.format('HH:mm')}:00`; // Don't save seconds
        const endDate = `${data.end_date.format('YYYY-MM-DD')} ${data.end_time.format('HH:mm')}:00`; // Don't save seconds
        await fetcher.submit(
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
                method: 'patch',
                action: getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG_EDIT, { engagementId: engagement.id }),
            },
        );
    };

    const {
        getValues,
        reset,
        formState: { defaultValues },
    } = engagementConfigForm;

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.status === 'failure') {
            // Keep entered field values but clear submit state so the modal can close.
            reset(defaultValues, { keepValues: true, keepDirty: false, keepSubmitCount: false });
        }
    }, [fetcher.state, fetcher.data, getValues, reset]);

    return (
        <FormProvider {...engagementConfigForm}>
            <EngagementForm engagement={engagement} onSubmit={onSubmit} />
        </FormProvider>
    );
};

export default EngagementConfigurationWizard;
