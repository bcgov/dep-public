import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL, replaceUrl } from 'helper';
import { ListeningWidget } from 'models/listeningWidget';

interface PostListeningWidgetRequest {
    widget_id: number;
    engagement_id: number;
    engagement_details_tab_id?: number | null;
    description: string;
}

interface PatchListeningWidgetRequest {
    description?: string;
}

export const postListeningWidget = async (
    widget_id: number,
    data: PostListeningWidgetRequest,
): Promise<ListeningWidget> => {
    try {
        const url = replaceUrl(Endpoints.ListeningWidgets.CREATE, 'widget_id', String(widget_id));
        const response = await http.PostRequest<ListeningWidget>(url, data);
        return response.data || Promise.reject('Failed to create Who is Listening widget');
    } catch (err) {
        return Promise.reject(err);
    }
};

export const patchListeningWidget = async (
    widget_id: number,
    listening_widget_id: number,
    data: PatchListeningWidgetRequest,
): Promise<ListeningWidget> => {
    try {
        const url = replaceAllInURL({
            URL: Endpoints.ListeningWidgets.UPDATE,
            params: {
                widget_id: String(widget_id),
                listening_widget_id: String(listening_widget_id),
            },
        });
        const response = await http.PatchRequest<ListeningWidget>(url, data);
        return response.data || Promise.reject('Failed to update Who Is Listening widget');
    } catch (err) {
        return Promise.reject(err);
    }
};

export const fetchListeningWidget = async (widget_id: number): Promise<ListeningWidget> => {
    try {
        const url = replaceUrl(Endpoints.ListeningWidgets.GET, 'widget_id', String(widget_id));
        const responseData = await http.GetRequest<ListeningWidget[]>(url);
        return responseData.data[0] ?? {};
    } catch (err) {
        return Promise.reject(err);
    }
};
