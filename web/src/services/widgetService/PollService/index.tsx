import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL, replaceUrl } from 'helper';
import { PollWidget, PollAnswer, PollResponse, PollResultResponse } from 'models/pollWidget';
import { WidgetLocation } from 'models/widget';

interface PostPollRequest {
    widget_id: number;
    engagement_id: number;
    title: string;
    description: string;
    answers: PollAnswer[];
    status: string;
    location: WidgetLocation | null;
}

interface PostPollResponse {
    selected_answer_id: number;
}

interface PatchPollRequest {
    answers?: PollAnswer[];
    title?: string;
    description?: string;
    status?: string;
}

export const postPoll = async (widget_id: number, data: PostPollRequest): Promise<PollWidget> => {
    const url = replaceUrl(Endpoints.PollWidgets.CREATE, 'widget_id', String(widget_id));
    const response = await http.PostRequest<PollWidget>(url, data);
    return response.data || Promise.reject(new Error('Failed to create Poll widget'));
};

export const patchPoll = async (widget_id: number, poll_id: number, data: PatchPollRequest): Promise<PollWidget> => {
    const url = replaceAllInURL({
        URL: Endpoints.PollWidgets.UPDATE,
        params: {
            widget_id: String(widget_id),
            poll_id: String(poll_id),
        },
    });
    const response = await http.PatchRequest<PollWidget>(url, data);
    return response.data || Promise.reject(new Error('Failed to update Poll widget'));
};

export const fetchPollWidgets = async (widget_id: number): Promise<PollWidget[]> => {
    const url = replaceUrl(Endpoints.PollWidgets.GET, 'widget_id', String(widget_id));
    const responseData = await http.GetRequest<PollWidget[]>(url);
    return responseData.data ?? [];
};

export const postPollResponse = async (
    widget_id: number,
    poll_id: number,
    data: PostPollResponse,
): Promise<PollResponse> => {
    try {
        let url = replaceUrl(Endpoints.PollWidgets.RECORD_RESPONSE, 'widget_id', String(widget_id));
        url = replaceUrl(url, 'poll_id', String(poll_id));
        const response = await http.PostRequest<PollResponse>(url, data);
        return response.data ?? Promise.reject(new Error('Failed to create Poll Response'));
    } catch (err: unknown) {
        // Handle plaintext errors
        const errorData = (err as { response?: { data?: string | { message?: string } } })?.response?.data;
        const errorMessage =
            typeof errorData === 'string'
                ? errorData
                : (errorData?.message ?? (err as Error).message ?? 'Failed to create Poll Response');
        throw new Error(errorMessage);
    }
};

export const fetchPollResults = async (widget_id: number, poll_id: number): Promise<PollResultResponse> => {
    let url = replaceUrl(Endpoints.PollWidgets.RECORD_RESPONSE, 'widget_id', String(widget_id));
    url = replaceUrl(url, 'poll_id', String(poll_id));
    const response = await http.GetRequest<PollResultResponse>(url);
    return response.data || Promise.reject(new Error('Failed to fetch Poll Results'));
};
