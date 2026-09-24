import {
    faLink,
    faChainBroken,
    faFilePdf,
    faFileZipper,
    faFileMusic,
    faFileDoc,
    faFileSpreadsheet,
    faFilePowerpoint,
    faFileAudio,
    faFileVideo,
    faFileImage,
    faFile,
} from '@fortawesome/pro-regular-svg-icons';

export const getFileIcon = (url: string, isFile: boolean) => {
    if (!isFile) {
        return url ? faLink : faChainBroken;
    }
    // If there is no extension, it is a link rather than a file
    if (!url.includes('.')) {
        return faLink;
    }
    switch (url.split('.').pop()?.toLowerCase()) {
        case 'pdf':
            return faFilePdf;
        case 'zip':
            return faFileZipper;
        case 'mid':
        case 'midi':
            return faFileMusic;
        case 'doc':
        case 'docx':
            return faFileDoc;
        case 'xls':
        case 'xlsx':
            return faFileSpreadsheet;
        case 'ppt':
        case 'pptx':
            return faFilePowerpoint;
        case 'mp3':
        case 'wav':
        case 'flac':
        case 'ogg':
        case 'm4a':
        case 'wma':
            return faFileAudio;
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
        case 'flv':
        case 'mkv':
            return faFileVideo;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
        case 'tiff':
        case 'webp':
            return faFileImage;
        default:
            return faFile;
    }
};
