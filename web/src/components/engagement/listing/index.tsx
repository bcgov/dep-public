import React, { useState, useEffect } from 'react';
import { When } from 'react-if';
import Grid from '@mui/material/Grid2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlass';
import { faMessageCheck } from '@fortawesome/pro-solid-svg-icons/faMessageCheck';
import { faCheck } from '@fortawesome/pro-regular-svg-icons/faCheck';
import { faCircleExclamation } from '@fortawesome/pro-regular-svg-icons/faCircleExclamation';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { faCommentsQuestionCheck } from '@fortawesome/pro-regular-svg-icons/faCommentsQuestionCheck';
import Collapse from '@mui/material/Collapse';
import { useNavigate, useFetcher, createSearchParams, useSearchParams } from 'react-router';
import { ResponsiveContainer } from 'components/common/Layout';
import { Engagement } from 'models/engagement';
import { useAppSelector } from 'hooks';
import { createDefaultPageInfo, HeadCell, PageInfo, PaginationOptions } from 'components/common/Table/types';
import { formatDate } from 'components/common/dateHelper';
import { Link, useMediaQuery, Theme, Tooltip } from '@mui/material';
import Stack from '@mui/material/Stack';
import CustomTable from 'components/common/Table';
import { EngagementStatus, SubmissionStatus } from 'constants/engagementStatus';
import { SearchOptions } from './AdvancedSearch/SearchTypes';
import { PermissionsGate } from 'components/permissionsGate';
import { USER_ROLES } from 'services/userService/constants';
import { ApprovedIcon, NewIcon, NFRIcon, RejectedIcon } from './Icons';
import { CommentStatus } from 'constants/commentStatus';
import { ActionsDropDown } from './ActionsDropDown';
import AdvancedSearch from './AdvancedSearch/SearchComponent';
import { Button, TextInput } from 'components/common/Input';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { EngagementListLoaderData } from 'engagements/public/view/EngagementListLoader';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { ROUTES, getPath } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';

interface SearchFilter {
    key?: string;
    value?: string;
}

