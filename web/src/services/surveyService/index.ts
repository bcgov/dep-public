import http from 'apiManager/httpRequestHandler';
import { Survey } from 'models/survey';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL, replaceUrl } from 'helper';
import { Page } from 'services/type';

interface FetchSurveyParams {
    is_unlinked?: boolean;
    exclude_hidden?: boolean;
    exclude_template?: boolean;
}
export const fetchSurveys = async (params: FetchSurveyParams = {}): Promise<Survey[]> => {
    const responseData = await http.GetRequest<Page<Survey>>(Endpoints.Survey.GET_LIST, { ...params });
    return responseData.data?.items ?? [];
};

interface GetSurveysParams {
    page?: number;
    size?: number;
    sort_key?: string;
    sort_order?: 'asc' | 'desc';
    search_text?: string;
    exclude_hidden?: boolean;
    exclude_template?: boolean;
    is_unlinked?: boolean;
    is_linked?: boolean;
    is_template?: boolean;
    is_hidden?: boolean;
    created_date_from?: string;
    created_date_to?: string;
    published_date_from?: string;
    published_date_to?: string;
}
export const getSurveysPage = async (params: GetSurveysParams = {}): Promise<Page<Survey>> => {
    const response = await http.GetRequest<Page<Survey>>(Endpoints.Survey.GET_LIST, params);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to fetch survey page');
};

export const getSurvey = async (surveyId: number): Promise<Survey> => {
    const url = replaceUrl(Endpoints.Survey.GET, 'survey_id', String(surveyId));
    if (!surveyId || isNaN(Number(surveyId))) {
        return Promise.reject('Invalid Survey Id ' + surveyId);
    }
    const response = await http.GetRequest<Survey>(url);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to fetch survey');
};

interface CreateSurveyRequest {
    name: string;
    engagement_id?: string;
    display: string;
}
export const postSurvey = async (data: CreateSurveyRequest): Promise<Survey> => {
    const response = await http.PostRequest<Survey>(Endpoints.Survey.CREATE, data);
    return response.data;
};

interface CloneSurveyRequest {
    name: string;
    engagement_id?: string;
    survey_id: number;
}
export const cloneSurvey = async (data: CloneSurveyRequest): Promise<Survey> => {
    const url = replaceUrl(Endpoints.Survey.CLONE, 'survey_id', String(data.survey_id));
    const response = await http.PostRequest<Survey>(url, data);
    return response.data;
};

interface PutSurveyRequest {
    id: string;
    form_json: unknown;
    name: string;
    is_hidden?: boolean;
    is_template?: boolean;
}
export const putSurvey = async (data: PutSurveyRequest, headers?: Record<string, string>): Promise<Survey> => {
    const response = await http.PutRequest<Survey>(Endpoints.Survey.UPDATE, data, {}, headers);
    return response.data;
};

interface LinkPutSurveyRequest {
    id: string;
    engagement_id: string;
}
export const linkSurvey = async (params: LinkPutSurveyRequest): Promise<Survey> => {
    const url = replaceAllInURL({
        URL: Endpoints.Survey.LINK_TO_ENGAGEMENT,
        params: {
            survey_id: params.id,
            engagement_id: params.engagement_id,
        },
    });

    const response = await http.PutRequest<Survey>(url);
    return response.data;
};

interface UnlinkPutSurveyRequest {
    id: number;
    engagement_id: number;
}

export const unlinkSurvey = async (params: UnlinkPutSurveyRequest): Promise<Survey> => {
    const url = replaceAllInURL({
        URL: Endpoints.Survey.UNLINK_FROM_ENGAGEMENT,
        params: {
            survey_id: String(params.id),
            engagement_id: String(params.engagement_id),
        },
    });

    const response = await http.DeleteRequest<Survey>(url);
    return response.data;
};

export const deleteSurvey = async (surveyId: number): Promise<{ id: number }> => {
    const url = replaceUrl(Endpoints.Survey.DELETE, 'survey_id', String(surveyId));
    try {
        const response = await http.DeleteRequest<{ id: number }>(url);
        return response.data;
    } catch (e) {
        return Promise.reject(Error('Failed to delete survey. ' + (e instanceof Error ? e.message : String(e))));
    }
};
