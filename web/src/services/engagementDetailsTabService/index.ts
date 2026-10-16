import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL, replaceUrl } from 'helper';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { RequestHeaders } from 'services/type';

export const getDetailsTabs = async (engagementId: number): Promise<EngagementDetailsTab[]> => {
    const url = replaceUrl(Endpoints.EngagementDetailsTab.GET_LIST, 'engagement_id', String(engagementId));
    if (!engagementId || Number.isNaN(Number(engagementId))) {
        throw new Error('Invalid Engagement Id ' + engagementId);
    }
    const response = await http.GetRequest<EngagementDetailsTab[]>(url);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to fetch engagement details tabs');
};

export const postDetailsTabs = async (
    engagement_id: number,
    tabs: EngagementDetailsTab[],
    headers: RequestHeaders = {},
): Promise<EngagementDetailsTab[]> => {
    const url = replaceUrl(Endpoints.EngagementDetailsTab.CREATE, 'engagement_id', String(engagement_id));
    const response = await http.PostRequest<EngagementDetailsTab[]>(url, tabs, {}, headers);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to create engagement details tabs');
};

export const deleteDetailsTab = async (
    engagement_id: number,
    tab_id: number,
    headers: RequestHeaders = {},
): Promise<{ data: string }> => {
    const url = Endpoints.EngagementDetailsTab.DELETE.replace('engagement_id', String(engagement_id)).replace(
        'tab_id',
        String(tab_id),
    );
    const response = await http.DeleteRequest<{ data: string }>(url, {}, headers);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to delete engagement details tab');
};

export const patchDetailsTabs = async (
    engagementId: number,
    tabs: EngagementDetailsTab[],
    headers: RequestHeaders = {},
): Promise<EngagementDetailsTab[]> => {
    const url = replaceAllInURL({
        URL: Endpoints.EngagementDetailsTab.UPDATE,
        params: {
            engagement_id: String(engagementId),
        },
    });
    const response = await http.PutRequest<EngagementDetailsTab[]>(url, tabs, {}, headers);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to update engagement details tabs');
};
