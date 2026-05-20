import { setEngagements } from './engagementSlice';
import http from 'apiManager/httpRequestHandler';
import { AnyAction, Dispatch } from 'redux';
import { Engagement } from 'models/engagement';
import { Language } from 'models/language';
import { PatchEngagementRequest, PostEngagementRequest, PutEngagementRequest } from './types';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl } from 'helper';
import { Page } from 'services/type';
import axios from 'axios';
import { getLanguages } from 'services/languageService';

export const fetchAll = async (dispatch: Dispatch<AnyAction>): Promise<Engagement[]> => {
    const responseData = await http.GetRequest<Engagement[]>(Endpoints.Engagement.GET_LIST);
    const engagements = responseData.data ?? [];
    dispatch(setEngagements(engagements));
    return engagements;
};

export interface ApiErrorBody {
    error?: string;
    message?: string;
    code?: string;
}

export interface GetEngagementsParams {
    page?: number;
    size?: number;
    sort_key?: string;
    sort_order?: 'asc' | 'desc';
    search_text?: string;
    engagement_status?: number[];
    created_from_date?: string;
    created_to_date?: string;
    published_from_date?: string;
    published_to_date?: string;
    include_banner_url?: boolean;
    has_team_access?: boolean;
    metadata?: string;
    tenant_id?: number;
}
export const getEngagements = async (params: GetEngagementsParams = {}): Promise<Page<Engagement>> => {
    const responseData = await http.GetRequest<Page<Engagement>>(Endpoints.Engagement.GET_LIST, params);
    return (
        responseData.data ?? {
            items: [],
            total: 0,
        }
    );
};

export const getEngagement = async (engagementId: number): Promise<Engagement> => {
    const url = replaceUrl(Endpoints.Engagement.GET, 'engagement_id', String(engagementId));
    if (!engagementId || isNaN(Number(engagementId))) {
        return Promise.reject('Invalid Engagement Id ' + engagementId);
    }
    const response = await http.GetRequest<Engagement>(url);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to fetch engagement');
};

export const getAvailableTranslationLanguages = async (engagementId: number): Promise<Language[]> => {
    const url = replaceUrl(
        Endpoints.EngagementTranslations.GET_TRANSLATION_LANGUAGES,
        'engagement_id',
        String(engagementId),
    );
    if (!engagementId || isNaN(Number(engagementId))) {
        throw new Error('Invalid Engagement Id ' + engagementId);
    }
    const response = await http.GetRequest<Language[]>(url);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to fetch engagement translation languages.');
};

export interface EngagementTranslation {
    id: number;
    engagement_id: number;
    language_id: number;
    name?: string;
    description?: string;
    rich_description?: string;
    description_title?: string;
    sponsor_name?: string;
    upcoming_status_block_text?: string;
    open_status_block_text?: string;
    closed_status_block_text?: string;
    open_status_block_button_text?: string;
    view_results_status_block_button_text?: string;
    feedback_heading?: string;
    feedback_body?: string;
    consent_message?: string;
    subscribe_section_heading?: string;
    subscribe_section_description?: string;
    subscribe_consent_message?: string;
    more_engagements_heading?: string;
}

export const getEngagementTranslationByLanguage = async (
    engagementId: number,
    languageId: number,
): Promise<EngagementTranslation[]> => {
    const url = replaceUrl(
        replaceUrl(Endpoints.EngagementTranslations.GET_BY_LANGUAGE, 'engagement_id', String(engagementId)),
        'language_id',
        String(languageId),
    );
    const response = await http.GetRequest<EngagementTranslation[]>(url);
    return response.data ?? [];
};

export const createEngagementTranslation = async (
    engagementId: number,
    languageId: number,
): Promise<EngagementTranslation> => {
    const url = replaceUrl(Endpoints.EngagementTranslations.CREATE, 'engagement_id', String(engagementId));
    const response = await http.PostRequest<EngagementTranslation>(url, {
        language_id: languageId,
        pre_populate: true,
    });

    if (response.data) {
        return response.data;
    }

    throw new Error('Failed to create engagement translation');
};

export const patchEngagementTranslation = async (
    engagementId: number,
    engagementTranslationId: number,
    data: Partial<EngagementTranslation>,
): Promise<EngagementTranslation> => {
    const url = replaceUrl(
        replaceUrl(Endpoints.EngagementTranslations.PATCH, 'engagement_id', String(engagementId)),
        'engagement_translation_id',
        String(engagementTranslationId),
    );
    const response = await http.PatchRequest<EngagementTranslation>(url, data);
    if (response.data) {
        return response.data;
    }
    throw new Error('Failed to update engagement translation');
};

export const getEngagementTranslationByCode = async (
    engagementId: number,
    languageCode: string,
): Promise<EngagementTranslation | null> => {
    if (!languageCode) {
        return null;
    }

    const languages = await getLanguages();
    const language = languages.find((lng) => lng.code === languageCode);
    if (!language) {
        throw new Error(`Invalid language code ${languageCode}`);
    }

    const translations = await getEngagementTranslationByLanguage(engagementId, language.id);
    return translations[0] ?? null;
};

export const postEngagement = async (data: PostEngagementRequest): Promise<Engagement> => {
    const response = await http.PostRequest<Engagement>(Endpoints.Engagement.CREATE, data);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to create engagement');
};

export const putEngagement = async (data: PutEngagementRequest): Promise<Engagement> => {
    const response = await http.PutRequest<Engagement>(Endpoints.Engagement.UPDATE, data);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to update engagement');
};

export const patchEngagement = async (data: PatchEngagementRequest): Promise<Engagement> => {
    const response = await http.PatchRequest<Engagement>(Endpoints.Engagement.UPDATE, data);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to update engagement');
};

export const deleteEngagement = async (engagementId: number): Promise<{ id: number }> => {
    try {
        const url = replaceUrl(Endpoints.Engagement.DELETE, 'engagement_id', String(engagementId));
        const response = await http.DeleteRequest<{ id: number }>(url);
        if (response.data) {
            return response.data;
        }
        throw new Error('Failed to delete engagement');
    } catch (e: unknown) {
        if (axios.isAxiosError<ApiErrorBody>(e)) {
            throw new Error(e?.response?.data?.message);
        } else if (e instanceof Error) {
            throw new Error(e?.message);
        } else {
            throw new Error(String(e));
        }
    }
};
