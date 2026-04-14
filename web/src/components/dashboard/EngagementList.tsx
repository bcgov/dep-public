import React, { useContext } from 'react';
import Grid from '@mui/material/Grid2';
import { ResponsiveContainer } from 'components/common/Layout';
import { Heading1, Heading3 } from 'components/common/Typography';
import { Accordion, AccordionDetails, AccordionSummary, accordionSummaryClasses, Skeleton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons/faChevronRight';
import EngagementAccordionContent from './AccordionContent';
import { SubmissionStatus } from 'constants/engagementStatus';
import { DashboardContext } from './DashboardContext';
import { Palette } from 'styles/Theme';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';

const EngagementList = () => {
    const { openEngagements, upcomingEngagements, closedEngagements, isLoading } = useContext(DashboardContext);

    const lastMonthDate = new Date(new Date().setDate(new Date().getDate() - 30));
    const recentlyClosedEngagements = closedEngagements.filter(
        (engagement) =>
            engagement.submission_status == SubmissionStatus.Closed && new Date(engagement.end_date) >= lastMonthDate,
    );
    const oldClosedEngagements = closedEngagements.filter(
        (engagement) =>
            engagement.submission_status == SubmissionStatus.Closed && new Date(engagement.end_date) < lastMonthDate,
    );

    const EngagementDashboardSkeleton = () => (
        <ResponsiveContainer
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            container
            columnSpacing={2}
            rowSpacing={3}
        >
            <Grid size={12}>
                <AutoBreadcrumbs />
            </Grid>
            <Grid size={12}>
                <Heading1 mt={0}>Engagements Dashboard</Heading1>
            </Grid>
            {[1, 3, 2, 4].map((n) => (
                <Grid key={n} size={12} sx={{ boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)', borderRadius: '1rem' }}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={n % 2 == 0 ? '3.5rem' : '10rem'}
                        sx={{ borderRadius: '1rem' }}
                    />
                </Grid>
            ))}
        </ResponsiveContainer>
    );

    const EngagementAccordion = ({
        children,
        ...props
    }: { children: React.ReactNode } & React.ComponentProps<typeof Accordion>) => (
        <Accordion
            elevation={0}
            {...props}
            sx={{
                boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid',
                borderColor: 'gray.50',
                borderRadius: '1rem !important',
                [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
                    transform: 'rotate(90deg)',
                },
                [`& .${accordionSummaryClasses.root}`]: {
                    display: 'flex',
                    columnGap: '0.5rem',
                },
            }}
        >
            {children}
        </Accordion>
    );

    if (isLoading) {
        return <EngagementDashboardSkeleton />;
    }

    return (
        <ResponsiveContainer
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            container
            columnSpacing={2}
            rowSpacing={3}
        >
            <Grid size={12}>
                <AutoBreadcrumbs />
            </Grid>
            <Grid size={12}>
                <Heading1 mt={0}>Engagements Dashboard</Heading1>
            </Grid>
            <Grid size={12}>
                <EngagementAccordion defaultExpanded={true}>
                    <AccordionSummary
                        expandIcon={<FontAwesomeIcon icon={faChevronRight} style={{ margin: '0 6px' }} />}
                        sx={{ flexDirection: 'row-reverse' }}
                    >
                        <Heading3 bold>Upcoming Engagements</Heading3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <EngagementAccordionContent
                            engagements={upcomingEngagements}
                            bgColor={Palette.dashboard.upcoming.bg}
                            borderColor={Palette.dashboard.upcoming.border}
                            disabled={true}
                        />
                    </AccordionDetails>
                </EngagementAccordion>
            </Grid>
            <Grid size={12}>
                <EngagementAccordion defaultExpanded={true}>
                    <AccordionSummary
                        expandIcon={<FontAwesomeIcon icon={faChevronRight} style={{ margin: '0 6px' }} />}
                        sx={{ flexDirection: 'row-reverse' }}
                    >
                        <Heading3 bold>Open Engagements</Heading3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <EngagementAccordionContent
                            engagements={openEngagements}
                            bgColor={Palette.dashboard.open.bg}
                            borderColor={Palette.dashboard.open.border}
                        />
                    </AccordionDetails>
                </EngagementAccordion>
            </Grid>
            <Grid size={12}>
                <EngagementAccordion>
                    <AccordionSummary
                        expandIcon={<FontAwesomeIcon icon={faChevronRight} style={{ margin: '0 6px' }} />}
                        sx={{ flexDirection: 'row-reverse' }}
                    >
                        <Heading3 bold>Recently Closed Engagements (last 30 days)</Heading3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <EngagementAccordionContent
                            engagements={recentlyClosedEngagements}
                            bgColor={Palette.dashboard.closed.bg}
                            borderColor={Palette.dashboard.closed.border}
                        />
                    </AccordionDetails>
                </EngagementAccordion>
            </Grid>
            <Grid size={12}>
                <EngagementAccordion>
                    <AccordionSummary
                        expandIcon={<FontAwesomeIcon icon={faChevronRight} style={{ margin: '0 6px' }} />}
                        sx={{ flexDirection: 'row-reverse' }}
                    >
                        <Heading3 bold>Closed Engagements (over 30 days ago)</Heading3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <EngagementAccordionContent
                            engagements={oldClosedEngagements}
                            bgColor={Palette.dashboard.closed.bg}
                            borderColor={Palette.dashboard.closed.border}
                        />
                    </AccordionDetails>
                </EngagementAccordion>
            </Grid>
        </ResponsiveContainer>
    );
};

export default EngagementList;
