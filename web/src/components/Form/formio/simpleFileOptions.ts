import { AxiosRequestConfig } from 'axios';
import { deletePublicObject, downloadPublicObject, savePublicObject } from 'services/objectStorageService';

type UploadConfig = AxiosRequestConfig & {
    onUploadProgress?: (event: ProgressEvent) => void;
};

interface SimpleFileOptionsConfig {
    verificationToken?: string;
}

const createPublicUploadResponse = (
    filepath: string,
    file: File,
    uniqueFileName: string,
    contentType?: string,
    size?: number,
) => ({
    data: {
        id: filepath,
        originalname: file.name,
        mimetype: contentType ?? file.type,
        name: uniqueFileName,
        size: size ?? file.size,
    },
});

export const createSimpleFileOptions = ({ verificationToken }: SimpleFileOptionsConfig = {}) => ({
    componentOptions: {
        simplefile: {
            fileService: 'objectStorage',
            objectStorage: {
                endpoint: 'https://citz-gdx.objectstore.gov.bc.ca',
                bucket: 'engagement-dev-uploads',
            },
            uploadFile: async (formData: FormData, config?: UploadConfig) => {
                if (!verificationToken) {
                    throw new Error('Verification token is required for public file uploads.');
                }

                const file = formData.get('file') ?? formData.get('files');
                if (!(file instanceof File)) {
                    throw new TypeError('A valid file upload payload is required.');
                }

                const response = await savePublicObject(file, verificationToken, config);
                return createPublicUploadResponse(
                    response.filepath,
                    file,
                    response.uniquefilename,
                    response.content_type,
                    response.size,
                );
            },
            getFile: async (fileId: string, _config?: AxiosRequestConfig) => {
                if (!verificationToken) {
                    throw new Error('Verification token is required for public file downloads.');
                }

                await downloadPublicObject(fileId, verificationToken);
            },
            deleteFile: async (fileInfo: { data?: { id?: string }; id?: string }, _config?: AxiosRequestConfig) => {
                if (!verificationToken) {
                    throw new Error('Verification token is required for public file deletion.');
                }

                const fileId = fileInfo.data?.id ?? fileInfo.id;
                if (!fileId) {
                    return;
                }

                await deletePublicObject(fileId, verificationToken);
            },
        },
    },
});
