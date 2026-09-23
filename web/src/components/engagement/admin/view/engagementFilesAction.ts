import { ActionFunctionArgs, ActionFunction } from 'react-router';
import { patchEngagementFile } from 'services/engagementFileService';

export const engagementFilesAction: ActionFunction = async ({ request, params, url }: ActionFunctionArgs) => {
    if (request.method.toLowerCase() === 'patch') {
        const formData = await request.formData();
        const engagementId = Number(params.engagementId);
        const fileId = params.fileId;
        if (!engagementId || !fileId) {
            throw new Error('Missing engagementId or fileId');
        }
        const data = Object.fromEntries(formData.entries());
        await patchEngagementFile(engagementId, fileId, data);
    }
};

export default engagementFilesAction;
