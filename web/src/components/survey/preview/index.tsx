import React, { Suspense } from 'react';
import { Await, useNavigate, useParams } from 'react-router';
import { Card, CardActionArea, CardContent, Grid2 as Grid, Paper, Skeleton } from '@mui/material';
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
import useResourceSectionLockNavigation from 'components/locking/useResourceSectionLockNavigation';
import LockOwnerAvatar from 'components/locking/LockOwnerAvatar';
import { BodyText, Heading3 } from 'components/common/Typography';
import { Survey } from 'models/survey';
import { CommentStatus } from 'constants/commentStatus';
import { SubmissionStatus } from 'constants/engagementStatus';

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
                <Suspense>
                    <Await resolve={loaderData.survey}>
                        {(survey) => (
                            <Grid
                                mb={2}
                                size={12}
                                hidden={
                                    ![SubmissionStatus.Open, SubmissionStatus.Closed].includes(
                                        survey.engagement?.submission_status ?? SubmissionStatus.Upcoming,
                                    )
                                }
                            >
                                <Heading3 my={1}>Survey Responses</Heading3>
                                <CommentNavigation survey={survey} />
                            </Grid>
                        )}
                    </Await>
                </Suspense>
                <Grid size={12}>
                    <Heading3 my={1}>Survey Preview</Heading3>
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

const CommentNavigation = ({ survey }: { survey: Survey }) => {
    const navigate = useNavigate();
    const { total, approved, rejected, pending, needs_further_review } = survey.comments_meta_data;
    const byStatus = [
        { label: 'New', value: pending, color: 'info' as const, status: CommentStatus.Pending },
        { label: 'Approved', value: approved, color: 'success' as const, status: CommentStatus.Approved },
        { label: 'Rejected', value: rejected, color: 'error' as const, status: CommentStatus.Rejected },
        {
            label: 'Needs Review',
            value: needs_further_review,
            color: 'warning' as const,
            status: CommentStatus.NeedsFurtherReview,
        },
    ];
    return (
        <Grid size={12}>
            <Grid container size={12} direction="row" justifyContent="flex-start" alignItems="flex-start" spacing={2}>
                <Grid size={12}>
                    <Grid component={Card} size={{ xs: 12, md: 8, lg: 6 }} sx={{ minWidth: '200px', flex: 1 }}>
                        <CardActionArea
                            LinkComponent={RouterLinkRenderer}
                            href={getPath(ROUTES.SURVEY_COMMENTS, { surveyId: survey.id })}
                        >
                            <CardContent sx={{}}>
                                <Grid container direction="row" justifyContent="space-between" alignItems="center">
                                    <Heading3 sx={{ fontSize: '2rem' }}>Total Responses</Heading3>
                                    <BodyText bold sx={{ fontSize: '3rem' }}>
                                        {total.toLocaleString() /* Format with commas */}
                                    </BodyText>
                                </Grid>
                            </CardContent>
                        </CardActionArea>
                    </Grid>
                </Grid>
                {byStatus.map((status) => (
                    <Grid
                        component={Card}
                        size={{ xs: 12, md: 6, lg: 3 }}
                        spacing={2}
                        key={status.label}
                        sx={{
                            minWidth: '200px',
                            flex: 1,
                            backgroundColor: (theme) => theme.palette[status.color].light,
                        }}
                    >
                        <CardActionArea
                            LinkComponent={RouterLinkRenderer}
                            href={getPath(ROUTES.SURVEY_COMMENTS, { surveyId: survey.id })}
                            onClick={(e) => {
                                e.preventDefault();
                                navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: survey.id }), {
                                    state: {
                                        status: status.status,
                                    },
                                });
                            }}
                        >
                            <CardContent sx={{ opacity: status.value === 0 ? 0.5 : 1 }}>
                                <Heading3>{status.label}</Heading3>
                                <BodyText bold sx={{ fontSize: '2rem' }}>
                                    {status.value.toLocaleString()}
                                </BodyText>
                            </CardContent>
                        </CardActionArea>
                    </Grid>
                ))}
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
