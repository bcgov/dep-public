import React, { useState, useContext } from 'react';
import CustomTable from 'components/common/Table';
import Grid from '@mui/material/Grid2';
import { useLocation } from 'react-router';
import { ResponsiveContainer } from 'components/common/Layout';
import { HeadCell, PaginationOptions } from 'components/common/Table/types';
import { formatDate } from 'components/common/dateHelper';
import { Collapse, Link } from '@mui/material';
import TextField from '@mui/material/TextField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlass';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import Stack from '@mui/material/Stack';
import { SurveySubmission } from 'models/surveySubmission';
import { COMMENTS_STATUS, CommentStatus } from 'constants/commentStatus';
import { AdvancedSearch } from './AdvancedSearch';
import { CommentListingContext } from './CommentListingContext';
import { useAppSelector } from 'hooks';
import { USER_ROLES } from 'services/userService/constants';
import { USER_COMPOSITE_ROLE } from 'models/user';
import { Heading1 } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { ROUTES, getPath } from 'routes/routes';

const Submissions = () => {
    const {
        searchFilter,
        setSearchFilter,
        searchText,
        setSearchText,
        survey,
        submissions,
        paginationOptions,
        setPagination,
        pageInfo,
        loading,
    } = useContext(CommentListingContext);
    const { roles, userDetail, assignedEngagements } = useAppSelector((state) => state.user);
    const { state } = useLocation();
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(Boolean(state));

    const handleSearchBarClick = (filter: string) => {
        setSearchFilter({
            ...searchFilter,
            value: filter,
        });
    };

    const headCells: HeadCell<SurveySubmission>[] = [
        {
            key: 'id',
            nestedSortKey: 'submission.id',
            numeric: true,
            disablePadding: false,
            label: 'ID',
            allowSort: true,
            renderCell: (row) => {
                if (
                    roles.includes(USER_ROLES.REVIEW_COMMENTS) ||
                    (assignedEngagements.includes(Number(survey.engagement_id)) &&
                        userDetail.composite_roles?.includes('/' + USER_COMPOSITE_ROLE.TEAM_MEMBER.value))
                ) {
                    return (
                        <Link
                            component={RouterLinkRenderer}
                            href={getPath(ROUTES.SURVEY_SUBMISSION_REVIEW, {
                                surveyId: Number(row.survey_id),
                                submissionId: row.id,
                            })}
                        >
                            {row.id}
                        </Link>
                    );
                }
                return row.id;
            },
        },
        {
            key: 'created_date',
            numeric: true,
            disablePadding: false,
            label: 'Comment Date',
            allowSort: true,
            renderCell: (row) => formatDate(row.created_date || ''),
        },
        {
            key: 'reviewed_by',
            numeric: true,
            disablePadding: false,
            label: 'Reviewed By',
            allowSort: true,
            renderCell: (row) => row.reviewed_by,
        },
        {
            key: 'review_date',
            numeric: true,
            disablePadding: false,
            label: 'Date Reviewed',
            allowSort: true,
            renderCell: (row) => formatDate(row.review_date || ''),
        },
        {
            key: 'comment_status_id',
            numeric: false,
            disablePadding: true,
            label: 'Status',
            allowSort: true,
            renderCell: (row) => COMMENTS_STATUS[row.comment_status_id as CommentStatus] || '',
        },
    ];

    return (
        <ResponsiveContainer
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            container
            rowSpacing={1}
        >
            <Grid size={12}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} width="100%" justifyContent="space-between">
                    <Stack direction="row" spacing={1}>
                        <TextField
                            id="comments"
                            variant="outlined"
                            label="Search Comments"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            size="small"
                        />
                        <Button
                            size="small"
                            data-testid="CommentListing/search-button"
                            onClick={() => handleSearchBarClick(searchText)}
                            variant="primary"
                        >
                            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '20px' }} />
                        </Button>
                        <Button
                            size="small"
                            data-testid="comment-listing/advanced-search-button"
                            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                            icon={
                                <FontAwesomeIcon
                                    icon={faChevronDown}
                                    style={{
                                        fontSize: '12px',
                                        transition: 'transform 0.3s ease',
                                        transform: isAdvancedSearchOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    }}
                                />
                            }
                        >
                            Advanced Search
                        </Button>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            variant="primary"
                            component={RouterLinkRenderer}
                            href={getPath(ROUTES.SURVEY_COMMENTS_ALL, { surveyId: survey.id })}
                        >
                            Read All Comments
                        </Button>
                    </Stack>
                </Stack>
            </Grid>

            <Grid size={12}>
                <Collapse in={isAdvancedSearchOpen}>
                    <AdvancedSearch />
                </Collapse>
            </Grid>

            <Grid size={12}>
                <Heading1>
                    <strong>{`${survey.name} Comments`}</strong>
                </Heading1>
                <CustomTable
                    headCells={headCells}
                    rows={submissions}
                    handleChangePagination={(pagination: PaginationOptions<SurveySubmission>) =>
                        setPagination(pagination)
                    }
                    paginationOptions={paginationOptions}
                    pageInfo={pageInfo}
                    loading={loading}
                />
            </Grid>
        </ResponsiveContainer>
    );
};

export default Submissions;
