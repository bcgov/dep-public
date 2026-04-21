import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Grid2 as Grid } from '@mui/material';
import { BodyText, Heading1 } from 'components/common/Typography';
import { Banner } from 'components/banner/Banner';
import LandingPageBanner from 'assets/images/LandingPageBanner.png';
import { useAppDispatch, useAppSelector, useAppTranslation } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons/faCircleCheck';
import { SubscriptionParams, SubscriptionType } from './types';
import { verifyEmailVerification } from 'services/emailVerificationService';
import { confirmSubscription, unSubscribe } from 'services/subscriptionService';

export const Subscription = () => {
    const { t: translate } = useAppTranslation();
    const { engagementId, scriptionAction, scriptionKey } = useParams<SubscriptionParams>();
    const [subscriptionText, setSubscriptionText] = useState(['']);

    const dispatch = useAppDispatch();

    const tenant = useAppSelector((state) => state.tenant);

    useEffect(() => {
        verifySubscribeKey();
    }, [scriptionKey]);

    const verifySubscribeKey = async () => {
        console.log('verifying subscribe key', scriptionKey);
        try {
            if (!scriptionKey) {
                return;
            }
            if (scriptionAction == SubscriptionType.SUBSCRIBE) {
                const token = scriptionKey;
                const subscribed_email = await verifyEmailVerification(token);
                const subscribed = JSON.stringify(subscribed_email);
                await confirmSubscription({
                    engagement_id: Number.parseInt(engagementId ?? ''),
                    participant_id: JSON.parse(subscribed).participant_id,
                    is_subscribed: true,
                });
                setSubscriptionText([translate('subscription.subscribe')]);
            }
            if (scriptionAction == SubscriptionType.UNSUBSCRIBE) {
                const participant_id = scriptionKey;
                await unSubscribe({
                    participant_id: Number.parseInt(participant_id ?? ''),
                    is_subscribed: false,
                });
                setSubscriptionText([
                    translate('subscription.unSubscribe.0'),
                    '',
                    translate('subscription.unSubscribe.1'),
                    translate('subscription.unSubscribe.2'),
                    '',
                    translate('subscription.unSubscribe.3'),
                ]);
            }
        } catch (error) {
            dispatch(openNotification({ severity: 'error', text: translate('subscription.notification') }));
            throw error;
        }
    };

    return (
        <Grid container direction="row" justifyContent={'center'} alignItems="center">
            <Grid size={12}>
                <Banner height={'330px'} imageUrl={LandingPageBanner}>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="flex-start"
                        height="100%"
                        sx={{
                            position: 'absolute',
                            top: '0px',
                            left: '0px',
                        }}
                    >
                        <Grid
                            size={{ lg: 6, sm: 12 }}
                            container
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="flex-start"
                            sx={{
                                backgroundColor: 'rgba(242, 242, 242, 0.95)',
                                padding: '1em',
                                margin: '1em',
                                maxWidth: '90%',
                            }}
                            m={{ lg: '3em 5em 0 3em', md: '3em', sm: '1em' }}
                            rowSpacing={2}
                        >
                            <Grid size={12}>
                                <Heading1>{tenant?.name}</Heading1>
                            </Grid>
                            <Grid size={12}>
                                <BodyText>{translate('subscription.paragraph')}</BodyText>
                            </Grid>
                        </Grid>
                    </Grid>
                </Banner>
            </Grid>
            <Grid
                size={12}
                container
                direction="row"
                justifyContent="flex-start"
                alignItems="flex-start"
                sx={{
                    padding: '1em',
                    maxWidth: '100%',
                }}
                m={{ lg: '3em 5em 0 3em', md: '3em', sm: '1em' }}
                rowSpacing={2}
            >
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 30, color: '#2e8540', padding: '5px 0px' }} />
                <BodyText bold m={{ lg: '.5em 0 0 .5em', md: '3em', sm: '1em' }}>
                    {subscriptionText.map((text) => (
                        <>
                            {text}
                            <br />
                        </>
                    ))}
                </BodyText>
            </Grid>
        </Grid>
    );
};

export default Subscription;
