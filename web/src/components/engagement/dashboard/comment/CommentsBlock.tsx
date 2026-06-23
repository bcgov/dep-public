import React, { useContext } from 'react';
import { Grid2 as Grid, Paper, Skeleton } from '@mui/material';
import { useLocation, useParams } from 'react-router';
import { Link } from 'components/common/Navigation';
import { Button } from 'components/common/Input/Button';
import { CommentViewContext } from './CommentViewContext';
import { Heading4 } from 'components/common/Typography/Headings';
import CommentTable from './CommentTable';
import { useAppTranslation } from 'hooks';
import { faFileChartPie } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ROUTES as R, getPath } from 'routes/routes';
import { AppConfig } from 'config';

interface CommentsBlockProps {
    dashboardType: string;
}

export const CommentsBlock: React.FC<CommentsBlockProps> = ({ dashboardType }) => {
    const { t: translate } = useAppTranslation();
    const { slug, language } = useParams();
    const location = useLocation();
    const { engagement, isEngagementLoading } = useContext(CommentViewContext);
    const isAdminPath = location.pathname === '/manage' || location.pathname.startsWith('/manage/');
    const publicEngagementLink = getPath(R.PUBLIC_ENGAGEMENT_BY_SLUG, {
        slug: slug ?? '',
        language: language ?? sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId,
    });
    const adminEngagementViewLink = getPath(R.ENGAGEMENT_DETAILS_AUTHORING, { engagementId: engagement?.id ?? '' });
    const engagementId = engagement?.id;
    const publicEngagementDashboardLink = getPath(R.PUBLIC_DASHBOARD_BY_SLUG, {
        slug: slug ?? '',
        dashboardType,
        language: language ?? sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId,
    });
    const engagementDashboardLink = getPath(R.ENGAGEMENT_DASHBOARD, {
        engagementId: engagementId ?? '',
        dashboardType,
    });
    const dashboardURL = isAdminPath ? engagementDashboardLink : publicEngagementDashboardLink;

    if (isEngagementLoading || !engagement) {
        return <Skeleton width="100%" height="40em" />;
    }

    return (
        <>
            <Grid size={12} container direction="row" justifyContent="flex-end" paddingBottom={'8px'}>
                <Link to={isAdminPath ? adminEngagementViewLink : publicEngagementLink} sx={{ color: 'text.link' }}>
                    {translate('commentDashboard.block.engagementLink')}
                </Link>
            </Grid>
            <Grid size={12}>
                <Paper elevation={1} sx={{ padding: '2em 2em 0 2em' }}>
                    <Grid container direction="row" justifyContent="flex-start" alignItems="flex-start" rowSpacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Heading4>{translate('commentDashboard.block.header')}</Heading4>
                        </Grid>
                        <Grid
                            size={{ xs: 12, sm: 6 }}
                            container
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="flex-end"
                        >
                            <Button
                                icon={<FontAwesomeIcon icon={faFileChartPie} />}
                                variant="primary"
                                size="small"
                                href={dashboardURL}
                            >
                                {translate('commentDashboard.block.buttonText')}
                            </Button>
                        </Grid>
                        <Grid size={12}>
                            <CommentTable />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </>
    );
};

export default CommentsBlock;
