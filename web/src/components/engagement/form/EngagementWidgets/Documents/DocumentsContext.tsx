import React, { createContext, useState, useEffect, useContext, JSX, useMemo } from 'react';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { ActionContext } from '../../ActionContext';
import { DocumentItem } from 'models/document';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { Widget, WidgetType } from 'models/widget';
import { fetchDocuments } from 'services/widgetService/DocumentService';
import { useParams } from 'react-router';
import { getEngagementContentTranslationsByCode } from 'services/engagementContentTranslationService';

export interface DocumentsContextProps {
    documentToEdit: DocumentItem | null;
    loadingDocuments: boolean;
    documents: DocumentItem[];
    loadDocuments: () => Promise<DocumentItem[] | undefined>;
    addFileDrawerOpen: boolean;
    handleAddFileDrawerOpen: (_open: boolean) => void;
    widget: Widget | null;
    handleChangeDocumentToEdit: (_document: DocumentItem | null) => void;
    setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
    uploadFileDrawerOpen: boolean;
    setUploadFileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export type EngagementParams = {
    engagementId: string;
};

export const DocumentsContext = createContext<DocumentsContextProps>({
    documentToEdit: null,
    loadingDocuments: false,
    documents: [],
    loadDocuments: () => Promise.resolve([]),
    addFileDrawerOpen: false,
    handleAddFileDrawerOpen: (_open: boolean) => {
        /* empty default method  */
    },
    handleChangeDocumentToEdit: () => {
        /* empty default method  */
    },
    widget: null,
    setDocuments: () => {
        throw new Error('setDocuments() not implemented');
    },
    uploadFileDrawerOpen: false,
    setUploadFileDrawerOpen: () => {
        throw new Error('setUploadFileDrawerOpen not implemented');
    },
});

export const DocumentsProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const dispatch = useAppDispatch();
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const { widgets, isWidgetInScope } = useContext(WidgetDrawerContext);
    const { savedEngagement } = useContext(ActionContext);
    const [documentToEdit, setDocumentToEdit] = useState<DocumentItem | null>(null);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loadingDocuments, setLoadingDocuments] = useState(true);
    const [addFileDrawerOpen, setAddFileDrawerOpen] = useState(false);
    const [uploadFileDrawerOpen, setUploadFileDrawerOpen] = useState(false);

    const widget =
        widgets.find((widget) => isWidgetInScope(widget) && widget.widget_type_id === WidgetType.Document) || null;

    const loadDocuments = async () => {
        try {
            if (!savedEngagement.id || !widget) {
                setLoadingDocuments(false);
                return [];
            }
            setLoadingDocuments(true);
            const savedDocuments = await fetchDocuments(widget.id);
            if (activeLanguageCode === 'en') {
                setDocuments(savedDocuments);
            } else {
                const contentTranslations = await getEngagementContentTranslationsByCode(
                    widget.engagement_id,
                    activeLanguageCode,
                );
                const documentTranslationsById = new Map(
                    contentTranslations.documents_widgets.map((translation) => [
                        translation.widget_documents_id,
                        translation,
                    ]),
                );

                const applyDocumentTranslations = (items: DocumentItem[]): DocumentItem[] => {
                    return items.map((item) => {
                        const translatedItem = documentTranslationsById.get(item.id);
                        return {
                            ...item,
                            title: translatedItem?.title ?? item.title,
                            children: item.children ? applyDocumentTranslations(item.children) : item.children,
                        };
                    });
                };

                setDocuments(applyDocumentTranslations(savedDocuments));
            }
            setLoadingDocuments(false);
            return documents;
        } catch (error) {
            console.log(error);
            dispatch(
                openNotification({ severity: 'error', text: 'Error occurred while attempting to load documents' }),
            );
            setLoadingDocuments(false);
        }
    };
    const handleChangeDocumentToEdit = (document: DocumentItem | null) => {
        setDocumentToEdit(document);
    };

    const handleAddFileDrawerOpen = (open: boolean) => {
        setAddFileDrawerOpen(open);
        if (!open && documentToEdit) {
            setDocumentToEdit(null);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [savedEngagement, widget, activeLanguageCode]);

    const contextValue = useMemo(
        () => ({
            handleChangeDocumentToEdit,
            documentToEdit,
            loadingDocuments,
            documents,
            setDocuments,
            loadDocuments,
            addFileDrawerOpen,
            handleAddFileDrawerOpen,
            widget,
            uploadFileDrawerOpen,
            setUploadFileDrawerOpen,
        }),
        [
            handleChangeDocumentToEdit,
            documentToEdit,
            loadingDocuments,
            documents,
            setDocuments,
            loadDocuments,
            addFileDrawerOpen,
            handleAddFileDrawerOpen,
            widget,
            uploadFileDrawerOpen,
            setUploadFileDrawerOpen,
        ],
    );

    return <DocumentsContext.Provider value={contextValue}>{children}</DocumentsContext.Provider>;
};
