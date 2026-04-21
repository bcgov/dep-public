import React, { Suspense } from 'react';
import { Box, Grid2 as Grid, Skeleton } from '@mui/material';
import { Heading1, Heading2, BodyText, Heading4 } from 'components/common/Typography/';
import { ResponsiveContainer, DetailsContainer, Detail } from 'components/common/Layout';
import { useNavigate, useRouteLoaderData, Await, useRevalidator } from 'react-router';
import { deleteTenant } from 'services/tenantService';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { Tenant } from 'models/tenant';
import { Button } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan, faCopy } from '@fortawesome/pro-regular-svg-icons';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import LandingPageBanner from 'assets/images/LandingPageBanner.png';
import { globalFocusVisible } from 'components/common';
import { ROUTES, getPath } from 'routes/routes';

const TenantDetail = () => {
    const tenant = useRouteLoaderData('tenant') as Promise<Tenant>;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const revalidator = useRevalidator();
    const penToSquareIcon = <FontAwesomeIcon icon={faPenToSquare} />;
    const trashCanIcon = <FontAwesomeIcon icon={faTrashCan} />;
    const faCopyIcon = <FontAwesomeIcon icon={faCopy} style={{ color: '#063064', marginLeft: '2px' }} />;

    const handleDeleteTenant = async (tenantId: string) => {
        try {
            await deleteTenant(tenantId);
            dispatch(
                openNotification({
                    severity: 'success',
                    text: `Tenant "${tenantId}" successfully deleted`,
                }),
            );
            revalidator.revalidate();
            navigate(getPath(ROUTES.TENANT_ADMIN));
        } catch (error) {
            console.log(error);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: `Error occurred while trying to delete tenant "${tenantId}"`,
                }),
            );
        }
    };

    const handleDeleteClick = (tenant: Tenant) => {
        dispatch(
            openNotificationModal({
                open: true,
                data: {
                    style: 'danger',
                    header: 'Delete Tenant Instance?',
                    subHeader: `Are you sure you want to delete "${tenant.name}"?`,
                    subText: [
                        {
                            text: 'If you delete this tenant, all the data associated with it will be deleted. This action cannot be undone.',
                        },
                    ],
                    handleConfirm: () => {
                        handleDeleteTenant(tenant.short_name);
                    },
                },
                type: 'confirm',
            }),
        );
    };

    const copyEmail = (tenant: Tenant) => {
        navigator.clipboard.writeText(tenant.contact_email ?? '');
        dispatch(openNotification({ text: 'Copied to clipboard', severity: 'info' }));
    };

    return (
        <Suspense
            fallback={
                <ResponsiveContainer>
                    <AutoBreadcrumbs />
                    <Skeleton variant="text" width="40%">
                        <Heading1>Loading...</Heading1>
                    </Skeleton>
                    <Grid container spacing={0} direction="row" mb="0.5em">
                        <Grid size={{ xs: 12, sm: 7, lg: 9 }}>
                            <Skeleton variant="text" width="60%">
                                <Heading2 decorated>Loading...</Heading2>
                            </Skeleton>
                        </Grid>
                        <Grid size={{ xs: 'auto', sm: 5, lg: 3 }} sx={{ textAlign: 'right' }}>
                            <Skeleton variant="rectangular" height={36} width={100} />
                        </Grid>
                    </Grid>
                    <Box
                        style={{
                            display: 'block',
                            overflowX: 'auto',
                            width: 'calc(100% + 4px)',
                            padding: '0px 2px 2px',
                            margin: '0px -2px -2px',
                        }}
                    >
                        <DetailsContainer
                            sx={{
                                margin: {
                                    xs: '0 -16px',
                                    sm: '0',
                                },
                            }}
                        >
                            <Detail>
                                <Skeleton variant="text" width="40%">
                                    <BodyText bold>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="80%">
                                    <BodyText>Loading...</BodyText>
                                </Skeleton>
                            </Detail>

                            <Detail>
                                <Skeleton variant="text" width="40%">
                                    <BodyText bold>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="80%">
                                    <BodyText>Loading...</BodyText>
                                </Skeleton>
                            </Detail>

                            <Detail>
                                <Skeleton variant="text" width="40%">
                                    <BodyText bold>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="80%">
                                    <BodyText>Loading...</BodyText>
                                </Skeleton>
                            </Detail>

                            <Detail>
                                <Skeleton variant="text" width="40%">
                                    <BodyText bold>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="80%">
                                    <BodyText>Loading...</BodyText>
                                </Skeleton>
                            </Detail>

                            <Detail>
                                <Skeleton variant="text" width="40%">
                                    <BodyText bold>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="80%">
                                    <BodyText>Loading...</BodyText>
                                </Skeleton>
                            </Detail>

                            <Detail>
                                <Skeleton variant="rectangular" height={166} width="100%" />
                                <Skeleton variant="text" width="40%">
                                    <BodyText bold>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="80%">
                                    <BodyText>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="40%">
                                    <BodyText bold>Loading...</BodyText>
                                </Skeleton>
                                <Skeleton variant="text" width="80%">
                                    <BodyText>Loading...</BodyText>
                                </Skeleton>
                            </Detail>
                            <Grid container spacing={2}>
                                <Grid size={12}>
                                    <Skeleton variant="rectangular" height={36} width={100} />
                                </Grid>
                            </Grid>
                        </DetailsContainer>
                    </Box>
                </ResponsiveContainer>
            }
        >
            <Await resolve={tenant}>
                {(resolvedTenant) => (
                    <ResponsiveContainer>
                        <AutoBreadcrumbs />
                        <Grid size={12}>
                            <Heading1>{resolvedTenant.name}</Heading1>
                        </Grid>
                        <Grid container spacing={0} direction="row" mb="0.5em" size={12}>
                            <Grid size={{ xs: 12, sm: 'grow' }}>
                                <Heading2 decorated>Tenant Details</Heading2>
                            </Grid>
                            <Grid size="auto">
                                <Button
                                    variant="primary"
                                    icon={penToSquareIcon}
                                    onClick={() => {
                                        navigate(
                                            getPath(ROUTES.TENANT_ADMIN_EDIT, {
                                                tenantShortName: resolvedTenant.short_name,
                                            }),
                                        );
                                    }}
                                >
                                    Edit
                                </Button>
                            </Grid>
                        </Grid>
                        <DetailsContainer
                            sx={{
                                margin: {
                                    // on small screens, negate the padding of the ResponsiveContainer
                                    // so the container hugs the edge of the screen
                                    xs: '0 -16px',
                                    sm: '0',
                                },
                            }}
                        >
                            <Detail spacing={2}>
                                <Heading4>Tenant Instance Name</Heading4>
                                <BodyText>{resolvedTenant.name}</BodyText>
                            </Detail>

                            <Detail spacing={2}>
                                <Heading4>Primary Contact</Heading4>
                                <Grid container size={12} alignItems="center">
                                    <Grid size="auto">
                                        <BodyText>{resolvedTenant.contact_name}</BodyText>
                                    </Grid>
                                    <Grid
                                        size="grow"
                                        alignSelf="flex-end"
                                        textAlign="right"
                                        component={'a'}
                                        tabIndex={0}
                                        target="#"
                                        sx={{
                                            cursor: 'pointer',
                                            display: { xs: 'none', sm: 'block' },
                                            ...globalFocusVisible,
                                        }}
                                        onClick={() => copyEmail(resolvedTenant)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                copyEmail(resolvedTenant);
                                            }
                                        }}
                                    >
                                        <BodyText>
                                            {resolvedTenant.contact_email} {faCopyIcon}
                                        </BodyText>
                                    </Grid>
                                </Grid>
                            </Detail>

                            <Detail spacing={2}>
                                <Heading4>Short Name</Heading4>
                                <BodyText>{resolvedTenant.short_name}</BodyText>
                            </Detail>

                            <Detail>
                                <Heading4>Hero Banner Title</Heading4>
                                <BodyText>{resolvedTenant.title}</BodyText>
                            </Detail>

                            <Detail>
                                <Heading4>Hero Banner Description</Heading4>
                                <BodyText>{resolvedTenant.description}</BodyText>
                            </Detail>

                            <Detail>
                                <Grid size={12} gap={1}>
                                    <Heading4>Hero Banner Image</Heading4>
                                    <div
                                        style={{
                                            height: '166px',
                                            alignSelf: 'stretch',
                                            margin: '16px 0',
                                            backgroundImage: `url(${
                                                resolvedTenant.hero_image_url || LandingPageBanner
                                            })`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                </Grid>
                                {resolvedTenant.hero_image_credit && (
                                    <Grid size={12}>
                                        <BodyText bold>Photo Credit</BodyText>
                                        <BodyText size="small">{resolvedTenant.hero_image_credit}</BodyText>
                                    </Grid>
                                )}
                                {resolvedTenant.hero_image_description && (
                                    <Grid size={12}>
                                        <BodyText bold>Description</BodyText>
                                        <BodyText size="small">{resolvedTenant.hero_image_description}</BodyText>
                                    </Grid>
                                )}
                            </Detail>
                            <Grid container spacing={2} size={12}>
                                <Grid size={12}>
                                    <Button
                                        color="danger"
                                        icon={trashCanIcon}
                                        onClick={() => handleDeleteClick(resolvedTenant)}
                                        sx={{ marginTop: '20px' }}
                                    >
                                        Delete Tenant Instance
                                    </Button>
                                </Grid>
                            </Grid>
                        </DetailsContainer>
                    </ResponsiveContainer>
                )}
            </Await>
        </Suspense>
    );
};

export default TenantDetail;
