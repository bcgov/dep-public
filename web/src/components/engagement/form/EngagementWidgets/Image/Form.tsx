import React, { useContext, useEffect } from 'react';
import Divider from '@mui/material/Divider';
import { Grid2 as Grid } from '@mui/material';
import { BodyText } from 'components/common/Typography';
import { useForm, SubmitHandler, Controller, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { patchImage, postImage } from 'services/widgetService/ImageService';
import { updatedDiff } from 'deep-object-diff';
import { WidgetTitle } from '../WidgetTitle';
import { Widget, WidgetLocation } from 'models/widget';
import ImageUpload from 'components/imageUpload';
import { useAsyncValue } from 'react-router';
import { ImageWidget } from 'models/imageWidget';
import { Button, TextField } from 'components/common/Input';
import { saveObject } from 'services/objectStorageService';
import { SystemMessage } from 'components/common/Layout/SystemMessage';
import { When } from 'react-if';

const Form = () => {
    const schema = yup
        .object({
            image_url: yup.string().required('Please upload an image'),
            description: yup.string().max(500, 'Description cannot exceed 500 characters'),
            alt_text: yup.string().max(255, 'Alt text cannot exceed 255 characters'),
        })
        .required();

    type ImageWidgetForm = yup.TypeOf<typeof schema>;
    const dispatch = useAppDispatch();
    const [widget, imageWidget] = useAsyncValue() as [Widget, ImageWidget];
    const [previewImage, setPreviewImage] = React.useState<File | null>(null);
    const { setWidgetDrawerOpen } = useContext(WidgetDrawerContext);
    const [isCreating, setIsCreating] = React.useState(false);

    const imageForm = useForm<ImageWidgetForm>({
        resolver: yupResolver(schema) as unknown as Resolver<ImageWidgetForm>,
    });

    const {
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors },
    } = imageForm;

    useEffect(() => {
        if (imageWidget) {
            setValue('description', imageWidget.description || '');
            setValue('image_url', imageWidget.image_url);
            setValue('alt_text', imageWidget.alt_text || '');
        }
    }, [imageWidget]);

    const handleAddImageFile = (files: File[]) => {
        if (files.length > 0) {
            setPreviewImage(files[0]);
            setValue('image_url', files[0].name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            return;
        }

        setPreviewImage(null);
        setValue('image_url', '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    };

    const handleUploadImageFile = async () => {
        if (!previewImage) {
            return;
        }
        try {
            const savedImage = await saveObject(previewImage, { filename: previewImage.name });
            return savedImage?.uniquefilename || '';
        } catch (error) {
            console.error(error);
            throw new Error('Error occurred during banner image upload');
        }
    };

    const createImage = async (data: ImageWidgetForm) => {
        const validatedData = await schema.validate(data);
        const { alt_text, image_url, description } = validatedData;
        await postImage(widget.id, {
            widget_id: widget.id,
            engagement_id: widget.engagement_id,
            image_url: image_url,
            alt_text: alt_text,
            description: description,
            location: widget.location in WidgetLocation ? widget.location : null,
        });
        dispatch(openNotification({ severity: 'success', text: 'A new image was successfully added' }));
    };

    const updateImage = async (data: ImageWidgetForm) => {
        const validatedData = await schema.validate(data);
        const updatedData = updatedDiff(
            {
                image_url: imageWidget.image_url,
                alt_text: imageWidget.alt_text,
                description: imageWidget.description,
            },
            {
                image_url: validatedData.image_url,
                alt_text: validatedData.alt_text,
                description: validatedData.description,
            },
        );
        if (Object.keys(updatedData).length === 0) {
            return;
        }
        await patchImage(imageWidget.widget_id, imageWidget.id, {
            ...updatedData,
        });
        dispatch(openNotification({ severity: 'success', text: 'The image widget was successfully updated' }));
    };

    const saveImageWidget = async (data: ImageWidgetForm) => {
        if (!widget) {
            return;
        }
        if (!imageWidget) {
            return createImage(data);
        }
        return updateImage(data);
    };

    const uploadImageAndSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        if (previewImage) {
            const image_url = await handleUploadImageFile();
            setValue('image_url', image_url);
        }
        await handleSubmit(onSubmit)();
    };

    const onSubmit: SubmitHandler<ImageWidgetForm> = async (data: ImageWidgetForm) => {
        if (!widget) {
            return;
        }
        try {
            setIsCreating(true);
            await saveImageWidget(data);
            setIsCreating(false);
            reset({});
            setWidgetDrawerOpen(false);
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'An error occurred while trying to add image' }));
            setIsCreating(false);
        }
    };

    return (
        <Grid size={12} container alignItems="flex-start" justifyContent={'flex-start'} spacing={3}>
            <Grid size={12}>
                <WidgetTitle widget={widget} />
                <Divider sx={{ marginTop: '0.5em' }} />
            </Grid>
            <Grid size={12}>
                <form onSubmit={uploadImageAndSubmit}>
                    <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start" spacing={2}>
                        <Grid size={12}>
                            <label htmlFor="description">
                                <BodyText bold>Description</BodyText>
                            </label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        id="description"
                                        placeholder="Description"
                                        multiline
                                        maxRows={4}
                                        minRows={4}
                                    />
                                )}
                            />
                            <When condition={errors.description?.message !== undefined}>
                                <SystemMessage sx={{ mt: 2 }} status="danger">
                                    {errors.description?.message}
                                </SystemMessage>
                            </When>
                        </Grid>
                        <Grid size={12}>
                            <label htmlFor="select-file-button">
                                <BodyText bold>Image Upload</BodyText>
                            </label>
                            <Controller
                                name="image_url"
                                control={control}
                                render={({ field }) => (
                                    <ImageUpload
                                        height="15em"
                                        handleAddFile={handleAddImageFile}
                                        cropAspectRatio={3 / 2}
                                        savedImageUrl={field.value}
                                    />
                                )}
                            />
                            <When condition={errors.image_url?.message !== undefined}>
                                <SystemMessage sx={{ mt: 2 }} status="danger">
                                    {errors.image_url?.message}
                                </SystemMessage>
                            </When>
                        </Grid>
                        <Grid size={12}>
                            <label htmlFor="alt_text">
                                <BodyText bold>Image Alt Text</BodyText>
                            </label>
                            <Controller
                                name="alt_text"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} id="alt_text" multiline maxRows={4} placeholder="Alt Text" />
                                )}
                            />
                            <When condition={errors.alt_text?.message !== undefined}>
                                <SystemMessage sx={{ mt: 2 }} status="danger">
                                    Error: {errors.alt_text?.message}
                                </SystemMessage>
                            </When>
                        </Grid>
                        <Grid
                            size={12}
                            container
                            direction="row"
                            alignItems={'flex-start'}
                            justifyContent="flex-start"
                            spacing={2}
                            mt={'3em'}
                        >
                            <Grid>
                                <Button variant="primary" type="submit" disabled={isCreating}>
                                    Save & Close
                                </Button>
                            </Grid>
                            <Grid>
                                <Button onClick={() => setWidgetDrawerOpen(false)}>Cancel</Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </form>
            </Grid>
        </Grid>
    );
};

export default Form;
