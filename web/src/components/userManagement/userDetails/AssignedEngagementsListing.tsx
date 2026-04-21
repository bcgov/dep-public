import React, { useContext } from 'react';
import { Link } from '@mui/material';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import CustomTable from 'components/common/Table';
import { HeadCell } from 'components/common/Table/types';
import { ENGAGEMENT_MEMBERSHIP_STATUS_NAME, EngagementTeamMember } from 'models/engagementTeamMember';
import { formatDate } from 'components/common/dateHelper';
import { UserDetailsContext } from './UserDetailsContext';
import { ActionsDropDown } from './ActionsDropDown';
import { ROUTES, getPath } from 'routes/routes';

export const AssignedEngagementsListing = () => {
    const { memberships, isUserLoading, isMembershipLoading } = useContext(UserDetailsContext);

    const headCells: HeadCell<EngagementTeamMember>[] = [
        {
            key: 'engagement',
            numeric: false,
            disablePadding: true,
            label: 'Engagement',
            allowSort: true,
            renderCell: (row: EngagementTeamMember) => (
                <Link
                    component={RouterLinkRenderer}
                    href={getPath(ROUTES.ENGAGEMENT_DETAILS, { engagementId: Number(row.engagement_id) })}
                >
                    {row.engagement?.name}
                </Link>
            ),
        },
        {
            key: 'status',
            numeric: false,
            disablePadding: true,
            label: 'Status',
            allowSort: false,
            renderCell: (row: EngagementTeamMember) => ENGAGEMENT_MEMBERSHIP_STATUS_NAME[row.status],
        },
        {
            key: 'created_date',
            numeric: false,
            disablePadding: true,
            label: 'Date Added',
            allowSort: false,
            renderCell: (row: EngagementTeamMember) => formatDate(row.created_date),
        },
        {
            key: 'revoked_date',
            numeric: false,
            disablePadding: true,
            label: 'Date Revoked',
            allowSort: false,
            renderCell: (row: EngagementTeamMember) => (row.revoked_date ? formatDate(row.revoked_date) : null),
        },
        {
            key: 'id',
            numeric: false,
            disablePadding: true,
            label: 'Actions',
            allowSort: false,
            customStyle: { width: '170px' },
            renderCell: (row: EngagementTeamMember) => {
                return <ActionsDropDown membership={row} />;
            },
        },
    ];

    return (
        <CustomTable
            headCells={headCells}
            rows={memberships}
            noPagination={true}
            loading={isUserLoading || isMembershipLoading}
        />
    );
};

export default AssignedEngagementsListing;
