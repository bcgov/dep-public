import React, { useContext, useEffect } from 'react';
import { Grid2 as Grid, useMediaQuery, Stack, Theme, Box, Backdrop, Paper, CircularProgress } from '@mui/material';
import { Link } from 'components/common/Navigation';
import { Button } from 'components/common/Input/Button';
import { useNavigate, useParams } from 'react-router';
import { BodyText, Heading1 } from 'components/common/Typography';
import { ReportBanner } from './ReportBanner';
import SurveysCompleted from './KPI/SurveysCompleted';
import ProjectLocation from './KPI/ProjectLocation';
import SurveyEmailsSent from './KPI/SurveyEmailsSent';
import SubmissionTrend from './SubmissionTrend/SubmissionTrend';
import { DashboardContext } from './DashboardContext';
import SurveyBar from './SurveyBar';
import SurveyBarPrintable from './SurveyBarPrintable';
import { generateDashboardPdf } from './util';
import { Map } from 'models/analytics/map';
import { When } from 'react-if';
import { useAppSelector, useAppTranslation } from 'hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faFileArrowDown } from '@fortawesome/pro-regular-svg-icons';
import { ROUTES, getPath } from 'routes/routes';
import { AppConfig } from 'config';

const Dashboard = () => {
    const { language, slug } = useParams();
    const { t: translate } = useAppTranslation();
    const isTablet = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { engagement, isEngagementLoading, dashboardType } = useContext(DashboardContext);
    const [isPrinting, setIsPrinting] = React.useState(false);
    const [projectMapData, setProjectMapData] = React.useState<Map | null>(null);
    const [pdfExportProgress, setPdfExportProgress] = React.useState(0);
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const engagementId = engagement?.id;
    const engagementAuthoringLink = getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId: engagementId ?? '' });
    const publicEngagementLink = getPath(ROUTES.PUBLIC_ENGAGEMENT_BY_SLUG, {
        slug: slug ?? '',
        language: language ?? sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId,
    });
    const commentViewPath = getPath(ROUTES.ENGAGEMENT_COMMENTS_DASHBOARD, {
        dashboardType,
        engagementId: engagementId ?? '',
    });
    const commentViewPublicPath = getPath(ROUTES.PUBLIC_COMMENTS_BY_SLUG, { dashboardType, slug: slug ?? '' });
    const mapExists = projectMapData?.latitude !== null && projectMapData?.longitude !== null;

    const handleProjectMapData = (data: Map) => {
        setProjectMapData(data);
    };

    const handleReadComments = () => {
        if (isLoggedIn) {
            if (!engagementId) return;
            navigate(commentViewPath);
        } else {
            navigate(commentViewPublicPath);
        }
    };

    const handlePdfExportProgress = (progress: number) => {
        setPdfExportProgress(progress);
    };

    const handleGenerateDashboardPdf = () => {
        generateDashboardPdf(projectMapData, handlePdfExportProgress)
            .then(() => {
                // Success callback
                setIsPrinting(false);
            })
            .catch((error) => {
                // Error handling
                console.error('Error generating dashboard PDF:', error);
            });
    };

    useEffect(() => {
        if (isPrinting) {
            handleGenerateDashboardPdf();
        }
    }, [isPrinting]);

    return (
        <>
            <Grid container direction="row" justifyContent="flex-start" alignItems="flex-start">
                <Grid size={12}>
                    <ReportBanner engagement={engagement} isLoading={isEngagementLoading} />
                </Grid>
                <Grid
                    container
                    size={12}
                    direction="row"
                    justifyContent={'flex-end'}
                    alignItems="flex-end"
                    m={{ lg: '1em 8em 2em 3em', sm: '2em', xs: '0.5em' }}
                >
                    <Grid container size={12} flexDirection="column">
                        <Grid size={12} container justifyContent="flex-end" paddingBottom={'8px'}>
                            <Link
                                to={isLoggedIn ? engagementAuthoringLink : publicEngagementLink}
                                data-testid="link-container"
                            >
                                {translate('dashboard.link.0')} {engagement.name} {translate('dashboard.link.1')}
                            </Link>
                        </Grid>
                        <Paper elevation={1} sx={{ padding: { md: '2em 2em 1em 2em', sm: '1em', xs: '0.5em' } }}>
                            <Grid
                                container
                                direction="row"
                                justifyContent="flex-start"
                                alignItems="flex-start"
                                rowSpacing={3}
                            >
                                <When condition={!isTablet}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Heading1 textAlign={{ xs: 'center', sm: 'left' }}>
                                            {translate('dashboard.header')}
                                        </Heading1>
                                    </Grid>
                                    <Grid
                                        size={{ xs: 12, sm: 6 }}
                                        container
                                        direction={{ xs: 'column', sm: 'row' }}
                                        justifyContent="flex-end"
                                    >
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                icon={<FontAwesomeIcon icon={faComments} />}
                                                variant="primary"
                                                size="small"
                                                data-testid="SurveyBlock/take-me-to-survey-button"
                                                onClick={handleReadComments}
                                                sx={{ minWidth: 'max-content' }}
                                            >
                                                {translate('dashboard.buttonText.readComments')}
                                            </Button>
                                            <Button
                                                icon={<FontAwesomeIcon icon={faFileArrowDown} />}
                                                size="small"
                                                onClick={() => {
                                                    setIsPrinting(true);
                                                }}
                                                loading={isPrinting}
                                                sx={{ minWidth: 'max-content' }}
                                            >
                                                {translate('dashboard.buttonText.exportToPDF')}
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </When>
                                <Grid
                                    container
                                    spacing={{ md: 0, lg: 3 }}
                                    rowSpacing={{ md: 1, lg: 3 }}
                                    size={12}
                                    ml={{ md: 0, lg: 2 }}
                                >
                                    <Grid
                                        id={'kpi'}
                                        container
                                        spacing={1}
                                        alignItems={'space-evenly'}
                                        justifyContent={'space-evenly'}
                                        size={12}
                                    >
                                        <When condition={isTablet}>
                                            <Grid container size={{ sm: 12 }}>
                                                <Grid
                                                    container
                                                    alignItems={'center'}
                                                    justifyContent={'center'}
                                                    size={12}
                                                    sx={{ mb: 1 }}
                                                >
                                                    <Heading1 bold>{engagement.name}</Heading1>
                                                </Grid>
                                                <Grid
                                                    container
                                                    alignItems={'center'}
                                                    justifyContent={'center'}
                                                    size={12}
                                                >
                                                    <Grid>
                                                        <BodyText sx={{ mr: 1 }}>
                                                            {translate('dashboard.submissionTrend.filter.from')}
                                                            {engagement.start_date}{' '}
                                                        </BodyText>
                                                    </Grid>
                                                    <Grid>
                                                        <BodyText>
                                                            {translate('dashboard.submissionTrend.filter.to')}
                                                            {engagement.end_date}
                                                        </BodyText>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </When>
                                        <Grid id={'kpi-emails-sent'} size={{ sm: mapExists ? 4 : 6 }}>
                                            <SurveyEmailsSent
                                                engagement={engagement}
                                                engagementIsLoading={isEngagementLoading}
                                            />
                                        </Grid>
                                        <Grid id={'kpi-surveys-completed'} size={{ sm: mapExists ? 4 : 6 }}>
                                            <SurveysCompleted
                                                engagement={engagement}
                                                engagementIsLoading={isEngagementLoading}
                                            />
                                        </Grid>
                                        <ProjectLocation
                                            engagement={engagement}
                                            engagementIsLoading={isEngagementLoading}
                                            handleProjectMapData={handleProjectMapData}
                                        />
                                    </Grid>
                                    <Grid id={'submissiontrend'} size={12}>
                                        <SubmissionTrend
                                            engagement={engagement}
                                            engagementIsLoading={isEngagementLoading}
                                        />
                                    </Grid>
                                    <Grid size={12}>
                                        <Box id={'surveybarprintable'} sx={{ display: isPrinting ? 'block' : 'none' }}>
                                            <SurveyBarPrintable
                                                engagement={engagement}
                                                engagementIsLoading={isEngagementLoading}
                                                dashboardType={dashboardType}
                                            />
                                        </Box>
                                        <SurveyBar
                                            readComments={handleReadComments}
                                            engagement={engagement}
                                            engagementIsLoading={isEngagementLoading}
                                            dashboardType={dashboardType}
                                        />
                                    </Grid>
                                    <When condition={isPrinting}>
                                        <Grid size={12}>
                                            <Box
                                                id={'printableMapContainer'}
                                                sx={{
                                                    height: '300px',
                                                    width: '300px',
                                                }}
                                            ></Box>
                                        </Grid>
                                    </When>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isPrinting}
                onExit={() => {
                    setPdfExportProgress(100);
                }}
                onExited={() => {
                    setPdfExportProgress(0);
                }}
            >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress color="inherit" value={pdfExportProgress} />
                    <Box
                        sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <BodyText color="inherit">{Math.round(pdfExportProgress)}%</BodyText>
                    </Box>
                </Box>
            </Backdrop>
        </>
    );
};

export default Dashboard;
