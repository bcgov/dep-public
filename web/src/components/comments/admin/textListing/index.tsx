import React, { useState, useEffect } from 'react';
import CustomTable from 'components/common/Table';
import { useLocation, useParams } from 'react-router';
import { HeadCell, PageInfo, PaginationOptions } from 'components/common/Table/types';
import { Link, Grid2 as Grid, Stack, Menu, MenuItem, Tooltip } from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { BodyText } from 'components/common/Typography/Body';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlass';
import { useAppDispatch, useAppSelector } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { AuthorChip, CommentStatusChip } from '../../status';
import { CommentStatus } from 'constants/commentStatus';
import { When } from 'react-if';
import { getSubmissionPage } from 'services/submissionService';
import { SurveySubmission } from 'models/surveySubmission';
import { formatToPacific, formatToUTC } from 'components/common/dateHelper';
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
import { TextInput } from 'components/common/Input';

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
                include_autoapproved: true,
                exclude_commentless: true,
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
            key: 'comments',
            numeric: true,
            disablePadding: false,
            label: 'Content',
            allowSort: true,
            renderCell: (row: SurveySubmission) => (
                <Grid container size={12} rowSpacing={2} sx={{ pt: 1.5 }}>
                    {row.comments?.map((comment) => {
                        return (
                            <Grid container key={comment.id} size={12} spacing={1}>
                                <Grid container size="auto" paddingTop={1}>
                                    <Tooltip
                                        disableInteractive
                                        title={`${comment.is_displayed ? 'Displayed' : 'Not displayed'} to the public`}
                                        placement="top"
                                        arrow
                                    >
                                        <span>
                                            <FontAwesomeIcon
                                                icon={comment.is_displayed ? faMessageCheck : faMessageSlash}
                                                style={{ fontSize: '24px', color: '#757575' }}
                                            />
                                        </span>
                                    </Tooltip>
                                </Grid>
                                <Grid size="grow">
                                    <BodyText bold>{comment.label ?? 'Label not available.'} </BodyText>
                                    <BodyText>{' ' + comment.text}</BodyText>
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
                <Grid container key={row.id} direction="column" spacing={1} py={1}>
                    <Grid size={12} container alignItems="center" spacing={1}>
                        <BodyText bold pb="0.1em">
                            Comment Date:
                        </BodyText>
                        <BodyText>{formatToPacific(row.created_date, 'YYYY-MM-DD')}</BodyText>
                    </Grid>
                    <Grid container size={12} alignItems="flex-start" justifyContent="flex-start">
                        <CommentStatusChip
                            isAuto={row.reviewed_by?.toLowerCase() === 'system'}
                            commentStatus={row.comment_status_id}
                        />
                    </Grid>
                    <When condition={row.comment_status_id !== CommentStatus.Pending}>
                        <Grid container size={12} alignItems="center" spacing={1}>
                            <BodyText bold>Reviewed By</BodyText>
                            <AuthorChip author={row.reviewed_by || 'N/A'} />
                        </Grid>
                    </When>
                </Grid>
            ),
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
                            id="comments"
                            sx={{ height: '40px', pr: 0, minWidth: '13em' }}
                            placeholder="Search comments"
                            value={searchText}
                            onChange={(text) => setSearchText(text)}
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
                    </Stack>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} width="100%" justifyContent="flex-end">
                        <PermissionsGate
                            scopes={[
                                USER_ROLES.EXPORT_INTERNAL_COMMENT_SHEET,
                                USER_ROLES.EXPORT_PROPONENT_COMMENT_SHEET,
                            ]}
                            errorProps={{ disabled: true }}
                        >
                            <Button
                                size="small"
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
                        <Button
                            size="small"
                            variant="primary"
                            LinkComponent={RouterLinkRenderer}
                            href={surveyId ? getPath(ROUTES.SURVEY_COMMENTS, { surveyId }) : '#'}
                        >
                            Return to Submission List
                        </Button>
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
        </Grid>
    );
};

export default CommentTextListing;
