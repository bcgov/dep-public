import React, { useState, useEffect } from 'react';
import CustomTable from 'components/common/Table';
import { useLocation, useParams } from 'react-router';
import { ResponsiveContainer } from 'components/common/Layout';
import { HeadCell, PageInfo, PaginationOptions } from 'components/common/Table/types';
import { Link, Grid2 as Grid, Stack, TextField, Menu, MenuItem, Tooltip } from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { BodyText } from 'components/common/Typography/Body';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlass';
import { useAppDispatch, useAppSelector } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { CommentStatusChip } from '../../status';
import { CommentStatus } from 'constants/commentStatus';
import { If, Then, Else, When } from 'react-if';
import { getSubmissionPage } from 'services/submissionService';
import { SurveySubmission } from 'models/surveySubmission';
import { formatDate, formatToUTC } from 'components/common/dateHelper';
import { USER_ROLES } from 'services/userService/constants';
import { USER_COMPOSITE_ROLE } from 'models/user';
import { updateURLWithPagination } from 'components/common/Table/utils';
import { faMessageCheck } from '@fortawesome/pro-solid-svg-icons/faMessageCheck';
import { faMessageSlash } from '@fortawesome/pro-solid-svg-icons/faMessageSlash';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import { getStaffCommentSheet, getProponentCommentSheet } from 'services/commentService';
import { downloadFile } from 'utils';
import { getSurvey } from 'services/surveyService';
import { Survey, createDefaultSurvey } from 'models/survey';
import { PermissionsGate } from 'components/permissionsGate';
import { HTTP_STATUS_CODES } from 'constants/httpResponseCodes';
import axios from 'axios';
import { ROUTES, getPath } from 'routes/routes';

