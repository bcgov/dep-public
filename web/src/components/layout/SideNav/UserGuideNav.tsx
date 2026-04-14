import React from 'react';
import { ListItemButton, ListItem } from '@mui/material';
import { useLocation } from 'react-router';
import { levenshteinDistance } from 'helper';
import { Palette } from 'styles/Theme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/pro-regular-svg-icons/faBookOpen';
import { routeItemStyle } from './SideNav';
import { ROUTES, getPath } from 'routes/routes';

const THRESHOLD_SIMILARITY_SCORE = 10;
const HELP_URL = 'https://bcgov.github.io/dep-guide';
const SAMPLE_IDS = {
    engagementId: 1,
    surveyId: 1,
    submissionId: 1,
    userId: 1,
    tenantShortName: 'aaa',
    slug: 'aaaa',
    languageId: 'en',
} as const;

const UserGuideNav = () => {
    const { pathname } = useLocation();

    const helpPaths: { [key: string]: string } = {
        [getPath(ROUTES.PUBLIC_LANDING)]: `${HELP_URL}/posts/home/`,
        [getPath(ROUTES.ENGAGEMENTS)]: `${HELP_URL}/posts/engagement-listing/`,
        [getPath(ROUTES.SURVEYS)]: `${HELP_URL}/posts/survey-listing/`,
        [getPath(ROUTES.SURVEY_CREATE)]: `${HELP_URL}/posts/create-survey/`,
        [getPath(ROUTES.SURVEY_BUILD, { surveyId: SAMPLE_IDS.surveyId })]: `${HELP_URL}/posts/survey-builder/`,
        [getPath(ROUTES.SURVEY_ADMIN_SUBMIT, { surveyId: SAMPLE_IDS.surveyId })]: `${HELP_URL}/posts/survey-builder/`,
        [getPath(ROUTES.SURVEY_COMMENTS, { surveyId: SAMPLE_IDS.surveyId })]: `${HELP_URL}/posts/comments-listing/`,
        [getPath(ROUTES.SURVEY_COMMENTS_ALL, { surveyId: SAMPLE_IDS.surveyId })]:
            `${HELP_URL}/posts/read-all-comments/`,
        [getPath(ROUTES.SURVEY_SUBMISSION_REVIEW, {
            surveyId: SAMPLE_IDS.surveyId,
            submissionId: SAMPLE_IDS.submissionId,
        })]: `${HELP_URL}/posts/comment-review-page/`,
        [getPath(ROUTES.ENGAGEMENT_CREATE_WIZARD)]: `${HELP_URL}/posts/create-engagement/`,
        [getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId: SAMPLE_IDS.engagementId })]:
            `${HELP_URL}/posts/engagement-details/`,
        [getPath(ROUTES.ADMIN_ENGAGEMENT_PREVIEW, { engagementId: SAMPLE_IDS.engagementId })]:
            `${HELP_URL}/posts/preview-engagement/`,
        [getPath(ROUTES.ENGAGEMENT_DETAILS_ACTIVITY, { engagementId: SAMPLE_IDS.engagementId })]:
            `${HELP_URL}/posts/preview-engagement/`,
        [getPath(ROUTES.PUBLIC_DASHBOARD_BY_SLUG, {
            slug: SAMPLE_IDS.slug,
            dashboardType: 'public',
            language: SAMPLE_IDS.languageId,
        })]: `${HELP_URL}/posts/report/`,
        [getPath(ROUTES.PUBLIC_DASHBOARD_BY_SLUG, {
            slug: SAMPLE_IDS.slug,
            dashboardType: 'internal',
            language: SAMPLE_IDS.languageId,
        })]: `${HELP_URL}/posts/report/`,
        [getPath(ROUTES.ENGAGEMENT_COMMENTS_DASHBOARD, {
            engagementId: SAMPLE_IDS.engagementId,
            dashboardType: 'public',
        })]: `${HELP_URL}/posts/report/`,
        [getPath(ROUTES.PUBLIC_DASHBOARD_BY_SLUG, {
            slug: SAMPLE_IDS.slug,
            dashboardType: 'internal',
            language: SAMPLE_IDS.languageId,
        })]: `${HELP_URL}/posts/report/`,
        [getPath(ROUTES.USER_MANAGEMENT)]: `${HELP_URL}/posts/user-management/`,
        [getPath(ROUTES.USER_DETAILS, { userId: SAMPLE_IDS.userId })]: `${HELP_URL}/posts/user-details/`,
        [getPath(ROUTES.TENANT_ADMIN)]: `${HELP_URL}/posts/tenant-admin/`,
        [getPath(ROUTES.TENANT_ADMIN_CREATE)]: `${HELP_URL}/posts/tenant-admin/#create-tenant`,
        [getPath(ROUTES.TENANT_ADMIN_DETAIL, { tenantShortName: SAMPLE_IDS.tenantShortName })]:
            `${HELP_URL}/posts/tenant-admin/#view-tenant-details`,
        [getPath(ROUTES.TENANT_ADMIN_EDIT, { tenantShortName: SAMPLE_IDS.tenantShortName })]:
            `${HELP_URL}/posts/tenant-details/#edit-tenant`,
    };

    const handleSimilarityScore = () => {
        let leastDifferenceScore = THRESHOLD_SIMILARITY_SCORE * 10;
        let keyWithLeastDifference = '';

        Object.keys(helpPaths).forEach((key) => {
            const differenceScore = levenshteinDistance(key, pathname);
            if (differenceScore < leastDifferenceScore) {
                leastDifferenceScore = differenceScore;
                keyWithLeastDifference = key;
            }
        });

        if (leastDifferenceScore < THRESHOLD_SIMILARITY_SCORE) {
            return keyWithLeastDifference;
        } else {
            return '';
        }
    };

    const currentHelpPage = React.useMemo(() => {
        const key = handleSimilarityScore();
        return key ? helpPaths[key] : HELP_URL;
    }, [pathname]);

    return (
        <ListItem key="user-guide" sx={routeItemStyle}>
            <ListItemButton
                component="a"
                href={currentHelpPage}
                target="_blank"
                rel="noopener noreferrer"
                disableRipple
                sx={{
                    '&:hover, &:active, &:focus': {
                        backgroundColor: 'transparent',
                    },
                    padding: 2,
                    pl: 4,
                }}
            >
                <FontAwesomeIcon
                    icon={faBookOpen}
                    style={{
                        fontSize: '1.1rem',
                        color: Palette.text.primary,
                        paddingRight: '0.75rem',
                        width: '1.1rem',
                    }}
                />
                <span
                    color={Palette.text.primary}
                    style={{
                        color: Palette.text.primary,
                        fontWeight: '500',
                        fontSize: '1rem',
                    }}
                >
                    User Guide
                </span>
            </ListItemButton>
        </ListItem>
    );
};

export default UserGuideNav;
