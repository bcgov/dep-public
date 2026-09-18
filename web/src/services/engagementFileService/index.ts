import http from 'apiManager/httpRequestHandler';
import { EngagementFile } from 'models/engagementFile';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl } from 'helper';
import { MetadataFilter } from 'components/metadataManagement/types';

export const getEngagementFiles = async (
    engagementId: number,
    filters?: MetadataFilter[],
): Promise<EngagementFile[]> => {
    const url = replaceUrl(Endpoints.EngagementFiles.GET_LIST, 'engagement_id', engagementId.toString());
    const response = await http.GetRequest<EngagementFile[]>(url, { params: { filters } });
    return response.data;
};
