import React, { useContext, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import { Grid2 as Grid } from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { BodyText, Heading3 } from 'components/common/Typography';
import ImageUpload from 'components/imageUpload';
import { useForm, FormProvider, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import ControlledTextField from 'components/common/ControlledInputComponents/ControlledTextField';
import { patchContact, postContact, PatchContactRequest, saveContactTranslation } from 'services/contactService';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { updatedDiff } from 'deep-object-diff';
import { WhoIsListeningContext } from './WhoIsListeningContext';
import { saveObject } from 'services/objectStorageService';
import { Contact } from 'models/contact';
import { useParams } from 'react-router';
import { getLanguageIdByCode } from 'services/engagementContentTranslationService';

const schema = yup
    .object({
        name: yup.string().max(50, 'Name should not exceed 50 characters').required(),
        title: yup.string().max(50, 'Title should not exceed 50 characters'),
        phone_number: yup.string().max(50, 'Phone Number should not exceed 50 characters'),
        email: yup.string().email().max(50, 'Email should not exceed 50 characters').required(),
        address: yup.string().max(150, 'Address should not exceed 150 characters'),
        bio: yup.string().max(240, 'Bio should not exceed 240 characters'),
    })
    .required();

type ContactForm = yup.TypeOf<typeof schema>;

const AddContactDrawer = () => {
    const dispatch = useAppDispatch();
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const isNonEnglish = activeLanguageCode !== 'en';
    const {
        addContactDrawerOpen,
        handleAddContactDrawerOpen,
        loadContacts,
        contactToEdit,
        handleChangeContactToEdit,
        setAddedContacts,
    } = useContext(WhoIsListeningContext);

    const [isCreatingContact, setIsCreatingContact] = useState(false);
    const [avatarFileName, setAvatarFileName] = useState(contactToEdit?.avatar_filename || '');
    const [avatarImage, setAvatarImage] = useState<File | null>(null);

    const methods = useForm<ContactForm>({
        resolver: yupResolver(schema) as unknown as Resolver<ContactForm>,
    });

    useEffect(() => {
        methods.setValue('name', contactToEdit?.name || '');
        methods.setValue('phone_number', contactToEdit?.phone_number || '');
        methods.setValue('title', contactToEdit?.title || '');
        methods.setValue('email', contactToEdit?.email || '');
        methods.setValue('address', contactToEdit?.address || '');
        methods.setValue('bio', contactToEdit?.bio || '');
        setAvatarFileName(contactToEdit?.avatar_filename || '');
    }, [contactToEdit]);

    const { handleSubmit } = methods;

    const handleUploadAvatarImage = async () => {
        if (!avatarImage) {
            return avatarFileName;
        }
        try {
            const savedDocumentDetails = await saveObject(avatarImage, { filename: avatarImage.name });
            return savedDocumentDetails?.uniquefilename || '';
        } catch (error) {
            console.log(error);
            throw new Error('Error occurred during avatar image upload');
        }
    };

    const updateContact = async (data: ContactForm) => {
        if (contactToEdit) {
            if (isNonEnglish) {
                const languageId = await getLanguageIdByCode(activeLanguageCode);
                await saveContactTranslation(contactToEdit.id, languageId, {
                    name: data.name,
                    title: data.title ?? undefined,
                    address: data.address ?? undefined,
                    bio: data.bio ?? undefined,
                });
            } else {
                const uploadedAvatarImageFileName = await handleUploadAvatarImage();
                const contactUpdatesToPatch = updatedDiff(contactToEdit, {
                    ...data,
                    avatar_filename: uploadedAvatarImageFileName,
                }) as PatchContactRequest;

                await patchContact({
                    ...contactUpdatesToPatch,
                    id: contactToEdit.id,
                });
            }

            handleChangeContactToEdit(null);
            dispatch(openNotification({ severity: 'success', text: 'Contact was successfully updated' }));
        }
    };

    const createContact = async (data: ContactForm) => {
        const uploadedAvatarImageFileName = await handleUploadAvatarImage();
        const createdContact = await postContact({
            ...data,
            avatar_filename: uploadedAvatarImageFileName,
        });
        setAddedContacts((prevContacts: Contact[]) => [...prevContacts, createdContact]);
        dispatch(openNotification({ severity: 'success', text: 'A new contact was successfully added' }));
    };

    const saveContact = async (data: ContactForm) => {
        if (contactToEdit) {
            return updateContact(data);
        }
        return createContact(data);
    };

    const onSubmit: SubmitHandler<ContactForm> = async (data: ContactForm) => {
        try {
            setIsCreatingContact(true);
            await saveContact(data);
            await loadContacts();
            setIsCreatingContact(false);
            handleCloseDrawer();
        } catch (err) {
            console.log(err);
            dispatch(openNotification({ severity: 'error', text: 'An error occured while trying to save contact' }));
            setIsCreatingContact(false);
        }
    };

    const handleAddAvatarImage = (files: File[]) => {
        if (files.length > 0) {
            setAvatarImage(files[0]);
            return;
        }

        setAvatarImage(null);
        setAvatarFileName('');
    };

    const handleCloseDrawer = () => {
        handleAddContactDrawerOpen(false);
        handleChangeContactToEdit(null);
        methods.reset();
        setAvatarFileName('');
        setAvatarImage(null);
    };

    return (
        <Drawer anchor="right" open={addContactDrawerOpen} onClose={handleCloseDrawer}>
            <Box sx={{ width: '45vw', paddingTop: '7em' }} role="presentation">
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
                            <Heading3 bold>{contactToEdit ? 'Edit' : 'Add'} Contact</Heading3>
                            <Divider sx={{ marginTop: '1em' }} />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 5 }} sx={{ minHeight: '14rem' }}>
                            <BodyText bold mb="2px">
                                Profile Picture
                            </BodyText>
                            <ImageUpload
                                height="17.813rem"
                                data-testid="contact/image-upload"
                                handleAddFile={handleAddAvatarImage}
                                savedImageUrl={contactToEdit?.avatar_url}
                                savedImageName={contactToEdit?.avatar_filename}
                                helpText={'Drop an image here or click to select one.'}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, lg: 7 }} container direction="row" spacing={2}>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Name (Required)
                                </BodyText>
                                <ControlledTextField
                                    name="name"
                                    aria-label="Name: required."
                                    id="contact-name"
                                    data-testid="contact-form/name"
                                />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Title (Optional)
                                </BodyText>
                                <ControlledTextField
                                    id="contact-title"
                                    aria-label="Title: optional."
                                    data-testid="contact-form/title"
                                    name="title"
                                />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Phone (Optional)
                                </BodyText>
                                <ControlledTextField
                                    id="contact-phone"
                                    data-testid="contact-form/phone"
                                    aria-label="Phone: optional."
                                    name="phone_number"
                                />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Email (Required)
                                </BodyText>
                                <ControlledTextField
                                    id="contact-email"
                                    data-testid="contact-form/email"
                                    aria-label="Email: optional."
                                    name="email"
                                />
                            </Grid>
                        </Grid>

                        <Grid size={12}>
                            <BodyText bold mb="2px">
                                Address (Optional)
                            </BodyText>
                            <ControlledTextField
                                id="contact-address"
                                data-testid="contact-form/address"
                                aria-label="Address: optional."
                                name="address"
                            />
                        </Grid>
                        <Grid size={12}>
                            <BodyText bold mb="2px">
                                Biography (Optional)
                            </BodyText>
                            <ControlledTextField
                                id="contact-bio"
                                data-testid="contact-form/bio"
                                aria-label="Biography: optional."
                                name="bio"
                                multiline
                                minRows={5}
                            />
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
                                <Button variant="primary" loading={isCreatingContact} onClick={handleSubmit(onSubmit)}>
                                    Save &amp; Close
                                </Button>
                            </Grid>
                            <Grid>
                                <Button onClick={handleCloseDrawer}>Cancel</Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </FormProvider>
            </Box>
        </Drawer>
    );
};

export default AddContactDrawer;
