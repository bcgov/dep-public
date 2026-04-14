import React, { useContext, useState } from 'react';
import CustomTable from 'components/common/Table';
import Grid from '@mui/material/Grid2';
import { useNavigate } from 'react-router';
import { ResponsiveContainer } from 'components/common/Layout';
import { Survey } from 'models/survey';
import { HeadCell, PaginationOptions } from 'components/common/Table/types';
import { formatDate } from 'components/common/dateHelper';
import { Collapse, Link, Theme, Tooltip, useMediaQuery } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlass';
import { faCircleExclamation } from '@fortawesome/pro-regular-svg-icons/faCircleExclamation';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { faCommentsQuestionCheck } from '@fortawesome/pro-regular-svg-icons/faCommentsQuestionCheck';
import { faEyeSlash } from '@fortawesome/pro-solid-svg-icons/faEyeSlash';
import { faCheck as regularCheck } from '@fortawesome/pro-regular-svg-icons/faCheck';
import { faCheck as solidCheck } from '@fortawesome/pro-solid-svg-icons/faCheck';
import { faLinkSimple } from '@fortawesome/pro-regular-svg-icons/faLinkSimple';
import { faObjectsColumn } from '@fortawesome/pro-solid-svg-icons/faObjectsColumn';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import Stack from '@mui/material/Stack';
import { useAppSelector } from 'hooks';
import { SubmissionStatus } from 'constants/engagementStatus';
import { ApprovedIcon, NewIcon, NFRIcon, RejectedIcon } from 'components/engagement/listing/Icons';
import { PermissionsGate } from 'components/permissionsGate';
import { CommentStatus } from 'constants/commentStatus';
import { ActionsDropDown } from './ActionsDropDown';
import { Palette } from 'styles/Theme';
import { AdvancedSearch } from './AdvancedSearch';
import { SurveyListingContext } from './SurveyListingContext';
import { USER_ROLES } from 'services/userService/constants';
import { Button, TextInput } from 'components/common/Input';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ROUTES, getPath } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
// Prevents page load fail due to waiting for engagement title on refresh
const AutoBreadcrumbs = React.lazy(() =>
    import('components/common/Navigation/Breadcrumb').then((m) => ({ default: m.AutoBreadcrumbs })),
);

