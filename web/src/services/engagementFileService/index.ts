import http from 'apiManager/httpRequestHandler';
import { EngagementFile } from 'models/engagementFile';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl, replaceAllInURL } from 'helper';
import { MetadataFilter } from 'components/metadataManagement/types';

export const getEngagementFiles = async (
    engagementId: number,
    filters?: MetadataFilter[],
): Promise<EngagementFile[]> => {
    const url = replaceUrl(Endpoints.EngagementFiles.GET_LIST, 'engagement_id', engagementId.toString());
    const response = await http.GetRequest<EngagementFile[]>(url, { params: { filters } });
    return response.data;
};

export const patchEngagementFile = async (
    engagementId: number,
    fileId: string,
    data: Partial<EngagementFile>,
): Promise<EngagementFile> => {
    const url = replaceAllInURL({
        URL: Endpoints.EngagementFiles.PATCH,
        params: {
            engagement_id: engagementId.toString(),
            file_id: fileId.toString(),
        },
    });
    const response = await http.PatchRequest<EngagementFile>(url, data);
    return response.data;
};
