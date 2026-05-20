import React, { useContext, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import { Grid2 as Grid, MenuItem } from '@mui/material';
import { BodyText, Heading3 } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { useForm, FormProvider, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import ControlledTextField from 'components/common/ControlledInputComponents/ControlledTextField';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { DocumentsContext } from './DocumentsContext';
import ControlledSelect from 'components/common/ControlledInputComponents/ControlledSelect';
import { postDocument, patchDocument, PatchDocumentRequest } from 'services/widgetService/DocumentService';
import { DOCUMENT_TYPE, DocumentItem } from 'models/document';
import { updatedDiff } from 'deep-object-diff';
import { WidgetLocation } from 'models/widget';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';

const schema = yup
    .object({
        name: yup.string().max(50, 'Document name should not exceed 50 characters').required(),
        link: yup.string().max(2000, 'URL should not exceed 2000 characters').required(),
        folderId: yup.number(),
    })
    .required();

type AddFileForm = yup.TypeOf<typeof schema>;

const AddFileDrawer = () => {
    const dispatch = useAppDispatch();
    const { documentToEdit, documents, loadDocuments, handleAddFileDrawerOpen, addFileDrawerOpen, widget } =
        useContext(DocumentsContext);
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const [isCreatingFile, setIsCreatingDocument] = useState(false);
    const parentDocument = documents.find(
        (document: DocumentItem) => document.id === documentToEdit?.parent_document_id,
    );
    const methods = useForm<AddFileForm>({
        resolver: yupResolver(schema) as unknown as Resolver<AddFileForm>,
        defaultValues: {
            name: '',
            link: '',
            folderId: 0,
        },
    });

    const { handleSubmit, reset } = methods;

    useEffect(() => {
        methods.setValue('name', documentToEdit?.title || '');
        methods.setValue('link', documentToEdit?.url || '');
        methods.setValue('folderId', documentToEdit?.parent_document_id || 0);
    }, [documentToEdit]);

    const handleClose = () => {
        reset();
        handleAddFileDrawerOpen(false);
    };

    const updateDocument = async (data: AddFileForm) => {
        if (!(documentToEdit && widget)) {
            return;
        }
        setIsCreatingDocument(true);
        const documentEditsToPatch = updatedDiff(documentToEdit, {
            title: activeLanguageCode === 'en' ? data.name : documentToEdit.title,
            parent_document_id: data.folderId === 0 ? null : data.folderId,
            url: data.link,
        }) as PatchDocumentRequest;
        if (Object.values(documentEditsToPatch).length > 0) {
            await patchDocument(widget.id, documentToEdit.id, {
                ...documentEditsToPatch,
            });
        }
        if (activeLanguageCode !== 'en') {
            const existingContentTranslations = await getEngagementContentTranslationsByCode(
                widget.engagement_id,
                activeLanguageCode,
            );
            const existingTranslation = existingContentTranslations.documents_widgets.find(
                (translation) => translation.widget_documents_id === documentToEdit.id,
            );
            const nextTranslations = existingTranslation
                ? existingContentTranslations.documents_widgets.map((translation) =>
                      translation.widget_documents_id === documentToEdit.id
                          ? { ...translation, title: data.name }
                          : translation,
                  )
                : [
                      ...existingContentTranslations.documents_widgets,
                      {
                          widget_id: widget.id,
                          widget_documents_id: documentToEdit.id,
                          title: data.name,
                      },
                  ];
            await syncEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode, {
                documents_widgets: nextTranslations,
            });
        }
        dispatch(
            openNotification({
                severity: 'success',
                text: 'Document was successfully updated',
            }),
        );
        await loadDocuments();
        setIsCreatingDocument(false);
        handleClose();
    };

    const createDocument = async (data: AddFileForm) => {
        if (!widget) {
            return;
        }
        setIsCreatingDocument(true);
        await postDocument(widget.id, {
            title: data.name,
            parent_document_id: data.folderId === 0 ? null : data.folderId,
            url: data.link,
            widget_id: widget.id,
            type: 'file',
            location: widget.location in WidgetLocation ? widget.location : null,
        });
        dispatch(
            openNotification({
                severity: 'success',
                text: 'Document was successfully created',
            }),
        );
        await loadDocuments();
        setIsCreatingDocument(false);
        handleClose();
    };

    const saveDocument = async (data: AddFileForm) => {
        if (documentToEdit) {
            return await updateDocument(data);
        }
        return await createDocument(data);
    };

    const onSubmit: SubmitHandler<AddFileForm> = async (data: AddFileForm) => {
        if (!widget) {
            return;
        }
        try {
            return await saveDocument(data);
        } catch (err) {
            console.log(err);
            dispatch(openNotification({ severity: 'error', text: 'An error occured while trying to save File' }));
        }
    };

    return (
        <Drawer
            anchor="right"
            open={addFileDrawerOpen}
            onClose={() => {
                handleAddFileDrawerOpen(false);
            }}
        >
            <Box sx={{ width: '40vw', paddingTop: '7em' }} role="presentation">
                <FormProvider {...methods}>
                    <Grid
                        container
                        direction="row"
                        alignItems="baseline"
                        justifyContent="flex-start"
                        spacing={2}
                        padding="2em"
                    >
                        <Grid size={12}>
                            <Heading3 bold>{documentToEdit ? 'Edit File' : 'Add File'}</Heading3>
                            <Divider sx={{ marginTop: '1em' }} />
                        </Grid>

                        <Grid size={12} container direction="row" spacing={2}>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Link
                                </BodyText>
                                <ControlledTextField
                                    name="link"
                                    id="document-link"
                                    data-testid="document-form/link"
                                    size="small"
                                    disabled={documentToEdit?.is_uploaded}
                                />
                            </Grid>
                        </Grid>

                        <Grid size={12} container direction="row" spacing={2}>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Name
                                </BodyText>
                                <ControlledTextField
                                    name="name"
                                    id="document-name"
                                    data-testid="document-form/name"
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        <Grid size={12} container direction="row" spacing={2}>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Folder
                                </BodyText>
                                <ControlledSelect
                                    id="document-folder"
                                    name="folderId"
                                    data-testid="document-form/folderId"
                                    defaultValue={parentDocument?.title}
                                    size="small"
                                >
                                    <MenuItem
                                        key={`folder-option-0`}
                                        value={0}
                                        sx={{ fontStyle: 'italic', height: '2em' }}
                                    >
                                        none
                                    </MenuItem>
                                    {documents
                                        .filter((document) => document.type === DOCUMENT_TYPE.FOLDER)
                                        .map((document) => {
                                            return (
                                                <MenuItem key={`folder-option-${document.id}`} value={document.id}>
                                                    {document.title}
                                                </MenuItem>
                                            );
                                        })}
                                </ControlledSelect>
                            </Grid>
                        </Grid>

                        <Grid
                            size={12}
                            container
                            direction="row"
                            spacing={1}
                            justifyContent={'flex-start'}
                            marginTop="8em"
                        >
                            <Grid>
                                <Button variant="primary" loading={isCreatingFile} onClick={handleSubmit(onSubmit)}>
                                    Save &amp; Close
                                </Button>
                            </Grid>
                            <Grid>
                                <Button onClick={() => handleClose()}>{`Cancel`}</Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </FormProvider>
            </Box>
        </Drawer>
    );
};

export default AddFileDrawer;
