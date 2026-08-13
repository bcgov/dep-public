import React, { useState, useContext } from 'react';
import CustomTable from 'components/common/Table';
import Grid from '@mui/material/Grid2';
import { useLocation, useParams } from 'react-router';
import { HeadCell, PaginationOptions } from 'components/common/Table/types';
import { formatToPacific } from 'components/common/dateHelper';
import { Collapse, Link, Theme, useMediaQuery } from '@mui/material';
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
import { TextInput } from 'components/common/Input';

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
    const { surveyId } = useParams();
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(Boolean(state));
    const isMediumScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

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
                                surveyId: Number(surveyId),
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
            renderCell: (row) => formatToPacific(row.created_date || '', 'YYYY-MM-DD'),
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
            renderCell: (row) => formatToPacific(row.review_date || '', 'YYYY-MM-DD'),
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
        <Grid
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            container
            columnSpacing={2}
            rowSpacing={1}
            size={12}
        >
            <Grid size={12}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    width="100%"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center" width="100%">
                        <TextInput
                            title=""
                            inputProps={{ 'aria-label': 'Search comments' }}
                            sx={{ height: '40px', pr: 0, minWidth: '13em' }}
                            placeholder="Search comments"
                            fullWidth={isMediumScreen}
                            value={searchText}
                            onChange={(text) => setSearchText(text)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearchBarClick(searchText);
                                }
                            }}
                            endAdornment={
                                <Button
                                    variant="primary"
                                    size="small"
                                    onClick={() => handleSearchBarClick(searchText)}
                                    sx={{ m: 0, borderRadius: '0px 8px 8px 0px' }}
                                >
                                    <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '20px' }} />
                                </Button>
                            }
                        />
                        <Button
                            size="small"
                            sx={{ minWidth: 'max-content' }}
                            data-testid="comment-listing/advanced-search-button"
                            name="advancedSearch"
                            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                            fullWidth={isMediumScreen}
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
                    <Button
                        size="small"
                        variant="primary"
                        component={RouterLinkRenderer}
                        href={surveyId ? getPath(ROUTES.SURVEY_COMMENTS_ALL, { surveyId }) : '#'}
                        sx={{ minWidth: 'max-content' }}
                        fullWidth={isMediumScreen}
                    >
                        Read All Comments
                    </Button>
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
        </Grid>
    );
};

export default Submissions;