const CommentTextListing = () => {
    const { roles, userDetail, assignedEngagements } = useAppSelector((state) => state.user);
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const pageFromURL = searchParams.get('page');
    const sizeFromURL = searchParams.get('size');
    const badgeStyle: React.CSSProperties = {
        padding: 0,
        margin: 0,
        width: '25%',
    };
    const [searchFilter, setSearchFilter] = useState({
        key: 'text',
        value: '',
    });
    const [searchText, setSearchText] = useState('');
    const [paginationOptions, setPagination] = useState<PaginationOptions<SurveySubmission>>({
        page: Number(pageFromURL) || 1,
        size: Number(sizeFromURL) || 10,
        sort_key: 'id',
        nested_sort_key: 'submission.id',
        sort_order: 'desc',
    });
    const [pageInfo, setPageInfo] = useState<PageInfo>({
        total: 0,
    });
    const [tableLoading, setTableLoading] = useState(true);

    const dispatch = useAppDispatch();
    const { surveyId } = useParams();

    const { page, size, sort_key, nested_sort_key, sort_order } = paginationOptions;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [exportToCSVOpen, setExportToCSVOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [survey, setSurvey] = useState<Survey>(createDefaultSurvey());

    const handleExportStaffComments = async () => {
        try {
            setIsExporting(true);
            const response = await getStaffCommentSheet({ survey_id: survey.id });
            downloadFile(response, `INTERNAL ONLY - ${survey.engagement?.name || ''} - ${formatToUTC(Date())}.csv`);
            setIsExporting(false);
            handleExportToCSVClose(); // Close the menu after export
        } catch {
            setIsExporting(false);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while exporting comments. Please try again later.',
                }),
            );
        }
    };

    const handleExportProponentComments = async () => {
        try {
            setIsExporting(true);
            const response = await getProponentCommentSheet({ survey_id: survey.id });
            downloadFile(response, `PUBLIC - ${survey.engagement?.name || ''} - ${formatToUTC(Date())}.xlsx`);
            setIsExporting(false);
            handleExportToCSVClose(); // Close the menu after export
        } catch (error) {
            setIsExporting(false);
            if (axios.isAxiosError(error) && error.response?.status === HTTP_STATUS_CODES.FORBIDDEN) {
                dispatch(
                    openNotification({
                        severity: 'error',
                        text: 'You do not have permission to export this data.',
                    }),
                );
            } else {
                dispatch(
                    openNotification({
                        severity: 'error',
                        text: 'Error occurred while exporting comments. Please try again later.',
                    }),
                );
            }
        }
    };

    const handleExportToCSVOpen = (event?: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event?.currentTarget ?? null);
        setExportToCSVOpen(!exportToCSVOpen);
    };

    const handleExportToCSVClose = () => {
        setAnchorEl(null);
        setExportToCSVOpen(false);
    };

    const customStyle = {
        minWidth: '180px',
        width: '100%',
    };

    const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
    const loadSubmissions = async () => {
        try {
            setTableLoading(true);
            const queryParams = {
                page,
                size,
                sort_key: nested_sort_key || sort_key,
                sort_order,
                search_text: searchFilter.value,
            };
            const response = await getSubmissionPage({
                survey_id: Number(surveyId),
                queryParams,
            });
            setSubmissions(response.items);
            setPageInfo({
                total: response.total,
            });
            const survey = await getSurvey(Number(surveyId));
            setSurvey(survey);
            setTableLoading(false);
        } catch (error) {
            console.log(error);
            dispatch(openNotification({ severity: 'error', text: 'Error occurred while fetching submissions' }));
            setTableLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
        updateURLWithPagination(paginationOptions);
    }, [paginationOptions, surveyId, searchFilter]);

    const handleSearchBarClick = (filter: string) => {
        setSearchFilter({
            ...searchFilter,
            value: filter,
        });
    };

    const headCells: HeadCell<SurveySubmission>[] = [
        {
            key: 'id',
            numeric: true,
            disablePadding: false,
            label: 'ID',
            allowSort: true,
            renderCell: (row) => {
                if (
                    roles.includes(USER_ROLES.REVIEW_COMMENTS) ||
                    (assignedEngagements.includes(Number(row.engagement_id)) &&
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
            key: 'comments',
            numeric: true,
            disablePadding: false,
            label: 'Content',
            allowSort: true,
            renderCell: (row: SurveySubmission) => (
                <Grid container size={12} rowSpacing={2} sx={{ pt: 1.5 }}>
                    {row.comments?.map((comment) => {
                        return (
                            <Grid key={comment.id} size={12}>
                                <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start">
                                    <Grid size={1} paddingTop={1}>
                                        <If condition={comment.is_displayed}>
                                            <Then>
                                                <Grid size={12}>
                                                    <Tooltip
                                                        disableInteractive
                                                        title={'Displayed to the public'}
                                                        placement="top"
                                                        arrow
                                                    >
                                                        <span>
                                                            <FontAwesomeIcon
                                                                icon={faMessageCheck}
                                                                style={{ fontSize: '24px', color: '#757575' }}
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </Grid>
                                            </Then>
                                            <Else>
                                                <Grid size={12}>
                                                    <Tooltip
                                                        disableInteractive
                                                        title={'Not displayed to the public'}
                                                        placement="top"
                                                        arrow
                                                    >
                                                        <span>
                                                            <FontAwesomeIcon
                                                                icon={faMessageSlash}
                                                                style={{ fontSize: '24px', color: '#757575' }}
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                </Grid>
                                            </Else>
                                        </If>
                                    </Grid>
                                    <Grid size={11}>
                                        <BodyText bold>{comment.label ?? 'Label not available.'} </BodyText>
                                        <BodyText>{' ' + comment.text}</BodyText>
                                    </Grid>
                                </Grid>
                            </Grid>
                        );
                    })}
                </Grid>
            ),
        },
        {
            key: 'comment_status_id',
            numeric: true,
            disablePadding: false,
            label: 'Comment Date',
            allowSort: true,
            align: 'right',
            customStyle: badgeStyle,
            renderCell: (row: SurveySubmission) => (
                <Grid container>
                    <Grid
                        container
                        sx={{
                            pb: '0.1em',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                        }}
                    >
                        <Grid
                            size={12}
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                            }}
                        >
                            <Stack
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                }}
                            >
                                <BodyText
                                    sx={{
                                        pb: '0.1em',
                                    }}
                                >
                                    <b>Comment Date: </b>
                                </BodyText>
                                <BodyText>{formatDate(row.created_date)}</BodyText>
                            </Stack>
                        </Grid>
                        <When condition={row.comment_status_id !== CommentStatus.Pending}>
                            <Grid
                                size={12}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                }}
                            >
                                <Stack
                                    sx={{
                                        alignItems: 'flex-start',
                                        justifyContent: 'flex-start',
                                    }}
                                >
                                    <BodyText
                                        sx={{
                                            pb: '0.1em',
                                        }}
                                    >
                                        <BodyText bold>Reviewed By: </BodyText>
                                    </BodyText>
                                    <BodyText>{row.reviewed_by}</BodyText>
                                </Stack>
                            </Grid>
                        </When>
                    </Grid>
                    <Grid container size={12} alignItems={'flex-start'} justifyContent={'flex-start'}>
                        <CommentStatusChip commentStatus={row.comment_status_id} />
                    </Grid>
                </Grid>
            ),
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
            <Grid size={{ xs: 12, lg: 7 }}>
                <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="flex-start">
                    <TextField
                        id="comments"
                        variant="outlined"
                        label="Search Comments"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        size="small"
                    />
                    <Button
                        variant="primary"
                        data-testid="CommentListing/search-button"
                        onClick={() => handleSearchBarClick(searchText)}
                    >
                        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '20px' }} />
                    </Button>
                </Stack>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} width="100%" justifyContent="flex-end">
                    <Button
                        variant="primary"
                        LinkComponent={RouterLinkRenderer}
                        href={getPath(ROUTES.SURVEY_COMMENTS, { surveyId: submissions[0]?.survey_id || 0 })}
                    >
                        Return to Comments List
                    </Button>
                    <PermissionsGate
                        scopes={[USER_ROLES.EXPORT_INTERNAL_COMMENT_SHEET, USER_ROLES.EXPORT_PROPONENT_COMMENT_SHEET]}
                        errorProps={{ disabled: true }}
                    >
                        <Button
                            onClick={handleExportToCSVOpen}
                            aria-controls="simple-menu"
                            aria-haspopup="true"
                            loading={isExporting}
                            icon={
                                <FontAwesomeIcon
                                    icon={faChevronDown}
                                    style={{
                                        fontSize: '12px',
                                        transition: 'transform 0.3s ease',
                                        transform: exportToCSVOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    }}
                                />
                            }
                        >
                            Export to CSV
                        </Button>
                    </PermissionsGate>
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleExportToCSVClose}
                    >
                        <MenuItem onClick={handleExportProponentComments} style={customStyle}>
                            Public/Proponent
                        </MenuItem>
                        <PermissionsGate scopes={[USER_ROLES.EXPORT_INTERNAL_COMMENT_SHEET]}>
                            <MenuItem onClick={handleExportStaffComments} style={customStyle}>
                                Internal Only/Detailed
                            </MenuItem>
                        </PermissionsGate>
                    </Menu>
                </Stack>
            </Grid>
            <Grid size={12}>
                <CustomTable
                    hideHeader={true}
                    headCells={headCells}
                    rows={submissions}
                    handleChangePagination={(pagination: PaginationOptions<SurveySubmission>) =>
                        setPagination(pagination)
                    }
                    commentTable
                    paginationOptions={paginationOptions}
                    pageInfo={pageInfo}
                    loading={tableLoading}
                />
            </Grid>
        </ResponsiveContainer>
    );
};

export default CommentTextListing;
