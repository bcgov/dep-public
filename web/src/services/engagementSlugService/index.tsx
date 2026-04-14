import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl } from 'helper';

export interface GetSlugByEngagementIdResponse {
    slug: string;
}
export const getSlugByEngagementId = async (engagementId: number): Promise<GetSlugByEngagementIdResponse> => {
    if (!engagementId || isNaN(Number(engagementId))) {
        return Promise.reject(`Invalid ID: ${engagementId}`);
    }

    const url = replaceUrl(Endpoints.EngagementSlug.GET_ENG_ID, 'engagement_id', String(engagementId));
    const response = await http.GetRequest<GetSlugByEngagementIdResponse>(url);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to fetch engagement');
};

interface GetEngagementIdBySlugResponse {
    engagement_id: number;
}
export const getEngagementIdBySlug = async (slug: string): Promise<GetEngagementIdBySlugResponse> => {
    const url = replaceUrl(Endpoints.EngagementSlug.GET, 'slug_id', slug);
    if (!slug) {
        return Promise.reject(`Invalid Slug: ${slug}`);
    }
    const response = await http.GetRequest<GetEngagementIdBySlugResponse>(url);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to fetch engagement');
};

interface EngagementSlugPatchResponse {
    engagement_id: number;
    slug: string;
}
export interface EngagementSlugPatchRequest {
    engagement_id: number;
    slug: string;
}
export const patchEngagementSlug = async (data: EngagementSlugPatchRequest): Promise<EngagementSlugPatchResponse> => {
    const url = replaceUrl(Endpoints.EngagementSlug.UPDATE, 'slug_id', data.slug);
    const response = await http.PatchRequest<EngagementSlugPatchResponse>(url, data);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to update engagement metadata');
};
