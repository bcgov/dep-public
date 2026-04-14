import React, { Suspense } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Grid2 as Grid, Skeleton } from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { Heading1, Heading2, BodyText } from 'components/common/Typography/';
import { ResponsiveContainer } from 'components/common/Layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableHeadRow,
    TableRow,
} from 'components/common/Layout/Table';

import { Tenant } from 'models/tenant';
import { Await, useNavigate, useRouteLoaderData } from 'react-router';
import { ROUTES, getPath } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
// Prevents page load fail due to waiting for engagement title on refresh
const AutoBreadcrumbs = React.lazy(() =>
    import('components/common/Navigation/Breadcrumb').then((m) => ({ default: m.AutoBreadcrumbs })),
);

const TenantListingPage = () => {
    const navigate = useNavigate();
    const circlePlusIcon = <FontAwesomeIcon icon={faPlus} />;
    const tenants = useRouteLoaderData('tenant-admin') as Promise<Tenant[]>;

    return (
        <ResponsiveContainer>
            <AutoBreadcrumbs />

            <Grid size={12}>
                <Heading1>Tenant Admin</Heading1>
            </Grid>
            <Grid container direction="row" mb="0.5em" alignItems="flex-start" size={12}>
                <Grid size={{ xs: 12, sm: 'grow' }}>
                    <Heading2 decorated>
                        Tenant Instances{' '}
                        <Suspense fallback={<span />}>
                            <Await resolve={tenants}>
                                {(resolvedTenants) => <span>({resolvedTenants.length})</span>}
                            </Await>
                        </Suspense>
                    </Heading2>
                </Grid>
                <Grid size="auto">
                    <Button
                        LinkComponent={RouterLinkRenderer}
                        variant="primary"
                        icon={circlePlusIcon}
                        href={getPath(ROUTES.TENANT_ADMIN_CREATE)}
                    >
                        Add Tenant
                    </Button>
                </Grid>
            </Grid>
            <Box
                style={{
                    // Allow the table to scroll horizontally
                    display: 'block',
                    overflowX: 'auto',
                    // Allow the keyboard focus outline on table rows to
                    // display outside the scrollable area
                    width: 'calc(100% + 4px)',
                    padding: '0px 2px 2px',
                    margin: '0px -2px -2px',
                }}
            >
                <Table>
                    <TableHead>
                        <TableHeadRow>
                            <TableHeadCell sx={{ minWidth: '240px' }}>Name</TableHeadCell>
                            <TableHeadCell sx={{ minWidth: '480px' }}>Description</TableHeadCell>
                        </TableHeadRow>
                    </TableHead>
                    <TableBody>
                        <Suspense
                            fallback={[...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Skeleton variant="text" width={240} />
                                        <Skeleton variant="text" width={240} />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton variant="text" width={480} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        >
                            <Await resolve={tenants} errorElement={<p>Could not load tenants</p>}>
                                {(resolvedTenants) => (
                                    <>
                                        {resolvedTenants.map((tenant: Tenant) => {
                                            return (
                                                <TableRow
                                                    onClick={() => {
                                                        navigate(
                                                            getPath(ROUTES.TENANT_ADMIN_DETAIL, {
                                                                tenantShortName: tenant.short_name,
                                                            }),
                                                        );
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            navigate(
                                                                getPath(ROUTES.TENANT_ADMIN_DETAIL, {
                                                                    tenantShortName: tenant.short_name,
                                                                }),
                                                            );
                                                        }
                                                    }}
                                                    key={tenant.name}
                                                    tabIndex={0}
                                                >
                                                    <TableCell>
                                                        <BodyText bold style={{ marginBottom: '8px' }}>
                                                            {tenant.name}
                                                        </BodyText>
                                                        <BodyText size="small">{tenant.contact_name}</BodyText>
                                                    </TableCell>
                                                    <TableCell>
                                                        <BodyText size="small">{tenant.description}</BodyText>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </>
                                )}
                            </Await>
                        </Suspense>
                    </TableBody>
                </Table>
            </Box>
        </ResponsiveContainer>
    );
};

export default TenantListingPage;
