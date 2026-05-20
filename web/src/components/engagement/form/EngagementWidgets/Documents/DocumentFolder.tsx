import React, { useState, useEffect, useContext } from 'react';
import { Box, Grid2 as Grid, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { DocumentItem } from 'models/document';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/pro-solid-svg-icons/faFolder';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons/faCircleXmark';
import { faGripDotsVertical } from '@fortawesome/pro-solid-svg-icons/faGripDotsVertical';
import { faPen } from '@fortawesome/pro-regular-svg-icons/faPen';
import { faArrowTurnDownRight } from '@fortawesome/pro-regular-svg-icons/faArrowTurnDownRight';
import { If, Then, Else, When } from 'react-if';
import DocumentSwitch from './DocumentSwitch';
import { useAppDispatch } from 'hooks';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import { deleteDocument, patchDocument, PatchDocumentRequest } from 'services/widgetService/DocumentService';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { WidgetType, Widget } from 'models/widget';
import { DocumentsContext } from './DocumentsContext';
import { updatedDiff } from 'deep-object-diff';
import { openNotification } from 'services/notificationService/notificationSlice';
import { Draggable, DraggableProvided } from '@hello-pangea/dnd';
import { DroppableBox } from 'components/common/Dragdrop';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';

const DocumentFolder = ({
    documentItem,
    draggableProvided,
}: {
    documentItem: DocumentItem;
    draggableProvided: DraggableProvided;
}) => {
    const dispatch = useAppDispatch();
    const { documents, loadDocuments } = useContext(DocumentsContext);
    const { widgets, widgetLocation } = useContext(WidgetDrawerContext);
    const documentWidget = widgets.find(
        (widget: Widget) => widget.widget_type_id === WidgetType.Document && widget.location === widgetLocation,
    );
    const [edit, setEdit] = useState<boolean>(false);
    const [document, setDocument] = useState<DocumentItem | undefined>(documentItem);
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();

    useEffect(() => {
        const updatedDocument = documents.find((document: DocumentItem) => document.id === documentItem.id);
        setDocument(updatedDocument);
    }, [documents]);

    const updateDocument = async () => {
        setEdit(false);
        if (!documentWidget || !document) {
            return;
        }
        const documentUpdatesToPatch = updatedDiff(documentItem, {
            ...document,
            title: activeLanguageCode === 'en' ? document.title : documentItem.title,
        }) as PatchDocumentRequest;

        if (Object.values(documentUpdatesToPatch).length > 0)
            await patchDocument(documentWidget.id, document.id, {
                ...documentUpdatesToPatch,
            });

        if (activeLanguageCode !== 'en') {
            const existingContentTranslations = await getEngagementContentTranslationsByCode(
                documentWidget.engagement_id,
                activeLanguageCode,
            );
            const existingTranslation = existingContentTranslations.documents_widgets.find(
                (translation) => translation.widget_documents_id === document.id,
            );
            const nextTranslations = existingTranslation
                ? existingContentTranslations.documents_widgets.map((translation) =>
                      translation.widget_documents_id === document.id
                          ? { ...translation, title: document.title }
                          : translation,
                  )
                : [
                      ...existingContentTranslations.documents_widgets,
                      {
                          widget_id: documentWidget.id,
                          widget_documents_id: document.id,
                          title: document.title,
                      },
                  ];

            await syncEngagementContentTranslationsByCode(documentWidget.engagement_id, activeLanguageCode, {
                documents_widgets: nextTranslations,
            });
        }

        await loadDocuments();
        dispatch(openNotification({ severity: 'success', text: 'Document was successfully updated' }));
    };

    const handleDeleteDocument = async () => {
        if (!documentWidget) {
            return;
        }
        deleteDocument(documentWidget.id, documentItem.id);
        await loadDocuments();
    };

    return (
        <Grid size={12} container justifyContent={'flex-start'} spacing={2} mb={2}>
            <Grid
                container
                size={12}
                p={2}
                direction="row"
                alignItems="center"
                justifyContent="flex-start"
                component={Paper}
                spacing={1}
                elevation={3}
                sx={{ width: '100%' }}
            >
                <Grid size="auto" alignItems="center" justifyContent="center">
                    <IconButton
                        sx={{ margin: '0 0.5em 0 0', padding: 0, color: 'text.secondary' }}
                        aria-label="drag-indicator"
                        {...draggableProvided.dragHandleProps}
                    >
                        <FontAwesomeIcon icon={faGripDotsVertical} style={{ fontSize: '24px', width: '24px' }} />
                    </IconButton>
                </Grid>

                <Grid size="grow">
                    <Stack spacing={2} direction="row" alignItems="center" color="text.secondary">
                        <FontAwesomeIcon icon={faFolder} style={{ fontSize: '22px' }} />
                        <If condition={!edit}>
                            <Then>
                                <Typography onClick={() => setEdit(true)}>{document?.title ?? ''}</Typography>
                            </Then>
                            <Else>
                                <TextField
                                    size="small"
                                    autoFocus
                                    sx={{ p: 0, m: 0 }}
                                    value={document?.title ?? ''}
                                    onChange={(event) =>
                                        setDocument(
                                            document
                                                ? { ...document, title: event.target.value }
                                                : { ...documentItem, title: event.target.value },
                                        )
                                    }
                                    onBlur={updateDocument}
                                />
                            </Else>
                        </If>
                    </Stack>
                </Grid>

                <Grid size="auto" container justifyContent={'flex-end'}>
                    <IconButton
                        onClick={() => setEdit(!edit)}
                        sx={{ padding: 0, mr: 1 }}
                        color="inherit"
                        aria-label="Edit Folder"
                    >
                        <FontAwesomeIcon icon={faPen} style={{ fontSize: '22px' }} />
                    </IconButton>
                    <IconButton
                        onClick={() =>
                            dispatch(
                                openNotificationModal({
                                    open: true,
                                    data: {
                                        header: 'Remove Folder',
                                        subText: [
                                            {
                                                text: 'You will be removing this folder from the engagement.',
                                            },
                                            {
                                                text: 'Do you want to remove this folder?',
                                            },
                                        ],
                                        handleConfirm: () => {
                                            handleDeleteDocument();
                                        },
                                    },
                                    type: 'confirm',
                                }),
                            )
                        }
                        sx={{ padding: 0, margin: 0 }}
                        color="inherit"
                        aria-label="Remove Folder"
                    >
                        <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '22px' }} />
                    </IconButton>
                </Grid>
            </Grid>
            <When condition={documentItem.children && documentItem.children.length > 0}>
                <Grid size={12} container justifyContent={'flex-end'}>
                    <DroppableBox droppableId={String(documentItem.id)} type="FILE" style={{ width: '100%' }}>
                        {documentItem.children?.map((item, index) => {
                            return (
                                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                                    {(provided: DraggableProvided) => (
                                        <Box mt={2} ref={provided.innerRef} {...provided.draggableProps}>
                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                <IconButton
                                                    sx={{ padding: 0, margin: 0, height: '2em' }}
                                                    style={{ color: 'inherit' }}
                                                    color="inherit"
                                                    aria-label="drag-indicator"
                                                    disabled={true}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faArrowTurnDownRight}
                                                        style={{ fontSize: '22px' }}
                                                    />
                                                </IconButton>
                                                <DocumentSwitch documentItem={item} draggableProvided={provided} />
                                            </Stack>
                                        </Box>
                                    )}
                                </Draggable>
                            );
                        })}
                    </DroppableBox>
                </Grid>
            </When>
        </Grid>
    );
};

export default DocumentFolder;
