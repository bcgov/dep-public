import React, { useEffect, useState } from 'react';
import { Box, FormGroup } from '@mui/material';
import { Button, TextAreaField, TextField } from 'components/common/Input';
import { DetailsContainer, Detail } from 'components/common/Layout';
import { BodyText } from 'components/common/Typography/';
import ImageUpload from 'components/imageUpload';
import { Tenant } from 'models/tenant';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { saveObject } from 'services/objectStorageService';
import { UploadGuidelines } from 'components/imageUpload/UploadGuidelines';
import { Await, useRouteLoaderData } from 'react-router';
import UnsavedWorkConfirmation from 'components/common/Navigation/UnsavedWorkConfirmation';

export const TenantForm = ({
    initialTenant,
    onSubmit,
    submitText = 'Save',
    onCancel,
    cancelText = 'Cancel',
}: {
    initialTenant?: Tenant;
    onSubmit: (data: Tenant) => void;
    submitText?: string;
    onCancel?: () => void;
    cancelText?: string;
}) => {
    const [bannerImage, setBannerImage] = useState<File | null>();
    const [savedBannerImageFileName, setSavedBannerImageFileName] = useState(initialTenant?.hero_image_url ?? '');
    const tenants = useRouteLoaderData('tenant-admin') as Promise<Tenant[]>;

    const { handleSubmit, formState, control, reset, setValue, watch } = useForm<Tenant>({
        defaultValues: {
            ...(initialTenant || {
                name: '',
                contact_name: '',
                contact_email: '',
                short_name: '',
                title: '',
                description: '',
                hero_image_url: '',
                hero_image_credit: '',
                hero_image_description: '',
            }),
        },
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });
    const { isDirty, isSubmitted, isValid, errors } = formState;

    const hasheroImageUrl = watch('hero_image_url');

    useEffect(() => {
        reset({
            ...(initialTenant || {
                name: '',
                contact_name: '',
                contact_email: '',
                short_name: '',
                title: '',
                description: '',
                hero_image_url: '',
                hero_image_credit: '',
                hero_image_description: '',
            }),
        });
        setSavedBannerImageFileName(initialTenant?.hero_image_url ?? '');
        setValue('hero_image_url', initialTenant?.hero_image_url ?? '');
    }, [initialTenant, reset]);

    const handleAddHeroImage = (files: File[]) => {
        if (files.length > 0) {
            setBannerImage(files[0]);
            setSavedBannerImageFileName(files[0].name);
            setValue('hero_image_url', files[0].name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            return;
        }

        setBannerImage(null);
        setSavedBannerImageFileName('');
        setValue('hero_image_url', '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    };

    const handleUploadHeroImage = async () => {
        if (!bannerImage) {
            return savedBannerImageFileName;
        }
        try {
            const savedDocumentDetails = await saveObject(bannerImage, { filename: bannerImage.name });
            return savedDocumentDetails?.uniquefilename || '';
        } catch (error) {
            console.log(error);
            throw new Error('Error occurred during banner image upload');
        }
    };

    const onFormSubmit: SubmitHandler<Tenant> = async (data) => {
        try {
            data.hero_image_url = await handleUploadHeroImage();
            if (!data.hero_image_url) {
                data.hero_image_credit = '';
                data.hero_image_description = '';
            }
            onSubmit(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleKeys = (event: React.KeyboardEvent) => {
        // Handle as many key combinations as possible
        if ((event.ctrlKey || event.metaKey || event.altKey) && event.key === 'Enter') {
            event.nativeEvent.stopImmediatePropagation();
            event.preventDefault(); // Prevent default to stop any native form submission
            handleSubmit(onFormSubmit)();
        }
    };

    return (
        <FormGroup onKeyDown={handleKeys}>
            <UnsavedWorkConfirmation blockNavigationWhen={isDirty && !isSubmitted} />
            <DetailsContainer
                sx={{
                    maxWidth: '1000px',
                    margin: {
                        // on small screens, negate the padding of the ResponsiveContainer
                        // so the container hugs the edge of the screen
                        xs: '0 -16px',
                        sm: '0',
                    },
                    '& .dep-input-form-field-title': {
                        fontSize: '18px',
                    },
                }}
            >
                <Detail>
                    <Controller
                        name="name"
                        control={control}
                        rules={{
                            required: true,
                            maxLength: { value: 50, message: 'This name is too long!' },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                autoFocus // field recieves focus when the form is rendered
                                title="Tenant Instance Name"
                                instructions="The name of the tenant instance"
                                placeholder="Name"
                                error={errors.name?.message}
                                required
                                counter
                                maxLength={50}
                            />
                        )}
                    />
                </Detail>
                <Detail>
                    <Controller
                        name="contact_name"
                        control={control}
                        rules={{
                            required: true,
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                title="Primary Contact Name"
                                instructions="Who should people contact about this tenant instance?"
                                placeholder="Full Name"
                                error={errors.contact_name?.message}
                                required
                            />
                        )}
                    />
                </Detail>
                <Detail>
                    <Controller
                        name="contact_email"
                        control={control}
                        rules={{
                            required: true,
                            pattern: {
                                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                message: "That doesn't look like a valid email...",
                            },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                error={errors.contact_email?.message}
                                autoComplete="email"
                                title="Primary Contact Email"
                                instructions="Where should people send emails about this tenant instance?"
                                placeholder="Email"
                                required
                            />
                        )}
                    />
                </Detail>
                <Detail>
                    <Await resolve={tenants}>
                        {(resolvedTenants: Tenant[]) => (
                            <Controller
                                name="short_name"
                                control={control}
                                rules={{
                                    required: true,
                                    pattern: {
                                        value: /^[a-zA-Z0-9_-]+$/,
                                        message: 'Your input contains invalid symbols',
                                    },
                                    validate: (value) =>
                                        resolvedTenants
                                            .map((tenant) => tenant.short_name)
                                            .includes(value.toLowerCase()) &&
                                        value.toLowerCase() !== initialTenant?.short_name.toLowerCase()
                                            ? 'This short name is already in use'
                                            : true,
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        required
                                        error={errors.short_name?.message}
                                        title="Tenant Short Name (URL)"
                                        instructions="Must be unique. Letters, underscores and dashes only are permitted."
                                        placeholder="shortname"
                                        startAdornment={
                                            <BodyText bold sx={{ mr: '-8px' }}>
                                                dep.gov.bc.ca/
                                            </BodyText>
                                        }
                                    />
                                )}
                            />
                        )}
                    </Await>
                </Detail>
                <Detail>
                    <Controller
                        name="title"
                        control={control}
                        rules={{
                            required: true,
                            maxLength: { value: 60, message: 'This input is too long!' },
                        }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                required
                                error={errors.title?.message}
                                title="Hero Banner Title"
                                instructions="The title that appears on top of the hero banner"
                                placeholder="Title"
                                counter
                                maxLength={60}
                            />
                        )}
                    />
                </Detail>
                <Detail>
                    <Controller
                        name="description"
                        control={control}
                        rules={{
                            required: true,
                            maxLength: { value: 160, message: 'This input is too long!' },
                        }}
                        render={({ field }) => (
                            <TextAreaField
                                {...field}
                                error={errors.description?.message}
                                required
                                title="Hero Banner Description"
                                instructions="The text that appears below the title on the hero banner"
                                placeholder="Description"
                                counter
                                maxLength={160}
                            />
                        )}
                    />
                </Detail>
                <Detail sx={{ padding: '16px 24px' }}>
                    <BodyText bold size="large">
                        Hero Banner Image
                    </BodyText>
                    <BodyText size="small">
                        If you do not add a hero banner image, a default image will be used.
                    </BodyText>
                    <br />
                    <BodyText bold sx={{ color: '#464341' }}>
                        Image Guidance
                    </BodyText>
                    <BodyText size="small">
                        The image you upload will be displayed at the top of your home page as a decorative element
                        behind the page title and description. When choosing an image keep in mind that much of the left
                        side of your image will be covered by this text and will not be visible.
                    </BodyText>
                    <br />
                    <UploadGuidelines />
                    <Box width="100%" mt="2em" mb="2em">
                        <ImageUpload
                            margin={4}
                            data-testid="tenant-form/image-upload"
                            handleAddFile={handleAddHeroImage}
                            savedImageUrl={savedBannerImageFileName}
                            savedImageName={savedBannerImageFileName}
                            height="200px"
                            cropAspectRatio={1920 / 700}
                        />
                    </Box>
                    <Controller
                        name="hero_image_credit"
                        control={control}
                        rules={{ maxLength: { value: 60, message: 'This input is too long!' } }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                error={errors.hero_image_credit?.message}
                                disabled={!hasheroImageUrl}
                                optional
                                clearable
                                counter
                                maxLength={60}
                                title="Image Credit"
                                instructions="Who should be credited for this image?"
                                inputProps={{
                                    'data-testid': 'tenant-form/image-credit',
                                }}
                            />
                        )}
                    />
                    <Controller
                        name="hero_image_description"
                        control={control}
                        rules={{ maxLength: { value: 80, message: 'This input is too long!' } }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                error={errors.hero_image_description?.message}
                                disabled={!hasheroImageUrl}
                                optional
                                clearable
                                counter
                                maxLength={80}
                                title="Image Description"
                                instructions="An accessible description of the image"
                                inputProps={{
                                    'data-testid': 'tenant-form/image-description',
                                }}
                            />
                        )}
                    />
                </Detail>
                <Detail invisible sx={{ flexDirection: 'row', gap: '24px' }}>
                    <Button disabled={!isDirty || !isValid} onClick={handleSubmit(onFormSubmit)} variant="primary">
                        {submitText}
                    </Button>
                    {onCancel && <Button onClick={onCancel}>{cancelText}</Button>}
                </Detail>
            </DetailsContainer>
        </FormGroup>
    );
};
