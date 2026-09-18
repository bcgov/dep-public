import React, { useContext } from 'react';
import { Grid2 as Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import { DocumentItem } from 'models/document';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/pro-regular-svg-icons/faPen';
import { faGripDotsVertical } from '@fortawesome/pro-solid-svg-icons/faGripDotsVertical';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons/faCircleXmark';
import { useAppDispatch } from 'hooks';
import { openNotificationModal } from 'services/notificationModalService/notificationModalSlice';
import { deleteDocument } from 'services/widgetService/DocumentService';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { WidgetType, Widget } from 'models/widget';
import { DocumentsContext } from './DocumentsContext';
import { DraggableProvided } from '@hello-pangea/dnd';
import { getFileIcon } from 'helper/getFileIcon';

const DocumentFile = ({
    documentItem,
    draggableProvided,
}: {
    documentItem: DocumentItem;
    draggableProvided: DraggableProvided;
}) => {
    const dispatch = useAppDispatch();
    const { handleAddFileDrawerOpen, handleChangeDocumentToEdit, loadDocuments } = useContext(DocumentsContext);
    const { widgets, widgetLocation } = useContext(WidgetDrawerContext);
    const documentWidget = widgets.find(
        (widget: Widget) => widget.widget_type_id === WidgetType.Document && widget.location === widgetLocation,
    );

    const handleEditDocument = () => {
        handleChangeDocumentToEdit(documentItem);
        handleAddFileDrawerOpen(true);
    };

    const handleDeleteDocument = async () => {
        if (!documentWidget) {
            return;
        }
        await deleteDocument(documentWidget.id, documentItem.id);
        await loadDocuments();
    };

    return (
        <Grid size={12} container alignItems="flex-start" justifyContent={'flex-start'} spacing={2} mb={2}>
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
                <Grid sx={{ alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                        sx={{ margin: '0 0.5em 0 0', padding: 0 }}
                        color="inherit"
                        aria-label="drag-indicator"
                        {...draggableProvided.dragHandleProps}
                    >
                        <FontAwesomeIcon icon={faGripDotsVertical} style={{ fontSize: '24px', margin: '0px 4px' }} />
                    </IconButton>
                </Grid>
                <Grid size="auto">
                    <Stack spacing={2} direction="row" alignItems="center">
                        {documentItem.is_uploaded ? (
                            <FontAwesomeIcon
                                icon={getFileIcon(documentItem.file?.unique_filename ?? '', true)}
                                style={{ fontSize: '22px' }}
                            />
                        ) : (
                            <FontAwesomeIcon
                                icon={getFileIcon(documentItem.url ?? '', false)}
                                style={{ fontSize: '22px' }}
                            />
                        )}
                        <Typography>{documentItem.title}</Typography>
                    </Stack>
                </Grid>
                <Grid size="auto" container justifyContent={'flex-end'}>
                    <IconButton
                        onClick={() => handleEditDocument()}
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
                                        header: 'Remove File',
                                        subText: [
                                            {
                                                text: 'You will be removing this file from the engagement.',
                                            },
                                            { text: 'Do you want to remove this file?' },
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
                        aria-label="Remove File"
                    >
                        <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '22px' }} />
                    </IconButton>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default DocumentFile;
