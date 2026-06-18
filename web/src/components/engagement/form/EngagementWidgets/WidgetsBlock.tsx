import React, { useContext } from 'react';
import { Grid2 as Grid, Paper, Skeleton, Tooltip } from '@mui/material';
import { Heading2 } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { WidgetCardSwitch } from './WidgetCardSwitch';
import { If, Then, Else } from 'react-if';
import { WidgetDrawerContext } from './WidgetDrawerContext';
import { useAppDispatch } from 'hooks';
import { Widget } from 'models/widget';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import { useRouteLoaderData } from 'react-router';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';

const WidgetsBlock = () => {
    const { widgets, deleteWidget, setWidgetDrawerOpen, isWidgetsLoading } = useContext(WidgetDrawerContext);
    const savedEngagement = React.use(
        (useRouteLoaderData('single-engagement') as EngagementLoaderAdminData)?.engagement,
    );
    const dispatch = useAppDispatch();

    const handleAddWidgetClick = () => {
        setWidgetDrawerOpen(true);
    };

    const removeWidget = (widgetId: number) => {
        dispatch(
            openNotificationModal({
                open: true,
                data: {
                    header: 'Remove Widget',
                    subText: [
                        { text: 'You will be removing this widget from the engagement.' },
                        { text: 'Do you want to remove this widget?' },
                    ],
                    handleConfirm: () => {
                        deleteWidget(widgetId);
                    },
                },
                type: 'confirm',
            }),
        );
    };

    return (
        <Grid container size={12} rowSpacing={1}>
            <Grid size={12}>
                <Heading2 bold>Widgets</Heading2>
            </Grid>
            <Grid size={12}>
                <Paper sx={{ padding: '1em' }}>
                    <Grid
                        container
                        direction="row"
                        alignItems={'flex-start'}
                        justifyContent="flex-start"
                        rowSpacing={2}
                    >
                        <Grid container alignItems={'flex-end'} justifyContent="flex-end">
                            <Tooltip
                                title={savedEngagement.id ? '' : 'Please save the engagement before adding a widget.'}
                            >
                                <span>
                                    <Button onClick={handleAddWidgetClick} disabled={!savedEngagement.id}>
                                        Add Widget
                                    </Button>
                                </span>
                            </Tooltip>
                        </Grid>
                        <If condition={isWidgetsLoading}>
                            <Then>
                                <Grid size={12}>
                                    <Skeleton width="100%" height="6em" />
                                </Grid>
                            </Then>
                            <Else>
                                <Grid size={12}>
                                    <Grid
                                        container
                                        direction="row"
                                        alignItems={'flex-start'}
                                        justifyContent="flex-start"
                                    >
                                        {widgets.map((widget: Widget) => (
                                            <Grid size={12} key={widget.id}>
                                                <WidgetCardSwitch widget={widget} removeWidget={removeWidget} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Grid>
                            </Else>
                        </If>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default WidgetsBlock;
