import React, { Suspense } from 'react';
import { Await, useParams } from 'react-router';
import { Grid2 as Grid, Paper, Skeleton } from '@mui/material';
import { ROUTES, getPath } from 'routes/routes';
import { useSurveyLoaderData } from 'components/survey/useSurveyLoaderData';
import { SurveyForm } from 'components/survey/submit/SurveyForm';
import { PermissionsGate } from 'components/permissionsGate';
import { USER_ROLES } from 'services/userService/constants';
import { Button } from 'components/common/Input';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faPen } from '@fortawesome/pro-regular-svg-icons';
import { ReactComponent as PagePreviewIcon } from 'assets/images/pagePreview.svg';
import { SurveyBanner } from 'components/survey/common/SurveyBanner';
import useResourceLocks from 'services/resourceLockService/useResourceLocks';
import {
    findScopedSectionLock,
    SECTION_SURVEY_BUILDER,
    SECTION_SURVEY_REPORT_SETTINGS,
} from 'services/resourceLockService';
import useResourceSectionLockNavigation from 'engagements/admin/create/authoring/useResourceSectionLockNavigation';
import LockOwnerAvatar from 'engagements/admin/create/authoring/LockOwnerAvatar';

const SurveyPreview = () => {
    const loaderData = useSurveyLoaderData();
    const surveyId = Number(useParams<{ surveyId: string }>().surveyId ?? 0);
    const { locks } = useResourceLocks({
        resourceId: surveyId,
        resourceType: 'survey',
        initialLocksPromise: loaderData.locks,
    });
    const { resolveSectionLockState, requestNavigation, breakLockModal } = useResourceSectionLockNavigation();
    const builderLock = findScopedSectionLock({ locks, sectionKey: SECTION_SURVEY_BUILDER });
    const reportSettingsLock = findScopedSectionLock({ locks, sectionKey: SECTION_SURVEY_REPORT_SETTINGS });
    const { isDisabled: isBuilderDisabled } = resolveSectionLockState(builderLock);
    const { isDisabled: isReportSettingsDisabled } = resolveSectionLockState(reportSettingsLock);

    return (
        <Grid container direction="row" justifyContent="flex-start" alignItems="flex-start">
            {breakLockModal}
            <Grid container size={12} maxWidth="1120px">
                <SurveyBanner
                    loaderData={loaderData}
                    eyebrowText="Survey Preview"
                    errorText="Error loading survey preview data."
                    showUnlinkedFallback
                    actions={
                        <>
                            <PermissionsGate scopes={[USER_ROLES.EDIT_ENGAGEMENT]} errorProps={{ disabled: true }}>
                                <Button
                                    icon={<FontAwesomeIcon icon={faPen} />}
                                    LinkComponent={RouterLinkRenderer}
                                    variant="primary"
                                    disabled={!surveyId || isBuilderDisabled}
                                    href={getPath(ROUTES.SURVEY_BUILD, { surveyId })}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        requestNavigation({
                                            href: getPath(ROUTES.SURVEY_BUILD, { surveyId }),
                                            sectionName: 'Survey Builder',
                                            lock: builderLock,
                                        });
                                    }}
                                >
                                    Edit Survey
                                    <LockOwnerAvatar sx={{ ml: 1 }} lock={builderLock ?? undefined} />
                                </Button>
                            </PermissionsGate>
                            <Button
                                icon={<FontAwesomeIcon icon={faCog} />}
                                href={getPath(ROUTES.SURVEY_REPORT, { surveyId })}
                                LinkComponent={RouterLinkRenderer}
                                disabled={!surveyId || isReportSettingsDisabled}
                                onClick={(e) => {
                                    e.preventDefault();
                                    requestNavigation({
                                        href: getPath(ROUTES.SURVEY_REPORT, { surveyId }),
                                        sectionName: 'Survey Report Settings',
                                        lock: reportSettingsLock,
                                    });
                                }}
                            >
                                Survey Report Settings
                            </Button>
                            <Suspense fallback={<Skeleton variant="rectangular" width={245} height={48} />}>
                                <Await resolve={loaderData.engagement}>
                                    {(engagement) =>
                                        engagement && (
                                            <Button
                                                href={getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, {
                                                    engagementId: engagement?.id ?? 0,
                                                })}
                                                icon={<PagePreviewIcon aria-hidden="true" />}
                                            >
                                                View Engagement
                                            </Button>
                                        )
                                    }
                                </Await>
                            </Suspense>
                        </>
                    }
                />
                <Grid size={12}>
                    <Paper elevation={2}>
                        <Suspense fallback={<SurveyFormSkeleton />}>
                            <SurveyForm />
                        </Suspense>
                    </Paper>
                </Grid>
            </Grid>
        </Grid>
    );
};

const SurveyFormSkeleton = () => {
    return (
        <Grid size={12}>
            {/* Skeleton for the survey form */}
            <Skeleton variant="rectangular" height={600} sx={{ borderRadius: '4px' }} />
        </Grid>
    );
};

export default SurveyPreview;
