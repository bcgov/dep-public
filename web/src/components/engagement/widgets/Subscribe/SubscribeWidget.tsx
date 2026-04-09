import React, { useEffect, useState } from 'react';

import { Divider, Grid2 as Grid, Paper, Skeleton, ThemeProvider } from '@mui/material';
import { useAppDispatch } from 'hooks';
import { Widget } from 'models/widget';
import { getSubscriptionsForms } from 'services/subscriptionService';
import { openNotification } from 'services/notificationService/notificationSlice';
import { SubscribeForm } from 'models/subscription';
import { Unless } from 'react-if';
import EmailListSection from './EmailListSection';
import EmailListModal from './EmailListModal';
import { Heading2 } from 'components/common/Typography';
import { useLoaderData } from 'react-router';
import { EngagementLoaderPublicData } from 'engagements/public/view';
import { BaseTheme } from 'styles/Theme';

const SubscribeWidget = ({ widget }: { widget: Widget }) => {
    const dispatch = useAppDispatch();
    const { widgets } = useLoaderData() as EngagementLoaderPublicData;
    const [open, setOpen] = useState(false);
    const [subscribeItems, setSubscribeItems] = useState<SubscribeForm[]>([]);
    const [isLoadingSubscribeItems, setIsLoadingSubscribeItems] = useState(true);

    const loadSubscribeItems = async () => {
        try {
            setIsLoadingSubscribeItems(true);
            const loadedSubscribe = await getSubscriptionsForms(widget.id);
            setSubscribeItems(loadedSubscribe);
            setIsLoadingSubscribeItems(false);
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'An error occurred while trying to load the Subscribe Items',
                }),
            );
        }
    };

    useEffect(() => {
        loadSubscribeItems();
    }, [widgets]);

    if (isLoadingSubscribeItems) {
        return (
            <Paper elevation={1} sx={{ padding: '1em', minHeight: '12em' }}>
                <Skeleton />
            </Paper>
        );
    }

    return (
        <ThemeProvider theme={BaseTheme}>
            <Paper elevation={1} sx={{ padding: '1em', minHeight: '12em' }}>
                <Grid container spacing={2}>
                    <Grid size={12}>
                        <Heading2>{widget.title}</Heading2>
                        <Divider sx={{ borderWidth: 1, marginTop: 0.5 }} />
                    </Grid>
                    {subscribeItems?.map((item, index) => {
                        return (
                            <>
                                <EmailListSection subscribeOption={item} setOpen={setOpen} />
                                <Unless condition={index == subscribeItems.length - 1}>
                                    <Grid size={12}>
                                        <Divider />
                                    </Grid>
                                </Unless>
                            </>
                        );
                    })}
                </Grid>
            </Paper>
            <EmailListModal open={open} setOpen={setOpen} />
        </ThemeProvider>
    );
};

export default SubscribeWidget;
