import React, { Suspense } from 'react';
import { Grid2 as Grid, Skeleton } from '@mui/material';
import { Heading1, Heading2, BodyText, Heading4 } from 'components/common/Typography/';
import { DetailsContainer, Detail } from 'components/common/Layout';
import { useNavigate, useRouteLoaderData, Await, useRevalidator } from 'react-router';
import { deleteTenant } from 'services/tenantService';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { Tenant } from 'models/tenant';
import { Button } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan, faCopy } from '@fortawesome/pro-regular-svg-icons';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import LandingPageBanner from 'assets/images/LandingPageBanner.png';
import { globalFocusVisible } from 'components/common';
import { ROUTES, getPath } from 'routes/routes';

const TenantDetail = () => {
    const loaderData = useRouteLoaderData('tenant');
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
        <Grid container size={12} maxWidth="1120px" direction="column" spacing={2}>
            <Grid size={12}>
                <Heading1 mt={0}>
                    <Suspense fallback={<Skeleton data-testid="loading-skeleton" variant="text" width={240} />}>
                        <Await resolve={loaderData.tenant}>{(resolvedTenant) => resolvedTenant.name}</Await>
                    </Suspense>
                </Heading1>
            </Grid>
            <Grid container spacing={0} direction="row" mb="0.5em" size={12}>
                <Grid size={{ xs: 12, sm: 'grow' }}>
                    <Heading2 decorated>Tenant Details</Heading2>
                </Grid>
                <Grid size="auto">
                    <Suspense fallback={<Skeleton variant="rectangular" width={200} height={48} />}>
                        <Await resolve={loaderData.tenant}>
                            {(resolvedTenant) => (
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
                            )}
                        </Await>
                    </Suspense>
                </Grid>
            </Grid>
            <DetailsContainer
                sx={{
                    margin: {
                        // on small screens, negate the padding of the outer container
                        // so the container hugs the edge of the screen
                        xs: '0 -16px',
                        sm: '0',
                    },
                }}
            >
                <Detail spacing={2}>
                    <Heading4>Tenant Instance Name</Heading4>
                    <Suspense fallback={<Skeleton variant="text" width={240} />}>
                        <Await resolve={loaderData.tenant}>
                            {(resolvedTenant) => <BodyText>{resolvedTenant.name}</BodyText>}
                        </Await>
                    </Suspense>
                </Detail>

                <Detail spacing={2}>
                    <Heading4>Primary Contact</Heading4>
                    <Grid container size={12} alignItems="center">
                        <Grid container size="auto">
                            <Suspense fallback={<Skeleton variant="text" width={240} />}>
                                <Await resolve={loaderData.tenant}>
                                    {(resolvedTenant) => <BodyText>{resolvedTenant.contact_name}</BodyText>}
                                </Await>
                            </Suspense>
                        </Grid>
                        <Grid container size="grow" justifyContent="flex-end">
                            <Suspense fallback={<Skeleton variant="text" width={240} />}>
                                <Await resolve={loaderData.tenant}>
                                    {(resolvedTenant) => (
                                        <BodyText
                                            component={'a'}
                                            tabIndex={0}
                                            sx={{
                                                cursor: 'pointer',
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
                                            {resolvedTenant.contact_email} {faCopyIcon}
                                        </BodyText>
                                    )}
                                </Await>
                            </Suspense>
                        </Grid>
                    </Grid>
                </Detail>

                <Detail spacing={2}>
                    <Heading4>Short Name</Heading4>
                    <Suspense fallback={<Skeleton variant="text" width={240} />}>
                        <Await resolve={loaderData.tenant}>
                            {(resolvedTenant) => <BodyText>{resolvedTenant.short_name}</BodyText>}
                        </Await>
                    </Suspense>
                </Detail>

                <Detail>
                    <Heading4>Hero Banner Title</Heading4>
                    <Suspense fallback={<Skeleton variant="text" width={240} />}>
                        <Await resolve={loaderData.tenant}>
                            {(resolvedTenant) => <BodyText>{resolvedTenant.title}</BodyText>}
                        </Await>
                    </Suspense>
                </Detail>

                <Detail>
                    <Heading4>Hero Banner Description</Heading4>
                    <Suspense fallback={<Skeleton variant="text" width={240} />}>
                        <Await resolve={loaderData.tenant}>
                            {(resolvedTenant) => <BodyText>{resolvedTenant.description}</BodyText>}
                        </Await>
                    </Suspense>
                </Detail>

                <Detail>
                    <Grid size={12} gap={1}>
                        <Heading4>Hero Banner Image</Heading4>
                        <div
                            style={{
                                height: '166px',
                                alignSelf: 'stretch',
                                margin: '16px 0',
                                backgroundImage: `url(${loaderData?.tenant?.hero_image_url || LandingPageBanner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                    </Grid>
                    <Suspense fallback={<Skeleton variant="text" width={240} />}>
                        <Await resolve={loaderData.tenant}>
                            {(resolvedTenant) =>
                                resolvedTenant.hero_image_credit && (
                                    <Grid size={12}>
                                        <BodyText bold>Photo Credit</BodyText>
                                        <BodyText size="small">{resolvedTenant.hero_image_credit}</BodyText>
                                    </Grid>
                                )
                            }
                        </Await>
                    </Suspense>
                    <Suspense fallback={<Skeleton variant="text" width={240} />}>
                        <Await resolve={loaderData.tenant}>
                            {(resolvedTenant) =>
                                resolvedTenant.hero_image_description && (
                                    <Grid size={12}>
                                        <BodyText bold>Description</BodyText>
                                        <BodyText size="small">{resolvedTenant.hero_image_description}</BodyText>
                                    </Grid>
                                )
                            }
                        </Await>
                    </Suspense>
                </Detail>
                <Grid container spacing={2} size={12}>
                    <Grid size={12}>
                        <Suspense fallback={<Skeleton variant="text" width={240} />}>
                            <Await resolve={loaderData.tenant}>
                                {(resolvedTenant) => (
                                    <Button
                                        color="danger"
                                        icon={trashCanIcon}
                                        onClick={() => handleDeleteClick(resolvedTenant)}
                                        sx={{ marginTop: '20px' }}
                                    >
                                        Delete Tenant Instance
                                    </Button>
                                )}
                            </Await>
                        </Suspense>
                    </Grid>
                </Grid>
            </DetailsContainer>
        </Grid>
    );
};

export default TenantDetail;
