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
import dayjs from 'dayjs';
import { Language } from 'models/language';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { ROUTES, getPath } from 'routes/routes';

const EngagementConfigurationWizard = () => {
    const { engagement, teamMembers, slug } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const eng = React.use(engagement);
    const tm = React.use(teamMembers);
    const sl = React.use(slug);
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
                    <ConfigForm engagement={eng} teamMembers={tm} slug={sl} />
                </Suspense>
            </Grid>
        </ResponsiveContainer>
    );
};

const ConfigForm = ({
    engagement,
    teamMembers,
    slug,
}: {
    engagement: Engagement;
    teamMembers: EngagementTeamMember[];
    slug: string;
}) => {
    const fetcher = useFetcher();

    const engagementConfigForm = useForm<EngagementConfigurationData>({
        defaultValues: {
            name: engagement.name,
            feedback_methods: [],
            start_date: dayjs(engagement.start_date),
            end_date: dayjs(engagement.end_date),
            _dateConfirmed: true,
            languages: [{ code: 'en', name: 'English' }] as Language[],
            is_internal: engagement.is_internal,
            _visibilityConfirmed: true,
            slug: slug,
            users: teamMembers.filter((tm) => tm.status == ENGAGEMENT_MEMBERSHIP_STATUS.Active).map((tm) => tm.user),
        },
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });

    const onSubmit = async (data: EngagementConfigurationData) => {
        await fetcher.submit(
            createSearchParams({
                name: data.name,
                feedback_methods: data.feedback_methods,
                start_date: data.start_date.format('YYYY-MM-DD'),
                end_date: data.end_date.format('YYYY-MM-DD'),
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
