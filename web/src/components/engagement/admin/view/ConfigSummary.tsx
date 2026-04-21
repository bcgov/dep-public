import React, { Suspense, useEffect } from 'react';
import { Avatar, Grid2 as Grid, IconButton, Skeleton, Tooltip } from '@mui/material';
import { BodyText, Heading2 } from '../../../common/Typography';
import { OutlineBox } from 'components/common/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/pro-light-svg-icons';
import { globalFocusVisible } from 'components/common';
import { getBaseUrl } from 'helper';
import { Await, useParams, useRouteLoaderData } from 'react-router';
import { EngagementStatusChip } from 'components/common/Indicators';
import { SubmissionStatus } from 'constants/engagementStatus';
import dayjs from 'dayjs';
import { ENGAGEMENT_MEMBERSHIP_STATUS, EngagementTeamMember } from 'models/engagementTeamMember';
import { Button } from 'components/common/Input/Button';
import { faPen } from '@fortawesome/pro-regular-svg-icons';
import { LiveAnnouncer, LiveMessage } from 'react-aria-live';
import { EngagementLoaderAdminData } from '../EngagementLoaderAdmin';
import { getPath, ROUTES } from 'routes/routes';
import { LanguageState } from 'reduxSlices/languageSlice';
import { useAppSelector } from 'hooks';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';

export const ConfigSummary = () => {
    const siteUrl = getBaseUrl();
    const engagementId = useParams().engagementId;
    const language: LanguageState = useAppSelector((state) => state.language);
    const { engagement, teamMembers, slug } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const [tooltipOpen, setTooltipOpen] = React.useState(false);

    useEffect(() => {
        if (tooltipOpen) {
            const timer = setTimeout(() => {
                setTooltipOpen(false);
            }, 2000);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [tooltipOpen]);

    return (
        <Grid container direction="column" spacing={1}>
            <Heading2 decorated>Configuration</Heading2>
            <Grid container spacing={2} width="624px" maxWidth="100%" direction="column">
                <Grid>
                    <OutlineBox>
                        <Grid container spacing={1} direction="column">
                            <Grid>
                                <BodyText bold color="primary.main">
                                    Engagement URL
                                </BodyText>
                            </Grid>
                            <Grid container columnSpacing={1} alignItems="center">
                                <LiveAnnouncer>
                                    <LiveMessage aria-live="assertive" message={tooltipOpen ? 'Copied!' : ''} />
                                    <BodyText component="span" display="inline" alignItems="center">
                                        <Tooltip arrow open={tooltipOpen} title="Copied!" placement="top">
                                            <Suspense
                                                fallback={
                                                    <Skeleton
                                                        sx={{ display: 'inline-block', verticalAlign: 'middle', mr: 1 }}
                                                        variant="circular"
                                                        height="32px"
                                                        width="32px"
                                                    />
                                                }
                                            >
                                                <Await resolve={slug}>
                                                    {(slug: string) => (
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                mr: 1,
                                                                backgroundColor: 'primary.light',
                                                                color: 'white',
                                                                width: '32px',
                                                                height: '32px',
                                                                '&:hover': {
                                                                    backgroundColor: 'primary.main',
                                                                },
                                                                ...globalFocusVisible,
                                                                display: 'inline-block',
                                                            }}
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(
                                                                    `${siteUrl}${getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, { slug, language: language.id })}`,
                                                                );
                                                                setTooltipOpen(true);
                                                            }}
                                                            aria-label="Press enter to copy engagement URL to clipboard"
                                                        >
                                                            <FontAwesomeIcon
                                                                fontSize={16}
                                                                icon={faCopy}
                                                                style={{ position: 'relative', bottom: '4px' }}
                                                            />
                                                        </IconButton>
                                                    )}
                                                </Await>
                                            </Suspense>
                                        </Tooltip>
                                        <BodyText bold component="span">
                                            {siteUrl}/
                                        </BodyText>
                                        <Suspense
                                            fallback={
                                                <Skeleton
                                                    variant="text"
                                                    width="200px"
                                                    sx={{
                                                        display: 'inline-block',
                                                        lineHeight: '24px',
                                                        marginBottom: '-0.5rem',
                                                    }}
                                                >
                                                    <span>Loading...</span>
                                                </Skeleton>
                                            }
                                        >
                                            <Await resolve={slug}>
                                                {(slug: string) => {
                                                    const path = getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
                                                        slug,
                                                        language: language.id,
                                                    });
                                                    // remove leading slash from path if it exists to prevent double slashes in URL
                                                    const formattedPath = path.startsWith('/') ? path.slice(1) : path;
                                                    return formattedPath;
                                                }}
                                            </Await>
                                        </Suspense>
                                    </BodyText>
                                </LiveAnnouncer>
                            </Grid>
                        </Grid>
                    </OutlineBox>
                </Grid>
                <Grid>
                    <OutlineBox>
                        <Grid container direction="row" spacing={1}>
                            <Grid size={12}>
                                <BodyText bold color="primary.main">
                                    Engagement Feedback Dates
                                </BodyText>
                            </Grid>
                            <Grid size="auto" container direction="column" spacing={1}>
                                <Grid container spacing={1}>
                                    <Grid width={{ xs: '100%', sm: '82px' }}>
                                        <EngagementStatusChip
                                            statusId={SubmissionStatus.Open}
                                            sx={{ '&>span.MuiChip-label': { padding: '4px 12px' } }}
                                        />
                                    </Grid>
                                    <Grid>
                                        <BodyText bold sx={{ display: 'inline' }}>
                                            <Suspense
                                                fallback={
                                                    <Skeleton
                                                        variant="text"
                                                        sx={{ display: 'inline-block', marginBottom: '-0.5rem' }}
                                                        width={100}
                                                    />
                                                }
                                            >
                                                <Await resolve={engagement}>
                                                    {(engagement) =>
                                                        dayjs(engagement.start_date).format('MMMM D, YYYY')
                                                    }
                                                </Await>
                                            </Suspense>
                                        </BodyText>{' '}
                                        <BodyText sx={{ display: { xs: 'block', sm: 'inline' } }}>(12:01 am)</BodyText>
                                    </Grid>
                                </Grid>
                                <Grid container spacing={1}>
                                    <Grid width={{ xs: '100%', sm: '82px' }}>
                                        <EngagementStatusChip
                                            statusId={SubmissionStatus.Closed}
                                            sx={{ '&>span.MuiChip-label': { padding: '4px 12px' } }}
                                        />
                                    </Grid>
                                    <Grid>
                                        <BodyText bold sx={{ display: 'inline' }}>
                                            <Suspense
                                                fallback={
                                                    <Skeleton
                                                        variant="text"
                                                        sx={{ display: 'inline-block', marginBottom: '-0.5rem' }}
                                                        width={100}
                                                    />
                                                }
                                            >
                                                <Await resolve={engagement}>
                                                    {(engagement) => dayjs(engagement.end_date).format('MMMM D, YYYY')}
                                                </Await>
                                            </Suspense>
                                        </BodyText>{' '}
                                        <BodyText sx={{ display: { xs: 'block', sm: 'inline' } }}>(11:59 pm)</BodyText>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid
                                size={12}
                                container
                                sx={{
                                    width: '100%',
                                    mt: { xs: 1, sm: 0 },
                                    maxWidth: { xs: '100%', sm: 'fit-content' },
                                }}
                            >
                                <Grid container size={12} color="primary.light" direction="row" spacing="4px">
                                    <Grid>
                                        <BodyText bold fontSize="72px" lineHeight="64px" color="inherit">
                                            <Suspense fallback={<Skeleton variant="text" width={85}></Skeleton>}>
                                                <Await resolve={engagement}>
                                                    {(engagement) =>
                                                        dayjs(engagement.end_date)
                                                            .clone()
                                                            .add(1, 'second')
                                                            .diff(dayjs(engagement.start_date), 'days')
                                                    }
                                                </Await>
                                            </Suspense>
                                        </BodyText>
                                    </Grid>
                                    <Grid container alignItems="center">
                                        <BodyText display="inline" color="inherit" bold fontSize="24px">
                                            days
                                        </BodyText>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </OutlineBox>
                </Grid>
                <Grid>
                    <OutlineBox>
                        <Grid container direction="column" spacing={1}>
                            <Grid>
                                <BodyText bold color="primary.main">
                                    Language(s) Included (1)
                                </BodyText>
                            </Grid>
                            <Grid>
                                <BodyText bold>English (Default)</BodyText>
                            </Grid>
                        </Grid>
                    </OutlineBox>
                </Grid>
                <Grid>
                    <OutlineBox>
                        <Grid container direction="column" spacing={1}>
                            <Grid>
                                <BodyText bold color="primary.main">
                                    Team Member(s) Added
                                </BodyText>
                            </Grid>
                            <Suspense fallback={<TeamMemberListSkeleton />}>
                                <Await resolve={teamMembers}>
                                    {(resolvedTeamMembers) => <TeamMemberList teamMembers={resolvedTeamMembers} />}
                                </Await>
                            </Suspense>
                        </Grid>
                    </OutlineBox>
                </Grid>
                <Grid pt={3}>
                    <Button
                        href={getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG_EDIT, { engagementId: Number(engagementId) })}
                        LinkComponent={RouterLinkRenderer}
                        icon={<FontAwesomeIcon icon={faPen} />}
                    >
                        Edit Configuration
                    </Button>
                </Grid>
            </Grid>
        </Grid>
    );
};

