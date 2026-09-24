import { ActionFunctionArgs, ActionFunction } from 'react-router';
import { patchUploadedFile, deleteUploadedFile } from 'services/uploadedFileService';

export const uploadedFilesAction: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
    const fileId = params.fileId;
    const engagementId = params.engagementId;
    if (!fileId) {
        throw new Error('Missing fileId');
    }
    if (!engagementId) {
        throw new Error('Missing engagementId');
    }
    if (request.method.toLowerCase() === 'delete') {
        deleteUploadedFile(fileId);
    }
    if (request.method.toLowerCase() === 'patch') {
        const formData = await request.formData();
        patchUploadedFile(fileId, Object.fromEntries(formData));
    }
};

export default uploadedFilesAction;
