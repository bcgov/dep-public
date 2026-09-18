import React, { useContext } from 'react';
import { Grid2 as Grid, Typography } from '@mui/material';
import Dropzone, { Accept } from 'react-dropzone';
import { FileUploadContext } from './FileUploadContext';

interface UploaderProps {
    margin?: number;
    helpText?: string;
    height?: string;
    acceptedFormat?: Accept;
}
const Uploader = ({ margin = 2, height = '10em', helpText, acceptedFormat = {} }: UploaderProps) => {
    const { handleAddFile } = useContext(FileUploadContext);
    // Join both strings and keys of the accepted file formats to create a comma-separated
    // string for the accept attribute. It is recommended to use both mimetypes and explicit
    // file extensions when specifying accepted file formats.
    const acceptString = Object.keys(acceptedFormat)
        .map((key) => {
            const value = acceptedFormat?.[key];
            if (!value || value.length === 0) return key;
            return [value.join(','), key].join(',');
        })
        .join(',');

    return (
        <Dropzone
            accept={acceptedFormat}
            onDrop={(acceptedFiles) => {
                handleAddFile(acceptedFiles);
            }}
        >
            {({ getRootProps, getInputProps }) => (
                <section>
                    <Grid
                        {...getRootProps()}
                        container
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        style={{
                            border: '1px dashed #606060',
                            background: '#F2F2F2 0% 0% no-repeat padding-box',
                            height: height,
                            cursor: 'pointer',
                        }}
                    >
                        <input {...getInputProps()} multiple={false} accept={acceptString} />
                        <Typography m={margin}>{helpText}</Typography>
                    </Grid>
                </section>
            )}
        </Dropzone>
    );
};

export default Uploader;