const Surveys = () => {
    const {
        paginationOptions,
        setPaginationOptions,
        setSearchFilter,
        pageInfo,
        tableLoading,
        surveys,
        searchText,
        setSearchText,
        searchFilter,
        loadSurveys,
    } = useContext(SurveyListingContext);
    const navigate = useNavigate();

    const isMediumScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

    const { roles, assignedEngagements } = useAppSelector((state) => state.user);

    const canViewPrivateEngagements = roles.includes(USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS);

    const canViewAllCommentStatus = roles.includes(USER_ROLES.SHOW_ALL_COMMENT_STATUS);

    const submissionHasBeenOpened = (survey: Survey) => {
        return (
            !!survey.engagement &&
            [SubmissionStatus.Open, SubmissionStatus.Closed].includes(survey.engagement.submission_status)
        );
    };

    const handleSearchBarClick = (surveyNameFilter: string) => {
        setSearchFilter({
            ...searchFilter,
            value: surveyNameFilter,
        });
    };

    const headCells: HeadCell<Survey>[] = [
        {
            key: 'name',
            nestedSortKey: 'survey.name',
            numeric: false,
            disablePadding: true,
            label: 'Survey Name',
            allowSort: true,
            renderCell: (row: Survey) => (
                <Link
                    component={RouterLinkRenderer}
                    href={getPath(ROUTES.SURVEY_ADMIN_SUBMIT, { surveyId: Number(row.id) })}
                >
                    {row.name}
                </Link>
            ),
        },
        {
            key: 'created_date',
            nestedSortKey: 'survey.created_date',
            numeric: true,
            disablePadding: false,
            label: 'Date Created',
            allowSort: true,
            renderCell: (row: Survey) => formatDate(row.created_date),
        },
        {
            key: 'engagement',
            nestedSortKey: 'engagement.published_date',
            numeric: true,
            disablePadding: false,
            label: 'Date Published',
            allowSort: true,
            renderCell: (row: Survey) => formatDate(row.engagement?.published_date ?? ''),
        },
        {
            key: 'engagement',
            nestedSortKey: 'engagement.status_id',
            numeric: true,
            disablePadding: false,
            label: 'Status',
            allowSort: true,
            renderCell: (row: Survey) => {
                if (row.is_hidden) {
                    return (
                        <Tooltip
                            title={
                                <>
                                    <strong>Hidden</strong>
                                    <p>
                                        This survey is only visible to Administrators. Disable this setting to have it
                                        visible to team members and viewers.
                                    </p>
                                </>
                            }
                            placement="right"
                            arrow
                        >
                            <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: '20px' }} />
                        </Tooltip>
                    );
                }

                if (row.is_template) {
                    return (
                        <Tooltip
                            title={
                                <>
                                    <strong>Template</strong>
                                    <p>Templates can be cloned and then edited.</p>
                                </>
                            }
                            placement="right"
                            arrow
                        >
                            <FontAwesomeIcon icon={faObjectsColumn} style={{ fontSize: '22px' }} />
                        </Tooltip>
                    );
                }

                if (row.engagement_id) {
                    return (
                        <Tooltip
                            title={
                                <>
                                    <strong>Linked</strong>
                                    <p>
                                        This survey is attached to an engagement. It can still be cloned and then
                                        edited.
                                    </p>
                                </>
                            }
                            placement="right"
                            arrow
                        >
                            <FontAwesomeIcon icon={faLinkSimple} style={{ fontSize: '20px' }} />
                        </Tooltip>
                    );
                }

                return (
                    <Tooltip
                        title={
                            <>
                                <strong>Ready</strong>
                                <p>This survey is ready to be cloned or attached to an engagement.</p>
                            </>
                        }
                        placement="right"
                        arrow
                    >
                        <FontAwesomeIcon
                            icon={solidCheck}
                            style={{ fontSize: '20px', color: Palette.icons.surveyReady }}
                        />
                    </Tooltip>
                );
            },
        },
        {
            key: 'engagement',
            nestedSortKey: 'engagement.name',
            numeric: true,
            disablePadding: false,
            label: 'Engagement Name',
            allowSort: true,
            renderCell: (row: Survey) => {
                if (!row.engagement) {
                    return <></>;
                }

                return (
                    <Link
                        component={RouterLinkRenderer}
                        href={getPath(ROUTES.ENGAGEMENT, { engagementId: row.engagement.id })}
                    >
                        {row.engagement.name}
                    </Link>
                );
            },
        },
        {
            key: 'comments_meta_data',
            numeric: true,
            disablePadding: false,
            label: '',
            customStyle: { padding: 2 },
            hideSorticon: true,
            align: 'left',
            icon: (
                <ApprovedIcon>
                    <FontAwesomeIcon icon={regularCheck} style={{ fontSize: '20px' }} />
                </ApprovedIcon>
            ),
            allowSort: false,
            renderCell: (row: Survey) => {
                if (!submissionHasBeenOpened(row)) {
                    return <></>;
                }
                const { approved } = row.comments_meta_data;
                return (
                    <Tooltip title={'Approved'} disableInteractive placement="right" arrow>
                        <span>
                            <ApprovedIcon
                                onClick={() => {
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.id }), {
                                        state: {
                                            status: CommentStatus.Approved,
                                        },
                                    });
                                }}
                            >
                                {approved || 0}
                            </ApprovedIcon>
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            key: 'comments_meta_data',
            numeric: true,
            disablePadding: false,
            label: '',

            customStyle: { padding: 2 },
            hideSorticon: true,
            align: 'left',
            icon: (
                <NFRIcon>
                    <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: '20px' }} />
                </NFRIcon>
            ),
            allowSort: false,
            renderCell: (row: Survey) => {
                if (
                    !submissionHasBeenOpened(row) ||
                    (!canViewPrivateEngagements && !assignedEngagements.includes(Number(row.engagement_id))) ||
                    !canViewAllCommentStatus
                ) {
                    return <></>;
                }
                const { needs_further_review } = row.comments_meta_data;
                return (
                    <Tooltip disableInteractive title={'Need further review'} placement="right" arrow>
                        <span>
                            <NFRIcon
                                onClick={() => {
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.id }), {
                                        state: {
                                            status: CommentStatus.NeedsFurtherReview,
                                        },
                                    });
                                }}
                            >
                                {needs_further_review || 0}
                            </NFRIcon>
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            key: 'comments_meta_data',
            numeric: true,
            disablePadding: false,
            label: '',

            customStyle: { padding: 2 },
            hideSorticon: true,
            align: 'left',
            icon: (
                <RejectedIcon>
                    <FontAwesomeIcon icon={faXmark} style={{ fontSize: '20px' }} />
                </RejectedIcon>
            ),
            allowSort: false,
            renderCell: (row: Survey) => {
                if (
                    !submissionHasBeenOpened(row) ||
                    (!canViewPrivateEngagements && !assignedEngagements.includes(Number(row.engagement_id))) ||
                    !canViewAllCommentStatus
                ) {
                    return <></>;
                }
                const { rejected } = row.comments_meta_data;
                return (
                    <Tooltip disableInteractive title={'Rejected'} placement="right" arrow>
                        <span>
                            <RejectedIcon
                                onClick={() => {
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.id }), {
                                        state: {
                                            status: CommentStatus.Rejected,
                                        },
                                    });
                                }}
                            >
                                {rejected || 0}
                            </RejectedIcon>
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            key: 'comments_meta_data',
            numeric: true,
            disablePadding: false,
            label: '',

            customStyle: { padding: 2 },
            hideSorticon: true,
            align: 'left',
            icon: (
                <NewIcon>
                    <FontAwesomeIcon icon={faCommentsQuestionCheck} style={{ fontSize: '20px' }} />
                </NewIcon>
            ),
            allowSort: false,
            renderCell: (row: Survey) => {
                if (
                    !submissionHasBeenOpened(row) ||
                    (!canViewPrivateEngagements && !assignedEngagements.includes(Number(row.engagement_id))) ||
                    !canViewAllCommentStatus
                ) {
                    return <></>;
                }
                const { pending } = row.comments_meta_data;
                return (
                    <Tooltip disableInteractive title={'New comments'} placement="right" arrow>
                        <span>
                            <NewIcon
                                onClick={() => {
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.id }), {
                                        state: {
                                            status: CommentStatus.Pending,
                                        },
                                    });
                                }}
                            >
                                {pending || 0}
                            </NewIcon>
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            key: 'id',
            numeric: true,
            disablePadding: false,
            label: 'Actions',
            allowSort: false,
            renderCell: (row: Survey) => {
                return <ActionsDropDown survey={row} loadSurveys={loadSurveys} />;
            },
            customStyle: {
                minWidth: '200px',
            },
        },
    ];

    return (
        <ResponsiveContainer
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            container
            columnSpacing={2}
            rowSpacing={1}
        >
            <Grid size={12}>
                <AutoBreadcrumbs />
            </Grid>
            <Grid size={12}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} width="100%" justifyContent="space-between">
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} width={{ xs: '100%', md: 'auto' }}>
                            <TextInput
                                id="survey-name"
                                inputProps={{ 'aria-label': 'Search by name' }}
                                placeholder="Search by name"
                                fullWidth
                                name="searchText"
                                value={searchText}
                                sx={{ height: '40px', pr: 0, minWidth: '13em' }}
                                onChange={(text) => setSearchText(text)}
                                size="small"
                                endAdornment={
                                    <Button
                                        variant="primary"
                                        size="small"
                                        data-testid="survey/listing/search-button"
                                        onClick={() => handleSearchBarClick(searchText)}
                                        sx={{ m: 0, borderRadius: '0px 8px 8px 0px' }}
                                    >
                                        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '20px' }} />
                                    </Button>
                                }
                            />
                        </Stack>
                        <Button
                            size="small"
                            data-testid="survey-listing/advanced-search-button"
                            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                            sx={{ minWidth: 'max-content' }}
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
                            fullWidth={isMediumScreen ? true : false}
                        >
                            Advanced Search
                        </Button>
                    </Stack>
                    <PermissionsGate scopes={[USER_ROLES.CREATE_SURVEY]} errorProps={{ disabled: true }}>
                        <Button
                            variant="primary"
                            size="small"
                            sx={{ minWidth: 'max-content' }}
                            type="button"
                            icon={<FontAwesomeIcon icon={faPlus} />}
                            LinkComponent={RouterLinkRenderer}
                            href={getPath(ROUTES.SURVEY_CREATE)}
                        >
                            Create Survey
                        </Button>
                    </PermissionsGate>
                </Stack>
            </Grid>

            <Grid size={12}>
                <Collapse in={isAdvancedSearchOpen}>
                    <AdvancedSearch />
                </Collapse>
            </Grid>

            <Grid size={12}>
                <CustomTable
                    headCells={headCells}
                    rows={surveys}
                    handleChangePagination={(paginationOptions: PaginationOptions<Survey>) =>
                        setPaginationOptions(paginationOptions)
                    }
                    paginationOptions={paginationOptions}
                    loading={tableLoading}
                    pageInfo={pageInfo}
                />
            </Grid>
        </ResponsiveContainer>
    );
};

export default Surveys;