const TeamMemberList = ({ teamMembers }: { teamMembers: EngagementTeamMember[] }) => {
    const activeTeamMembers = teamMembers.filter(
        (teamMember) => teamMember.status === ENGAGEMENT_MEMBERSHIP_STATUS.Active,
    );
    if (!activeTeamMembers.length) {
        return (
            <Grid>
                <BodyText>No team members added</BodyText>
            </Grid>
        );
    }
    return (
        <>
            {activeTeamMembers.map((teamMember) => (
                <Grid container spacing={2} alignItems="center" key={teamMember.id}>
                    <Grid>
                        <Avatar
                            sx={{
                                backgroundColor: 'primary.light',
                                height: 32,
                                width: 32,
                                fontSize: '16px',
                            }}
                        >
                            {teamMember.user.first_name[0]}
                            {teamMember.user.last_name[0]}
                        </Avatar>
                    </Grid>
                    <Grid>
                        <BodyText>
                            {teamMember.user.first_name} {teamMember.user.last_name}
                        </BodyText>
                        <BodyText>{teamMember.user.main_role}</BodyText>
                    </Grid>
                </Grid>
            ))}
        </>
    );
};

export default ConfigSummary;

const TeamMemberListSkeleton = () => {
    return (
        <>
            {[1, 2, 3].map((value) => (
                <Grid container spacing={2} alignItems="center" key={value}>
                    <Grid>
                        <Skeleton variant="circular" width={32} height={32} />
                    </Grid>
                    <Grid>
                        <Skeleton variant="text" width={100} />
                    </Grid>
                </Grid>
            ))}
        </>
    );
};
