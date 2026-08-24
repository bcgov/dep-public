import React, { Suspense, useEffect } from 'react';
import { useFetcher, createSearchParams, useNavigate, useRouteLoaderData, Await } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import EngagementForm, { EngagementConfigurationData } from '.';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';
import { Engagement } from 'models/engagement';
import { ENGAGEMENT_MEMBERSHIP_STATUS, EngagementTeamMember } from 'models/engagementTeamMember';
import { Heading1, Heading2 } from 'components/common/Typography';
import { Language } from 'models/language';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { ROUTES, getPath } from 'routes/routes';
import { formatToUTC, convertToPacific } from 'components/common/dateHelper';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { SECTION_CONFIG_GENERAL, findScopedSectionLock, getLockConflictPayload } from 'services/resourceLockService';
import useEngagementSectionEditLock from 'services/resourceLockService/useEngagementSectionEditLock';
import { useResourceLocks } from 'services/resourceLockService/useResourceLocks';
import useResourceSectionLockNavigation from 'engagements/admin/create/authoring/useResourceSectionLockNavigation';

const EngagementConfigurationWizard = () => {
    const loaderData = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const engagement = React.use(loaderData.engagement);
    const teamMembers = React.use(loaderData.teamMembers);
    const slug = engagement.slug;
    const languages = React.use(loaderData.languages);
    return (
        <Grid container size={12}>
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
        </Grid>
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
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
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
                lock_token: activeLockToken ?? '',
            }),
            {
                method: 'patch',
                action: getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG_EDIT, { engagementId: engagement.id }),
            },
        );
    };

    const {
        reset,
        formState: { defaultValues, isDirty, isSubmitting },
    } = engagementConfigForm;
    const { locks, refreshLocks } = useResourceLocks({
        resourceId: engagement.id,
        initialLocksPromise: (useRouteLoaderData('single-engagement') as EngagementLoaderAdminData).locks,
    });
    const conflictingConfigLock = React.useMemo(() => {
        const configLock = findScopedSectionLock({
            locks,
            sectionKey: SECTION_CONFIG_GENERAL,
            languageScoped: false,
        });

        if (!configLock || configLock.is_mine) {
            return null;
        }

        return configLock;
    }, [locks]);

    const { activeLockToken } = useEngagementSectionEditLock({
        resourceId: engagement.id,
        scope: { sectionKey: SECTION_CONFIG_GENERAL },
        enabled: true,
        isDirty,
        isSubmitting,
        blockedByLock: conflictingConfigLock,
        onConflict: async (error) => {
            const conflictPayload = getLockConflictPayload(error);
            if (conflictPayload) {
                await refreshLocks();
                return;
            }

            const message = error instanceof Error ? error.message : 'Unable to acquire edit lock for configuration.';
            dispatch(
                openNotification({
                    severity: 'error',
                    text: message,
                }),
            );
        },
    });

    const handleBackToConfigSummary = React.useCallback(() => {
        navigate(getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG, { engagementId: engagement.id }));
    }, [engagement.id, navigate]);

    const refreshConflictState = React.useCallback(async () => {
        await refreshLocks();
    }, [refreshLocks]);

    const { conflictLockModal, breakLockModal } = useResourceSectionLockNavigation({
        conflictModal: {
            lock: conflictingConfigLock,
            sectionName: 'Configuration',
            backButtonText: 'Back to Configuration Summary',
            onBack: handleBackToConfigSummary,
            onRetry: refreshConflictState,
            onAfterBreakLock: refreshConflictState,
        },
    });

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.status === 'failure') {
            // Keep entered field values but clear submit state so the modal can close.
            reset(defaultValues, { keepValues: true, keepDirty: false, keepSubmitCount: false });
        }
    }, [fetcher.state, fetcher.data, reset, defaultValues]);

    return (
        <FormProvider {...engagementConfigForm}>
            {conflictLockModal}
            {breakLockModal}
            <EngagementForm engagement={engagement} onSubmit={onSubmit} />
        </FormProvider>
    );
};

export default EngagementConfigurationWizard;