const EngagementListing = () => {
    const isMediumScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchFilter, setSearchFilter] = useState<SearchFilter>({
        key: 'name',
        value: '',
    });
    const fetcher = useFetcher();
    const fetcherData = fetcher.data as EngagementListLoaderData;
    const engagementPage = fetcherData?.engagements;

    const [paginationOptions, setPaginationOptions] = useState<PaginationOptions<Engagement>>({
        page: Number(searchParams.get('page')) || 1,
        size: Number(searchParams.get('size')) || 10,
        sort_key: (searchParams.get('sort_key')?.split('.')?.[1] as keyof Engagement) ?? 'created_date',
        nested_sort_key: searchParams.get('sort_key') || 'engagement.created_date',
        sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') ?? 'desc',
    });

    const [pageInfo] = useState<PageInfo>(createDefaultPageInfo());

    const [searchText, setSearchText] = useState(searchParams.get('search_text') || '');
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState(
        // Default to open if any of the advanced search fields are set
        Boolean(
            searchParams.get('engagement_status')?.length ||
            searchParams.get('created_from_date') ||
            searchParams.get('created_to_date') ||
            searchParams.get('published_from_date') ||
            searchParams.get('published_to_date'),
        ),
    );

    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        status_list: (searchParams.getAll('engagement_status') || []).map((status) => Number(status)),
        created_from_date: searchParams.get('created_from_date') || '',
        created_to_date: searchParams.get('created_to_date') || '',
        published_from_date: searchParams.get('published_from_date') || '',
        published_to_date: searchParams.get('published_to_date') || '',
    });

    const { roles, assignedEngagements } = useAppSelector((state) => state.user);

    const canViewPrivateEngagements = roles.includes(USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS);

    const canViewAllCommentStatus = roles.includes(USER_ROLES.SHOW_ALL_COMMENT_STATUS);

    useEffect(() => {
        const searchData = {
            page: paginationOptions.page.toString(),
            size: paginationOptions.size.toString(),
            sort_key: paginationOptions.nested_sort_key?.toString(),
            sort_order: paginationOptions.sort_order as 'asc' | 'desc' | undefined,
            search_text: searchFilter.value,
            engagement_status: searchOptions.status_list.map((status) => status.toString()),
            created_from_date: searchOptions.created_from_date || undefined,
            created_to_date: searchOptions.created_to_date || undefined,
            published_from_date: searchOptions.published_from_date || undefined,
            published_to_date: searchOptions.published_to_date || undefined,
        };
        // Filter out properties with empty strings or undefined values
        const filteredSearchData = Object.entries(searchData).reduce<Record<string, string | string[]>>(
            (acc, [key, value]) => {
                if (value) acc[key] = value;
                return acc;
            },
            {}, // the empty initial accumulator
        );
        const searchParams = createSearchParams(filteredSearchData);
        setSearchParams(searchParams);
        fetcher.load(`${getPath(ROUTES.ENGAGEMENT_SEARCH)}?${searchParams}`);
    }, [paginationOptions, searchFilter, searchOptions]);

    const submissionHasBeenOpened = (engagement: Engagement) => {
        return [SubmissionStatus.Open, SubmissionStatus.Closed].includes(engagement.submission_status);
    };

    const handleSearchBarClick = (engagementNameFilter: string) => {
        setSearchFilter({
            ...searchFilter,
            value: engagementNameFilter,
        });
    };

    const headCells: HeadCell<Engagement>[] = [
        {
            key: 'name',
            nestedSortKey: 'engagement.name',
            numeric: false,
            disablePadding: true,
            label: 'Engagement Name',
            allowSort: true,
            renderCell: (row: Engagement) => (
                <Link
                    component={RouterLinkRenderer}
                    href={getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId: Number(row.id) })}
                >
                    {row.name}
                </Link>
            ),
        },
        {
            key: 'created_date',
            nestedSortKey: 'engagement.created_date',
            numeric: true,
            disablePadding: true,
            label: 'Date Created',
            allowSort: true,
            renderCell: (row: Engagement) => formatDate(row.created_date),
        },
        {
            key: 'published_date',
            nestedSortKey: 'engagement.published_date',
            numeric: true,
            disablePadding: true,
            label: 'Date Published',
            allowSort: true,
            renderCell: (row: Engagement) => {
                if (row.published_date === 'None' || !row.published_date) {
                    return '';
                }
                return formatDate(row.published_date);
            },
        },
        {
            key: 'status_id',
            nestedSortKey: 'engagement.status_id',
            numeric: true,
            disablePadding: false,
            label: 'Status',
            allowSort: true,
            renderCell: (row: Engagement) => {
                const acceptable_status = [
                    SubmissionStatus[SubmissionStatus.Open],
                    SubmissionStatus[SubmissionStatus.Closed],
                ];
                if (row.engagement_status.status_name === EngagementStatus[EngagementStatus.Published]) {
                    if (acceptable_status.includes(SubmissionStatus[row.submission_status])) {
                        return SubmissionStatus[row.submission_status];
                    } else {
                        return (
                            EngagementStatus[EngagementStatus.Published] +
                            ' - ' +
                            SubmissionStatus[row.submission_status]
                        );
                    }
                }
                return row.engagement_status.status_name;
            },
        },
        {
            key: 'surveys',
            numeric: true,
            disablePadding: false,
            customStyle: { padding: 2 },
            align: 'left',
            hideSorticon: true,
            allowSort: false,
            icon: <FontAwesomeIcon icon={faMessageCheck} style={{ fontSize: '28px' }} />,
            renderCell: (row: Engagement) => {
                return <></>;
            },
        },
        {
            key: 'surveys',
            numeric: true,
            disablePadding: false,
            label: '',
            customStyle: { padding: 2 },
            hideSorticon: true,
            align: 'left',
            icon: (
                <ApprovedIcon>
                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: '20px' }} />
                </ApprovedIcon>
            ),
            allowSort: false,
            renderCell: (row: Engagement) => {
                if (!submissionHasBeenOpened(row)) {
                    return <></>;
                }

                const { approved } = row.submissions_meta_data;
                return (
                    <Tooltip disableInteractive title={'Approved'} placement="right" arrow>
                        <span>
                            <ApprovedIcon
                                onClick={() => {
                                    if (row.surveys.length === 0) return;
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.surveys[0].id }), {
                                        state: {
                                            status: CommentStatus.Approved,
                                        },
                                    });
                                }}
                            >
                                {approved}
                            </ApprovedIcon>
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            key: 'surveys',
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
            renderCell: (row: Engagement) => {
                if (
                    !submissionHasBeenOpened(row) ||
                    (!canViewPrivateEngagements && !assignedEngagements.includes(Number(row.id))) ||
                    !canViewAllCommentStatus
                ) {
                    return <></>;
                }
                const { needs_further_review } = row.submissions_meta_data;
                return (
                    <Tooltip disableInteractive title={'Need further review'} placement="right" arrow>
                        <span>
                            <NFRIcon
                                onClick={() => {
                                    if (row.surveys.length === 0) return;
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.surveys[0].id }), {
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
            key: 'surveys',
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
            renderCell: (row: Engagement) => {
                if (
                    !submissionHasBeenOpened(row) ||
                    (!canViewPrivateEngagements && !assignedEngagements.includes(Number(row.id))) ||
                    !canViewAllCommentStatus
                ) {
                    return <></>;
                }
                const { rejected } = row.submissions_meta_data;
                return (
                    <Tooltip disableInteractive title={'Rejected'} placement="right" arrow>
                        <span>
                            <RejectedIcon
                                onClick={() => {
                                    if (row.surveys.length === 0) return;
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.surveys[0].id }), {
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
            key: 'surveys',
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
            renderCell: (row: Engagement) => {
                if (
                    !submissionHasBeenOpened(row) ||
                    (!canViewPrivateEngagements && !assignedEngagements.includes(Number(row.id))) ||
                    !canViewAllCommentStatus
                ) {
                    return <></>;
                }
                const { pending } = row.submissions_meta_data;
                return (
                    <Tooltip disableInteractive title={'New comments'} placement="right" arrow>
                        <span>
                            <NewIcon
                                onClick={() => {
                                    if (row.surveys.length === 0) return;
                                    navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: row.surveys[0].id }), {
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
            renderCell: (row: Engagement) => {
                return <ActionsDropDown engagement={row} />;
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
            <Grid>
                <AutoBreadcrumbs />
            </Grid>
            <Grid size={12}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    width="100%"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    <Stack direction="row" spacing={1} alignItems="center" width="100%">
                        <TextInput
                            title={''}
                            inputProps={{ 'aria-label': 'Search by name' }}
                            id="engagement-name"
                            data-testid="engagement/listing/searchField"
                            placeholder="Search by name"
                            name="searchText"
                            value={searchText}
                            fullWidth={isMediumScreen}
                            sx={{ height: '40px', pr: 0, minWidth: '13em' }}
                            onChange={(value) => setSearchText(value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearchBarClick(searchText);
                            }}
                            size="small"
                            endAdornment={
                                <Button
                                    variant="primary"
                                    size="small"
                                    data-testid="engagement/listing/searchButton"
                                    onClick={() => handleSearchBarClick(searchText)}
                                    sx={{ m: 0, borderRadius: '0px 8px 8px 0px' }}
                                >
                                    <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '20px' }} />
                                </Button>
                            }
                        />
                        <When condition={!isMediumScreen}>
                            <Button
                                size="small"
                                sx={{ minWidth: 'max-content' }}
                                data-testid="engagement/listing/advancedSearch"
                                name="advancedSearch"
                                onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                                icon={
                                    <FontAwesomeIcon
                                        icon={faChevronDown}
                                        style={{
                                            fontSize: '12px',
                                            transition: 'transform 0.3s ease',
                                            transform: advancedSearchOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        }}
                                    />
                                }
                            >
                                Advanced Search
                            </Button>
                        </When>
                    </Stack>
                    <When condition={isMediumScreen}>
                        <Button
                            size="small"
                            data-testid="engagement/listing/advancedSearch"
                            name="advancedSearch"
                            onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
                            fullWidth={isMediumScreen}
                            icon={
                                <FontAwesomeIcon
                                    icon={faChevronDown}
                                    style={{
                                        fontSize: '12px',
                                        transition: 'transform 0.3s ease',
                                        transform: advancedSearchOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    }}
                                />
                            }
                        >
                            Advanced Search
                        </Button>
                    </When>
                    <PermissionsGate scopes={[USER_ROLES.CREATE_ENGAGEMENT]} errorProps={{ disabled: true }}>
                        <Button
                            size="small"
                            variant="primary"
                            icon={<FontAwesomeIcon icon={faPlus} />}
                            href={getPath(ROUTES.ENGAGEMENT_CREATE_WIZARD)}
                            sx={{ minWidth: 'max-content' }}
                            fullWidth={isMediumScreen}
                        >
                            Create Engagement
                        </Button>
                    </PermissionsGate>
                </Stack>
            </Grid>
            <Grid size={12} style={{ width: '100%' }}>
                <Collapse in={advancedSearchOpen} timeout="auto" style={{ width: '100%' }}>
                    <AdvancedSearch filterParams={searchOptions} setFilterParams={setSearchOptions} />
                </Collapse>
            </Grid>
            <Grid size={12}>
                <CustomTable
                    headCells={headCells}
                    rows={engagementPage?.items ?? []}
                    handleChangePagination={setPaginationOptions}
                    paginationOptions={paginationOptions}
                    loading={fetcher.state === 'loading'}
                    pageInfo={{ ...pageInfo, total: engagementPage?.total ?? 0 }}
                />
            </Grid>
        </ResponsiveContainer>
    );
};

export default EngagementListing;
