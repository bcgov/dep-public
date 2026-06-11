import React, { useEffect, useState } from 'react';
import { BodyText, Heading2 } from 'components/common/Typography';
import { Grid2 as Grid, Avatar, Skeleton } from '@mui/material';
import { Widget } from 'models/widget';
import { Contact } from 'models/contact';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { When } from 'react-if';
import { useLazyGetContactQuery } from 'apiManager/apiSlices/contacts';
import { Link } from 'components/common/Navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/pro-regular-svg-icons';
import { fetchListeningWidget } from 'services/widgetService/ListeningService';
import { ListeningWidget } from 'models/listeningWidget';

interface WhoIsListeningWidgetProps {
    widget: Widget;
}
const WhoIsListeningWidget = ({ widget }: WhoIsListeningWidgetProps) => {
    const dispatch = useAppDispatch();
    const [getContactTrigger] = useLazyGetContactQuery();

    const [isLoading, setIsLoading] = useState(true);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [listeningWidget, setListeningWidget] = useState<ListeningWidget>();

    const fetchContacts = async () => {
        try {
            const contacts = await Promise.all(
                widget.items.map((widgetItem) => {
                    const contact = getContactTrigger(widgetItem.widget_data_id, true).unwrap();
                    return contact;
                }),
            );

            setContacts(contacts);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.log(error);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while fetching engagement widget information',
                }),
            );
        }
    };

    const getListeningWidget = async () => {
        try {
            const listeningWidget = await fetchListeningWidget(widget.id);
            setListeningWidget(listeningWidget);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.log(error);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while fetching Who Is Listening widget information',
                }),
            );
        }
    };

    useEffect(() => {
        fetchContacts();
        getListeningWidget();
    }, [widget]);

    const avatarStyles = {
        height: 72,
        width: 72,
    };

    if (isLoading) {
        return (
            <Grid container justifyContent="flex-start" spacing={3} width="100%">
                <Grid size={12}>
                    <Skeleton>
                        <Heading2 weight="thin" decorated mb={0}>
                            Who is Listening
                        </Heading2>
                    </Skeleton>
                </Grid>
                <Grid size={12}>
                    <Skeleton variant="rectangular" height="10em" width="100%" />
                </Grid>
                <Grid size={12}>
                    <Skeleton variant="rectangular" height="10em" width="100%" />
                </Grid>
            </Grid>
        );
    }

    if (contacts.length === 0) {
        return null;
    }

    return (
        <Grid container direction="row" size={12}>
            <Grid justifyContent="flex-start" size={12}>
                <Heading2 weight="thin" decorated mb={0}>
                    {widget.title}
                </Heading2>
            </Grid>
            <Grid size={12} sx={{ whiteSpace: 'pre-line' }}>
                <BodyText>{widget.description ?? listeningWidget?.description}</BodyText>
            </Grid>

            {contacts.map((contact) => {
                return (
                    <Grid key={contact.id} container sx={{ margin: '2rem 0 0.5rem' }} columnSpacing={3} size={12}>
                        <Grid size="auto">
                            <Avatar
                                src={contact.avatar_url}
                                alt={contact.name}
                                sizes="lg"
                                variant="circular"
                                sx={avatarStyles}
                            />
                        </Grid>
                        <Grid
                            container
                            justifyContent="flex-start"
                            alignItems="flex-start"
                            direction="column"
                            columnSpacing={1}
                            size="grow"
                        >
                            <Grid container justifyContent="flex-start" size={12}>
                                <BodyText bold size="small">
                                    {contact.name}
                                </BodyText>
                            </Grid>
                            <When condition={Boolean(contact.title)}>
                                <Grid container justifyContent="flex-start" size={12}>
                                    <BodyText size="small">{contact.title}</BodyText>
                                </Grid>
                            </When>
                            <When condition={Boolean(contact.bio)}>
                                <Grid container justifyContent="flex-start" size={12} sx={{ whiteSpace: 'pre-line' }}>
                                    <BodyText size="small" aria-label="Contact biography:">
                                        {contact.bio}
                                    </BodyText>
                                </Grid>
                            </When>
                            <Grid mt="0.75rem" container justifyContent="flex-start" alignItems="center" size={12}>
                                <FontAwesomeIcon
                                    style={{ fontSize: '1rem' }}
                                    icon={faEnvelope}
                                    aria-label="Email address:"
                                />{' '}
                                <Link size="small" href={`mailto:${contact.email}`}>
                                    {' ' + contact.email}
                                </Link>
                            </Grid>
                            <Grid container justifyContent="flex-start" alignItems="center" size={12}>
                                <When condition={Boolean(contact.phone_number)}>
                                    <FontAwesomeIcon
                                        style={{ fontSize: '1rem' }}
                                        icon={faPhone}
                                        aria-label="Phone number:"
                                    />{' '}
                                    <Link size="small" href={`tel:${contact.phone_number}`}>
                                        {' ' + contact.phone_number}
                                    </Link>
                                </When>
                            </Grid>
                        </Grid>
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default WhoIsListeningWidget;
