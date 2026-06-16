import React, { createContext, useState, useEffect, useContext, JSX } from 'react';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { Contact } from 'models/contact';
import { useLazyGetContactsQuery } from 'apiManager/apiSlices/contacts';
import { fetchListeningWidget } from 'services/widgetService/ListeningService';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { WidgetType } from 'models/widget';
import { ListeningWidget } from 'models/listeningWidget';
import { useParams, useRouteLoaderData } from 'react-router';
import { getContactTranslation } from 'services/contactService';
import {
    getEngagementContentTranslationsByCode,
    getLanguageIdByCode,
} from 'services/engagementContentTranslationService';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';

export interface WhoIsListeningContextProps {
    contactToEdit: Contact | null;
    addContactDrawerOpen: boolean;
    handleAddContactDrawerOpen: (_open: boolean) => void;
    loadingContacts: boolean;
    contacts: Contact[];
    loadContacts: () => Promise<Contact[] | undefined>;
    listeningWidget: ListeningWidget;
    setListeningWidget: React.Dispatch<React.SetStateAction<ListeningWidget>>;
    loadListeningWidget: () => Promise<ListeningWidget | undefined>;
    handleChangeContactToEdit: (_contact: Contact | null) => void;
    setAddedContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
    addedContacts: Contact[];
}

export type EngagementParams = {
    engagementId: string;
};

const emptyListeningWidget = {
    id: 0,
    engagement_id: 0,
    widget_id: 0,
    description: '',
};

export const WhoIsListeningContext = createContext<WhoIsListeningContextProps>({
    loadingContacts: false,
    contactToEdit: null,
    addContactDrawerOpen: false,
    handleAddContactDrawerOpen: (_open: boolean) => {
        /*empty*/
    },
    contacts: [],
    loadContacts: () => Promise.resolve([]),
    listeningWidget: emptyListeningWidget,
    setListeningWidget: (updatedListeningWidget: React.SetStateAction<ListeningWidget>) => emptyListeningWidget,
    loadListeningWidget: () => Promise.resolve(emptyListeningWidget),
    handleChangeContactToEdit: () => {
        /*empty*/
    },
    setAddedContacts: (updatedContacts: React.SetStateAction<Contact[]>) => [],
    addedContacts: [],
});

export const WhoIsListeningProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const savedEngagement = React.use(
        (useRouteLoaderData('single-engagement') as EngagementLoaderAdminData)?.engagement,
    );
    const [getContactsTrigger] = useLazyGetContactsQuery();
    const dispatch = useAppDispatch();
    const { widgets, isWidgetInScope } = useContext(WidgetDrawerContext);
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const isNonEnglish = activeLanguageCode !== 'en';
    const widget =
        widgets.find((widget) => isWidgetInScope(widget) && widget.widget_type_id === WidgetType.WhoIsListening) ||
        null;

    const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
    const [addContactDrawerOpen, setAddContactDrawerOpen] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [listeningWidget, setListeningWidget] = useState<ListeningWidget>(emptyListeningWidget);
    const [addedContacts, setAddedContacts] = useState<Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(true);

    useEffect(() => {
        loadContacts();
        loadListeningWidget();
    }, [savedEngagement, activeLanguageCode]);

    const loadContacts = async () => {
        try {
            if (!savedEngagement.id) {
                setLoadingContacts(false);
                return Promise.resolve([]);
            }
            setLoadingContacts(true);
            const loadedContacts = await getContactsTrigger(undefined, false).unwrap();

            if (isNonEnglish) {
                const languageId = await getLanguageIdByCode(activeLanguageCode);
                const translatedContacts = await Promise.all(
                    loadedContacts.map(async (contact) => {
                        const translation = await getContactTranslation(contact.id, languageId);
                        if (!translation) return contact;
                        return {
                            ...contact,
                            name: translation.name ?? contact.name,
                            title: translation.title ?? contact.title,
                            address: translation.address ?? contact.address,
                            bio: translation.bio ?? contact.bio,
                        };
                    }),
                );
                setContacts(translatedContacts);
                setLoadingContacts(false);
                return translatedContacts;
            }

            setContacts(loadedContacts);
            setLoadingContacts(false);
            return loadedContacts;
        } catch (error) {
            console.log(error);
            dispatch(openNotification({ severity: 'error', text: 'Error occurred while attempting to load contacts' }));
            setLoadingContacts(false);
        }
    };

    const loadListeningWidget = async () => {
        try {
            if (!savedEngagement.id || !widget?.id) {
                return Promise.resolve(emptyListeningWidget);
            }
            const loadedListeningWidget = await fetchListeningWidget(widget.id);

            if (isNonEnglish) {
                const contentTranslations = await getEngagementContentTranslationsByCode(
                    savedEngagement.id,
                    activeLanguageCode,
                );
                const widgetTranslation = contentTranslations.widgets.find((t) => t.widget_id === widget.id);
                if (widgetTranslation?.description != null) {
                    const translated = {
                        ...loadedListeningWidget,
                        description: widgetTranslation.description,
                    };
                    setListeningWidget(translated);
                    return translated;
                }
            }

            setListeningWidget(loadedListeningWidget);
            return loadedListeningWidget;
        } catch (error) {
            console.log(error);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while attempting to load Who is Listening description',
                }),
            );
        }
    };

    const handleChangeContactToEdit = (contact: Contact | null) => {
        setContactToEdit(contact);
    };

    const handleAddContactDrawerOpen = (open: boolean) => {
        setAddContactDrawerOpen(open);
    };

    return (
        <WhoIsListeningContext.Provider
            value={{
                addContactDrawerOpen,
                handleAddContactDrawerOpen,
                loadingContacts,
                contacts,
                loadContacts,
                listeningWidget,
                setListeningWidget,
                loadListeningWidget,
                contactToEdit,
                handleChangeContactToEdit,
                setAddedContacts,
                addedContacts,
            }}
        >
            {children}
        </WhoIsListeningContext.Provider>
    );
};
