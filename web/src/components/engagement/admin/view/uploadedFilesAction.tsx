import { ActionFunctionArgs, ActionFunction } from 'react-router';
import { patchUploadedFile, deleteUploadedFile, uploadFile } from 'services/uploadedFileService';

export const uploadedFilesAction: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
    const fileId = params.fileId;
    const engagementId = params.engagementId;

    if (!fileId) {
        throw new Error('Uploaded files action failed: Missing fileId.');
    }
    if (!engagementId) {
        throw new Error('Uploaded files action failed: Missing engagementId.');
    }

    const method = request.method.toLowerCase();
    const formData = await request.formData();

    switch (method) {
        case 'delete': {
            await deleteUploadedFile(fileId);
            break;
        }
        case 'patch': {
            await patchUploadedFile(fileId, Object.fromEntries(formData));
            break;
        }
        case 'put': {
            // Replace an existing PDF with a new file
            const { file, filename, id } = Object.fromEntries(formData.entries());
            const errorString = 'Failed to replace PDF file:';

            if (!file || !filename || !id) {
                throw new Error(`${errorString} Missing required form data.`);
            }
            if (typeof filename !== 'string' || typeof id !== 'string') {
                throw new TypeError(`${errorString} Form data is invalid.`);
            }
            if (!(file instanceof File)) {
                throw new TypeError(`${errorString} Replacement file is invalid.`);
            }
            if (file.type !== 'application/pdf') {
                throw new Error(`${errorString} Replacement file must be a PDF.`);
            }

            await uploadFile(file, {
                id,
                engagement_id: Number(engagementId),
                filename,
            });
            break;
        }
        default: {
            throw new Error(`Unsupported action: ${method}`);
        }
    }
};

export default uploadedFilesAction;
