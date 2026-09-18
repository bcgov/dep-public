import React, { useEffect, useContext } from 'react';
import { Grid2 as Grid, Stack } from '@mui/material';
import Dropzone, { Accept } from 'react-dropzone';
import { ImageUploadContext } from './imageUploadContext';
import { Button } from 'components/common/Input/Button';

interface UploaderProps {
    height?: string;
    accept?: Accept;
    children: React.ReactNode;
    bgColor?: string;
}
const Uploader = ({ height = '10em', bgColor = 'blue.10', accept = {}, children }: UploaderProps) => {
    const {
        handleAddFile,
        addedImageFileUrl,
        setAddedImageFileUrl,
        setAddedImageFileName,
        existingImageUrl,
        setExistingImageURL,
        setCropModalOpen,
        imgAfterCrop,
        setImgAfterCrop,
    } = useContext(ImageUploadContext);

    useEffect(() => {
        return () => {
            if (addedImageFileUrl) {
                URL.revokeObjectURL(addedImageFileUrl);
            }
        };
    }, []);

    const acceptString = Object.keys(accept)
        .map((key) => {
            const value = accept?.[key];
            if (!value || value.length === 0) return key;
            return [value.join(','), key].join(',');
        })
        .join(', ');
    const existingImage = imgAfterCrop || addedImageFileUrl || existingImageUrl;

    if (existingImage) {
        return (
            <Grid container direction="row" alignItems="flex-start" justifyContent={'flex-end'} spacing={1} padding={1}>
                <Grid
                    size={12}
                    style={{
                        borderRadius: '8px',
                        height: height,
                        padding: '0',
                        overflow: 'hidden',
                    }}
                >
                    <img
                        alt="Preview of uploaded file"
                        data-testid="uploaded-image"
                        src={existingImage}
                        style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%',
                        }}
                        onError={() => {
                            URL.revokeObjectURL(addedImageFileUrl);
                            setExistingImageURL('');
                            setAddedImageFileUrl('');
                            setAddedImageFileName('');
                            setImgAfterCrop('');
                        }}
                    />
                </Grid>
                <Grid size={12} container justifyContent="flex-end" direction="row">
                    <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
                        <Button
                            onClick={() => {
                                setAddedImageFileUrl('');
                                setAddedImageFileName('');
                                setExistingImageURL('');
                                setImgAfterCrop('');
                                handleAddFile([]);
                                URL.revokeObjectURL(addedImageFileUrl);
                            }}
                            size="small"
                            sx={{ width: '88px' }}
                        >
                            Remove
                        </Button>
                        <Button
                            onClick={() => {
                                setCropModalOpen(true);
                            }}
                            size="small"
                            sx={{ width: '88px' }}
                        >
                            Crop
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        );
    }
    return (
        <Dropzone
            onDrop={(acceptedFiles) => {
                if (acceptedFiles.length === 0) return;
                const createdObjectURL = URL.createObjectURL(acceptedFiles[0]);
                handleAddFile(acceptedFiles);
                setAddedImageFileUrl(createdObjectURL);
                setAddedImageFileName(acceptedFiles[0].name);
            }}
            accept={accept}
        >
            {({ getRootProps, getInputProps }) => (
                <section id="image-upload-section">
                    <Grid
                        {...getRootProps()}
                        container
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            paddingTop: '1em',
                            borderRadius: '8px',
                            border: '2px dashed',
                            borderColor: 'gray.80',
                            backgroundColor: bgColor,
                            height: height,
                            cursor: 'pointer',
                        }}
                    >
                        <input {...getInputProps()} multiple={false} accept={acceptString} />
                        {children}
                    </Grid>
                </section>
            )}
        </Dropzone>
    );
};

export default Uploader;
