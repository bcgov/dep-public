import React, { Suspense } from 'react';
import { useRouteLoaderData, Await, useMatches, UIMatch, Outlet } from 'react-router';
import { Engagement } from 'models/engagement';
import { Grid2 as Grid, Skeleton, Tab } from '@mui/material';
import { ResponsiveContainer } from 'components/common/Layout';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { EngagementLoaderAdminData } from 'components/engagement/admin/EngagementLoaderAdmin';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { BodyText, Heading1 } from 'components/common/Typography';
import { StatusLabel } from '../create/authoring/StatusLabel';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';

const AdminEngagementView = () => {
    const { engagement } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;

    const EngagementViewTabs = {
        config: 'Configuration',
        authoring: 'Authoring',
        activity: 'Activity',
        results: 'Results',
        publish: 'Publishing',
    };

    const matches = useMatches() as UIMatch[];
    const currentTab = matches[matches.length - 1].pathname.split('/').pop() ?? '';

    return (
        <ResponsiveContainer>
            <AutoBreadcrumbs />
            <Grid size={12} mt={4}>
                <Suspense fallback={<StatusLabel completed={false} text="Loading..." />}>
                    <Await resolve={engagement}>
                        {(engagement: Engagement) => <StatusLabel status={Number(engagement?.status_id)} />}
                    </Await>
                </Suspense>
            </Grid>
            <Grid>
                <Suspense
                    fallback={
                        <Skeleton variant="text">
                            <Heading1 mt={1} mb={3}>
                                Loading...
                            </Heading1>
                        </Skeleton>
                    }
                >
                    <Heading1 mt={1} mb={3}>
                        <Await resolve={engagement}>{(engagement: Engagement) => engagement?.name}</Await>
                    </Heading1>
                </Suspense>
            </Grid>
            <TabContext value={currentTab}>
                <Grid size={12}>
                    <TabList
                        component="nav"
                        variant="scrollable"
                        aria-label="Admin Engagement View Tabs"
                        slotProps={{ indicator: { sx: { display: 'none' } } }}
                        sx={{
                            '& .MuiTabs-flexContainer': {
                                justifyContent: 'flex-start',
                                borderBottom: '2px solid',
                                borderBottomColor: 'gray.60',
                                width: '100%',
                                minWidth: 'max-content',
                                maxWidth: '700px',
                            },
                        }}
                    >
                        {Object.entries(EngagementViewTabs).map(([key, value]) => (
                            <Tab
                                key={key}
                                value={key}
                                label={
                                    <BodyText size="small" className="tab-label">
                                        {value}
                                    </BodyText>
                                }
                                disableFocusRipple
                                LinkComponent={RouterLinkRenderer}
                                href={`${key}`}
                                sx={{
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '48px',
                                    padding: '4px 24px 2px 18px',
                                    fontSize: '14px',
                                    borderRadius: '0px 16px 0px 0px',
                                    boxShadow:
                                        '0px 1px 5px 0px rgba(0, 0, 0, 0.12), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.20)',
                                    backgroundColor: 'gray.10',
                                    color: 'text.secondary',
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.main',
                                        borderColor: 'primary.main',
                                        color: 'white',
                                        '& .tab-label': {
                                            visibility: 'hidden',
                                        },
                                        '::before': {
                                            content: `"${value}"`,
                                            position: 'absolute',
                                        },
                                    },
                                    outlineOffset: '-4px',
                                    position: 'relative',
                                    zIndex: 1,
                                    '&:focus-visible': {
                                        zIndex: 2,
                                        outline: `2px solid`,
                                        outlineColor: 'focus.inner',
                                        border: '4px solid',
                                        borderColor: 'focus.outer',
                                        padding: '-2px 12px 0px 14px',
                                    },
                                }}
                            />
                        ))}
                    </TabList>
                </Grid>
                <Grid size={12}>
                    <TabPanel value={currentTab} sx={{ padding: '2rem 0' }}>
                        <Outlet />
                    </TabPanel>
                </Grid>
            </TabContext>
        </ResponsiveContainer>
    );
};

export default AdminEngagementView;
