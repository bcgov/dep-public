import React, { useContext, useState } from 'react';
import { Grid2 as Grid } from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { BodyText } from 'components/common/Typography/Body';
import { TextField } from 'components/common/Input/TextInput';
import { When } from 'react-if';
import { DocumentsContext } from './DocumentsContext';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { postDocument } from 'services/widgetService/DocumentService';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { WidgetType, WidgetLocation } from 'models/widget';
import { DOCUMENT_TYPE } from 'models/document';

const CreateFolderForm = () => {
    const { loadDocuments, handleAddFileDrawerOpen, setUploadFileDrawerOpen } = useContext(DocumentsContext);
    const { widgets, widgetLocation } = useContext(WidgetDrawerContext);
    const dispatch = useAppDispatch();
    const [createFolderMode, setCreateFolderMode] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [folderName, setFolderName] = useState('');
    const initialFormError = {
        name: false,
    };
    const [formError, setFormError] = useState(initialFormError);
    const widget = widgets.find(
        (widget) => widget.widget_type_id === WidgetType.Document && widget.location === widgetLocation,
    );

    const validateForm = () => {
        const errors = { name: !folderName || folderName.length > 50 };
        setFormError(errors);
        return !Object.values(errors).every(Boolean);
    };

    const getErrorMessage = () => {
        if (folderName.length > 50) {
            return 'Folder name must not exceed 50 characters';
        } else if (!folderName && formError.name) {
            return 'Folder name must be specified';
        }
        return '';
    };

    const handleCreateFolder = async () => {
        if (!widget || !validateForm()) {
            return;
        }
        try {
            setCreatingFolder(true);
            await postDocument(widget.id, {
                title: folderName,
                widget_id: widget.id,
                type: DOCUMENT_TYPE.FOLDER,
                location: widget.location in WidgetLocation ? widget.location : null,
            });
            await loadDocuments();
            setCreatingFolder(false);
            setCreateFolderMode(false);
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'An error occured while creating the folder' }));
            setCreatingFolder(false);
        }
    };

    const handleFolderNameChange = (name: string) => {
        validateForm();
        setFolderName(name);
    };

    return (
        <>
            <Grid size={12} container direction="row" justifyContent={'flex-start'} spacing={1} sx={{ mb: 5 }}>
                <Grid>
                    <Button size="small" onClick={() => setCreateFolderMode(true)}>
                        Create Folder
                    </Button>
                </Grid>
                <Grid>
                    <Button size="small" onClick={() => handleAddFileDrawerOpen(true)}>
                        Add Document Link
                    </Button>
                </Grid>
                <Grid>
                    <Button size="small" onClick={() => setUploadFileDrawerOpen(true)}>
                        Upload Document
                    </Button>
                </Grid>
            </Grid>

            <When condition={createFolderMode}>
                <Grid size={12} container direction="row" justifyContent={'center'} mb={5}>
                    <Grid size={12}>
                        <BodyText bold>Folder name</BodyText>
                    </Grid>
                    <Grid container justifyContent={'flex-start'} spacing={2} size={12} sx={{ p: 0 }}>
                        <Grid size={{ sm: 12, lg: 8 }} sx={{ p: 0 }}>
                            <TextField
                                width="100%"
                                p={0}
                                m={0}
                                onChange={(value) => handleFolderNameChange(value)}
                                error={getErrorMessage()}
                            />
                        </Grid>
                        <Grid container size={12}>
                            <Grid size="auto">
                                <Button
                                    variant="primary"
                                    data-testid="create-folder-form/save-button"
                                    sx={{ mb: 1 }}
                                    loading={creatingFolder}
                                    onClick={handleCreateFolder}
                                >
                                    Save
                                </Button>
                            </Grid>
                            <Grid size="auto">
                                <Button sx={{ mb: 1 }} onClick={() => setCreateFolderMode(false)}>
                                    Cancel
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </When>
        </>
    );
};

export default CreateFolderForm;
