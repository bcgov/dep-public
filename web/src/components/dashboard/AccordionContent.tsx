import React, { useState } from 'react';
import Grid from '@mui/material/Grid2';
import { BodyText } from 'components/common/Typography/Body';
import { Accordion, AccordionDetails, AccordionSummary, useMediaQuery, Theme } from '@mui/material';
import { Engagement } from 'models/engagement';
import { When } from 'react-if';
import SurveyEmailsSent from '../publicDashboard/KPI/SurveyEmailsSent';
import SurveysCompleted from '../publicDashboard/KPI/SurveysCompleted';
import ProjectLocation from '../publicDashboard/KPI/ProjectLocation';
import SubmissionTrend from '../publicDashboard/SubmissionTrend/SubmissionTrend';
import SurveyBar from '../publicDashboard/SurveyBar';
import { DashboardType } from 'constants/dashboardType';
import { Map } from 'models/analytics/map';

const EngagementAccordionContent = ({
    engagements,
    bgColor,
    borderColor,
    disabled,
}: {
    engagements: Engagement[];
    bgColor: string;
    borderColor: string;
    disabled?: boolean;
}) => {
    const [openedEngagements, setOpenedEngagements] = useState<number[]>([]);
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('xs'));
    const [projectMapData, setProjectMapData] = React.useState<Map | null>(null);
    const mapExists = projectMapData?.latitude !== null && projectMapData?.longitude !== null;

    if (engagements.length == 0) {
        return (
            <Grid size={12}>
                <BodyText bold>No Engagements Found</BodyText>
            </Grid>
        );
    }

    const handleChange = (engagementId: number) => {
        if (!openedEngagements.some((id) => id == engagementId)) {
            setOpenedEngagements([...openedEngagements, engagementId]);
        } else {
            setOpenedEngagements(openedEngagements.filter((id) => id != engagementId));
        }
    };

    const handleProjectMapData = (data: Map) => {
        setProjectMapData(data);
    };

    const isExpanded = (engagementId: number) => openedEngagements.some((id) => id == engagementId);

    return (
        <>
            {engagements.map((engagement) => {
                return (
                    <Accordion
                        disabled={disabled}
                        onChange={() => {
                            handleChange(engagement.id);
                        }}
                        key={engagement.id}
                        sx={{
                            mt: 1,
                            borderStyle: 'solid',
                            borderColor: borderColor,
                            boxShadow: 'none',
                            '&.Mui-disabled': {
                                background: 'initial',
                            },
                            overflow: 'clip',
                        }}
                    >
                        <AccordionSummary
                            data-testid={`engagement-accordion-${engagement.id}`}
                            sx={{
                                '&.Mui-disabled': {
                                    opacity: 1,
                                },

                                backgroundColor: bgColor,
                            }}
                        >
                            <Grid container size={12} direction={isMobile ? 'column' : 'row'}>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <BodyText bold>{engagement.name}</BodyText>
                                </Grid>
                                <Grid size={{ xs: 12, md: 'grow' }} textAlign="right">
                                    <BodyText>
                                        {engagement.start_date}
                                        {' - '}
                                        {engagement.end_date}
                                    </BodyText>
                                </Grid>
                            </Grid>
                        </AccordionSummary>
                        <AccordionDetails sx={{ borderTop: `2px solid ${borderColor}` }}>
                            <When condition={isExpanded(engagement.id)}>
                                <Grid container size={12} spacing={3} data-testid={`dashboard-frame-${engagement.id}`}>
                                    <Grid size={{ xs: 12, sm: mapExists ? 4 : 6 }}>
                                        <SurveyEmailsSent engagement={engagement} engagementIsLoading={false} />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: mapExists ? 4 : 6 }}>
                                        <SurveysCompleted engagement={engagement} engagementIsLoading={false} />
                                    </Grid>
                                    <ProjectLocation
                                        engagement={engagement}
                                        engagementIsLoading={false}
                                        handleProjectMapData={handleProjectMapData}
                                    />
                                </Grid>
                                <Grid size={12} mt={2}>
                                    <SubmissionTrend engagement={engagement} engagementIsLoading={false} />
                                </Grid>
                                <Grid size={12} mt={2}>
                                    <SurveyBar
                                        engagement={engagement}
                                        engagementIsLoading={false}
                                        dashboardType={DashboardType.PUBLIC}
                                    />
                                </Grid>
                            </When>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </>
    );
};

export default EngagementAccordionContent;
