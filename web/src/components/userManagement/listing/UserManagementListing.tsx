import React, { useContext, useState } from 'react';
import { TextInput } from 'components/common/Input/TextInput';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlass';
import { USER_STATUS, User } from 'models/user';
import { HeadCell } from 'components/common/Table/types';
import { Button } from 'components/common/Input/Button';
import { ResponsiveContainer } from 'components/common/Layout';
import { Link } from '@mui/material';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import CustomTable from 'components/common/Table';
import { formatDate } from 'components/common/dateHelper';
import { UserManagementContext } from './UserManagementContext';
import { ActionsDropDown } from './ActionsDropDown';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { ROUTES, getPath } from 'routes/routes';

const UserManagementListing = () => {
    const { pageInfo, paginationOptions, setPaginationOptions, users, usersLoading, setSearchText } =
        useContext(UserManagementContext);

    const [searchBarText, setSearchBarText] = useState('');

    const handleSearchClick = () => {
        setSearchText(searchBarText);
    };

    const headCells: HeadCell<User>[] = [
        {
            key: 'last_name',
            numeric: false,
            disablePadding: true,
            label: 'User Name',
            allowSort: true,
            renderCell: (row: User) => (
                <Link href={getPath(ROUTES.USER_DETAILS, { userId: row.id })} component={RouterLinkRenderer}>
                    {row.last_name + ', ' + row.first_name}
                </Link>
            ),
        },
        {
            key: 'main_role',
            numeric: false,
            disablePadding: true,
            label: 'Role',
            allowSort: false,
            renderCell: (row: User) => {
                return row.main_role;
            },
        },
        {
            key: 'created_date',
            numeric: false,
            disablePadding: true,
            label: 'Date Added',
            allowSort: true,
            renderCell: (row: User) => formatDate(row.created_date),
        },
        {
            key: 'status_id',
            numeric: false,
            disablePadding: true,
            label: 'Status',
            allowSort: true,
            renderCell: (row: User) =>
                Object.values(USER_STATUS).find((status) => status.value === row.status_id)?.label ?? '',
        },
        {
            key: 'id',
            numeric: true,
            disablePadding: false,
            label: 'Actions',
            allowSort: false,
            renderCell: (row: User) => {
                return <ActionsDropDown selectedUser={row} />;
            },
            customStyle: {
                minWidth: '200px',
            },
        },
    ];

    return (
        <ResponsiveContainer>
            <Grid size={12}>
                <AutoBreadcrumbs />
            </Grid>
            <Grid size={{ xs: 12, lg: 10 }} mt={1}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} width="100%" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextInput
                            title={''}
                            inputProps={{ 'aria-label': 'Search by name' }}
                            id="engagement-name"
                            data-testid="engagement/listing/searchField"
                            placeholder="Search by name"
                            name="searchText"
                            value={searchBarText}
                            sx={{ height: '40px', pr: 0, minWidth: '13em' }}
                            onChange={(value) => setSearchBarText(value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearchClick();
                            }}
                            size="small"
                            endAdornment={
                                <Button
                                    variant="primary"
                                    size="small"
                                    data-testid="engagement/listing/searchButton"
                                    onClick={() => handleSearchClick()}
                                    sx={{ m: 0, borderRadius: '0px 8px 8px 0px' }}
                                >
                                    <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '20px' }} />
                                </Button>
                            }
                        />
                    </Stack>
                </Stack>
            </Grid>
            <Grid size={{ xs: 12, lg: 10 }}>
                <CustomTable
                    headCells={headCells}
                    rows={users}
                    handleChangePagination={(paginationOptions) => setPaginationOptions(paginationOptions)}
                    paginationOptions={paginationOptions}
                    loading={usersLoading}
                    pageInfo={pageInfo}
                />
            </Grid>
        </ResponsiveContainer>
    );
};

export default UserManagementListing;
