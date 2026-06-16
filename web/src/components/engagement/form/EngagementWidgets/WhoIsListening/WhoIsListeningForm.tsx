import React, { useContext, useState, useEffect } from 'react';
import { Autocomplete, Grid2 as Grid, TextField, Divider } from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { BodyText } from 'components/common/Typography/Body';
import { Contact } from 'models/contact';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { WidgetType } from 'models/widget';
import ContactBlock from './ContactBlock';
import { WhoIsListeningContext } from './WhoIsListeningContext';
import { useCreateWidgetItemsMutation } from 'apiManager/apiSlices/widgets';
import { WidgetTitle } from '../WidgetTitle';
import { patchListeningWidget, postListeningWidget } from 'services/widgetService/ListeningService';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';

const WhoIsListeningForm = () => {
    const { setWidgetDrawerOpen, widgets, loadWidgets } = useContext(WidgetDrawerContext);
    const {
        handleAddContactDrawerOpen,
        loadingContacts,
        contacts,
        addedContacts,
        setAddedContacts,
        listeningWidget,
        setListeningWidget,
        loadListeningWidget,
    } = useContext(WhoIsListeningContext);
    const dispatch = useAppDispatch();
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [savingWidgetItems, setSavingWidgetItems] = useState(false);
    const [createWidgetItems] = useCreateWidgetItemsMutation();
    const { widgetLocation } = useContext(WidgetDrawerContext);
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const widget =
        widgets.find(
            (widget) => widget.widget_type_id === WidgetType.WhoIsListening && widget.location === widgetLocation,
        ) || null;

    useEffect(() => {
        if (!widget) return;
        const savedContacts = widget.items
            .map((widget_item) => {
                return contacts.find((contact) => contact.id === widget_item.widget_data_id);
            })
            .filter((contact) => !!contact) as Contact[];

        setAddedContacts((prevContacts: Contact[]) => {
            if (prevContacts.length === 0) {
                return savedContacts;
            }

            const prevContactIds = new Set(prevContacts.map((prevContact) => prevContact.id));

            const contactsToSet = [
                ...prevContacts,
                ...savedContacts.filter((savedContact) => !prevContactIds.has(savedContact.id)),
            ];

            const contactsMap = new Map(contacts.map((contact) => [contact.id, contact]));

            return contactsToSet.map((contactToSet) => contactsMap.get(contactToSet.id)).filter(Boolean) as Contact[];
        });
    }, [contacts, widget]);

    const addContact = async () => {
        if (!selectedContact) {
            return;
        }

        const alreadyAdded = addedContacts.map((contact) => contact.id).includes(selectedContact?.id || 0);
        if (alreadyAdded) {
            return;
        }

        setAddedContacts([...addedContacts, { ...selectedContact }]);
    };

    const saveWidgetItems = async () => {
        if (!widget) return;
        const widgetsToUpdate = addedContacts.map((addedContact) => {
            return {
                widget_id: widget.id,
                widget_data_id: addedContact.id,
            };
        });
        try {
            setSavingWidgetItems(true);
            await createWidgetItems({ widget_id: widget.id, widget_items_data: widgetsToUpdate }).unwrap();
            await loadWidgets();
            if (listeningWidget.id) {
                if (activeLanguageCode == 'en') {
                    await patchListeningWidget(widget.id, listeningWidget.id, {
                        description: listeningWidget.description,
                    });
                } else {
                    const existingTranslations = await getEngagementContentTranslationsByCode(
                        widget.engagement_id,
                        activeLanguageCode,
                    );
                    const existingTranslation = existingTranslations.widgets.find((t) => t.widget_id === widget.id);
                    const nextTranslations = existingTranslation
                        ? existingTranslations.widgets.map((t) =>
                              t.widget_id === widget.id ? { ...t, description: listeningWidget.description } : t,
                          )
                        : [
                              ...existingTranslations.widgets,
                              { widget_id: widget.id, description: listeningWidget.description },
                          ];
                    await syncEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode, {
                        widgets: nextTranslations,
                    });
                }
            } else {
                await postListeningWidget(widget.id, {
                    engagement_id: widget.engagement_id,
                    widget_id: widget.id,
                    description: listeningWidget.description,
                });
            }
            await loadListeningWidget();
            dispatch(openNotification({ severity: 'success', text: 'Widget successfully saved' }));
            setWidgetDrawerOpen(false);
            setSavingWidgetItems(false);
        } catch (error) {
            console.log(error);
            dispatch(
                openNotification({ severity: 'error', text: 'Error occurred while attempting to add the widgets' }),
            );
            setSavingWidgetItems(false);
        }
    };

    return (
        <Grid size={12} container alignItems="flex-start" justifyContent={'flex-start'} spacing={3}>
            <Grid size={12}>
                {widget && <WidgetTitle widget={widget} />}
                <Divider sx={{ marginTop: '0.5em' }} />
            </Grid>
            <Grid size={12}>
                <BodyText bold>Description (Optional)</BodyText>
                <TextField
                    name="description"
                    variant="outlined"
                    value={listeningWidget?.description}
                    onChange={(e) => {
                        setListeningWidget({ ...listeningWidget, description: e.target.value });
                    }}
                    aria-label="Description: optional."
                    slotProps={{ inputLabel: { shrink: false } }}
                    fullWidth
                    multiline
                    rows={4}
                />
            </Grid>
            <Grid size={12} container direction="row" justifyContent={'flex-start'} spacing={1}>
                <Grid size={12}>
                    <BodyText bold>Select Existing Contact</BodyText>
                    <Autocomplete
                        id="contact-selector"
                        options={contacts}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                aria-label="Select an existing contact."
                                slotProps={{ inputLabel: { shrink: false } }}
                            />
                        )}
                        getOptionLabel={(contact: Contact) => `${contact.name} - ${contact.title}`}
                        onChange={(_e: React.SyntheticEvent<Element, Event>, contact: Contact | null) =>
                            setSelectedContact(contact)
                        }
                        getOptionDisabled={(option) => addedContacts.map((contact) => contact.id).includes(option.id)}
                        disabled={loadingContacts}
                    />
                </Grid>
                <Grid>
                    <Button variant="primary" onClick={() => addContact()} fullWidth>
                        Add This Contact
                    </Button>
                </Grid>
                <Grid>
                    <Button fullWidth onClick={() => handleAddContactDrawerOpen(true)}>
                        Create New Contact
                    </Button>
                </Grid>
            </Grid>
            <Grid size={12}>
                <ContactBlock />
            </Grid>
            <Grid size={12} container direction="row" spacing={1} justifyContent={'flex-start'} marginTop="8em">
                <Grid>
                    <Button
                        variant="primary"
                        disabled={addedContacts.length === 0}
                        loading={savingWidgetItems}
                        onClick={() => saveWidgetItems()}
                    >
                        Save &amp; Close
                    </Button>
                </Grid>
                <Grid>
                    <Button onClick={() => setWidgetDrawerOpen(false)}>{`Cancel`}</Button>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default WhoIsListeningForm;
