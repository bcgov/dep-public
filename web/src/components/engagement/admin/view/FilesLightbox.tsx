import React from 'react';
import {
    Grid2 as Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    Box,
    ThemeProvider,
    CircularProgress,
} from '@mui/material';
import { bytesToSize } from 'helper';
import { Button } from 'components/common/Input';
import { UploadedFile } from 'models/uploadedFile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faDownload, faCheck } from '@fortawesome/pro-regular-svg-icons';
import { BodyText, Heading3 } from 'components/common/Typography';
import { AdminDarkTheme } from 'styles/Theme';
import { downloadObject } from 'services/objectStorageService';
import { formatRelative, formatToPacific } from 'components/common/dateHelper';

export type FilesLightboxProps = {
    open: boolean;
    onClose: () => void;
    files: UploadedFile[];
};

export const canBePreviewed = (file?: UploadedFile) => {
    if (!file) return false;
    return (
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf' ||
        (file.mimetype.startsWith('audio/') && file.mimetype !== 'audio/mid')
    );
};

export const FilesLightbox = ({ open, onClose, files }: FilesLightboxProps) => {
    const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isZoomed, setIsZoomed] = React.useState(false);
    const [zoomPosition, setZoomPosition] = React.useState({ x: 0, y: 0 });
    const currentFile = files[currentFileIndex];
    const oneFile = files.length <= 1;
    const hiddenWhenOneFile = oneFile ? 'none' : 'inline-flex';
    const matchButtonPadding = oneFile ? 3 : 12.875; // 12.875rem corresponds to the width of the side navigation after padding
    const downloadIcon = isDownloading ? (
        <CircularProgress sx={{ color: 'inherit' }} size="20px" />
    ) : (
        <FontAwesomeIcon icon={faDownload} />
    );

    const navigateForward = () => {
        if (currentFileIndex >= files.length - 1) return setCurrentFileIndex(0);
        setCurrentFileIndex((prevIndex) => Math.min(prevIndex + 1, files.length - 1));
    };

    const navigateBackward = () => {
        if (currentFileIndex === 0) return setCurrentFileIndex(files.length - 1);
        setCurrentFileIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    const handleClose = () => {
        setCurrentFileIndex(0);
        setIsZoomed(false);
        onClose();
    };

    const handleDownload = async () => {
        if (!currentFile) return;
        setIsDownloading(true);
        try {
            await downloadObject({
                filename: currentFile.filename,
                s3sourceuri: currentFile.url,
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleZoomMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!isZoomed) return;
        const rect = event.currentTarget.getBoundingClientRect();
        // Transform the mouse events to the coordinate space of the element's bounding rectangle
        const margin = 24; // px - so you don't have to be pixel-perfect to mouse over the edges
        const rectHeight = rect.height - margin * 2;
        const rectWidth = rect.width - margin * 2;
        // Clamp the mouse coordinates to the element's bounding rectangle
        const clampedX = Math.min(Math.max(event.clientX - rect.left - margin, 0), rectWidth);
        const clampedY = Math.min(Math.max(event.clientY - rect.top - margin, 0), rectHeight);
        setZoomPosition({ x: (clampedX / rectWidth) * 100, y: (clampedY / rectHeight) * 100 });
    };

    const displayDate = (date?: string) => {
        if (!date) return 'N/A';
        const relative = formatRelative(date);
        if (relative.includes('month') || relative.includes('year')) return formatToPacific(date);
        return relative;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle
                component={Grid}
                container
                justifyContent="space-between"
                spacing={1}
                px={{ xs: 2, sm: 3, md: matchButtonPadding }}
            >
                <Grid size="auto" display={{ xs: 'flex', md: 'none' }}>
                    <Button
                        sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                        variant="tertiary"
                        icon={<FontAwesomeIcon icon={faArrowLeft} />}
                        onClick={handleClose}
                    >
                        Back
                    </Button>
                </Grid>
                <Grid size="grow" textAlign={{ xs: 'center', md: 'left' }}>
                    <BodyText component="span" display={{ fontSize: 'inherit', xs: 'none', md: 'inline' }}>
                        Previewing{' '}
                    </BodyText>
                    "{currentFile?.filename}"
                </Grid>
                <Grid size="auto">
                    <Button
                        size="small"
                        sx={{ '& .MuiButton-startIcon': { display: { xs: 'none', md: 'inline-flex' } } }}
                        icon={downloadIcon}
                        onClick={handleDownload}
                    >
                        Download
                    </Button>
                </Grid>
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                <Grid container size={12} alignItems="center" spacing={{ xs: 1, md: 2 }}>
                    <Grid size="auto" display={{ xs: 'none', md: hiddenWhenOneFile }}>
                        <Button onClick={navigateBackward} icon={<FontAwesomeIcon icon={faArrowLeft} />} />
                    </Grid>
                    <Grid container size="grow" gap={2}>
                        <Grid size={12} hidden={files.length < 2} display={{ xs: 'none', md: 'inline-flex' }}>
                            <Heading3>
                                {currentFileIndex + 1} of {files.length} file{files.length > 1 ? 's' : ''}
                            </Heading3>
                        </Grid>
                        <Paper
                            sx={{
                                boxShadow: 3,
                                overflow: 'clip',
                                width: '100%',
                                height: 'calc(100vh - 400px)',
                                minHeight: '300px',
                                maxHeight: '1200px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'gray.90',
                            }}
                        >
                            <ThemeProvider theme={AdminDarkTheme}>
                                {(currentFile?.mimetype?.startsWith('image/') && (
                                    <Box
                                        onClick={() => setIsZoomed(!isZoomed)}
                                        aria-label={`Preview of ${currentFile.filename}`}
                                        onMouseMove={handleZoomMove}
                                        sx={{
                                            backgroundImage: `url(${currentFile.url})`,
                                            cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                                            backgroundSize: isZoomed ? '200%' : 'contain',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: isZoomed
                                                ? `${zoomPosition.x}% ${zoomPosition.y}%`
                                                : 'center',
                                            width: '100%',
                                            height: '100%',
                                        }}
                                    />
                                )) ||
                                    (currentFile?.mimetype?.startsWith('video/') && (
                                        <video // NOSONAR: S4084 (No <track> element for captions)
                                            src={currentFile.url}
                                            controls
                                            style={{ width: '100%', height: 'calc(100vh - 400px)', minHeight: '300px' }}
                                        />
                                    )) ||
                                    (currentFile?.mimetype?.startsWith('application/pdf') && (
                                        <iframe
                                            title={currentFile.filename}
                                            src={currentFile.url}
                                            style={{ width: '100%', height: 'calc(100vh - 400px)', minHeight: '300px' }}
                                        >
                                            Your browser does not support embedding PDF files.
                                        </iframe>
                                    )) ||
                                    (currentFile?.mimetype?.startsWith('audio/') &&
                                        currentFile.mimetype !== 'audio/mid' && (
                                            <audio src={currentFile.url} controls style={{ width: '100%' }} /> // NOSONAR: S4084
                                        )) ||
                                    (currentFile && (
                                        <Grid
                                            container
                                            direction="column"
                                            spacing={2}
                                            padding={3}
                                            size={12}
                                            maxWidth="600px"
                                        >
                                            <Heading3>Unsupported file type</Heading3>
                                            <BodyText>
                                                Files of type {currentFile.mimetype} are not supported for preview.
                                            </BodyText>
                                            <Button
                                                loading={isDownloading}
                                                sx={{ width: 'max-content' }}
                                                variant="primary"
                                                icon={downloadIcon}
                                                onClick={handleDownload}
                                            >
                                                Download
                                            </Button>
                                        </Grid>
                                    ))}
                            </ThemeProvider>
                        </Paper>
                        <Grid
                            size={12}
                            spacing={1}
                            alignItems="center"
                            display={{ xs: hiddenWhenOneFile, md: 'none' }}
                            justifyContent="space-between"
                        >
                            <Button
                                size="small"
                                onClick={navigateBackward}
                                icon={<FontAwesomeIcon icon={faArrowLeft} />}
                            >
                                Previous
                            </Button>
                            <BodyText>
                                {currentFileIndex + 1} of {files.length} files
                            </BodyText>
                            <Button
                                size="small"
                                iconPosition="right"
                                onClick={navigateForward}
                                icon={<FontAwesomeIcon icon={faArrowRight} />}
                            >
                                Next
                            </Button>
                        </Grid>
                        {currentFile ? (
                            <Grid size={12}>
                                <BodyText>
                                    <b>Name:</b> {currentFile.filename}
                                </BodyText>
                                <BodyText title={`${currentFile.size} bytes`}>
                                    <b>Size:</b> {bytesToSize(currentFile.size)}
                                </BodyText>
                                <BodyText
                                    title={
                                        currentFile.uploaded_at ? formatToPacific(currentFile.uploaded_at) : undefined
                                    }
                                >
                                    <b>Uploaded:</b> {displayDate(currentFile.uploaded_at)}
                                </BodyText>
                            </Grid>
                        ) : (
                            <p>No file selected</p>
                        )}
                    </Grid>
                    <Grid size="auto" display={{ xs: 'none', md: hiddenWhenOneFile }}>
                        <Button onClick={navigateForward} icon={<FontAwesomeIcon icon={faArrowRight} />} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ display: { xs: 'none', md: 'flex' }, px: matchButtonPadding }}>
                <Button size="small" icon={<FontAwesomeIcon icon={faCheck} />} onClick={handleClose}>
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
};
