import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { replaceAllInURL, replaceUrl } from 'helper';
import { ImageWidget } from 'models/imageWidget';
import { WidgetLocation } from 'models/widget';

export const fetchImageWidgets = async (widget_id: number): Promise<ImageWidget[]> => {
    try {
        const url = replaceUrl(Endpoints.ImageWidgets.GET, 'widget_id', String(widget_id));
        const responseData = await http.GetRequest<ImageWidget[]>(url);
        return responseData.data ?? [];
    } catch (err) {
        return Promise.reject(err);
    }
};

interface PostImageRequest {
    widget_id: number;
    file_id: string;
    engagement_id: number;
    image_url: string;
    alt_text?: string;
    description?: string;
    location: WidgetLocation | null;
}

export const postImage = async (widget_id: number, data: PostImageRequest): Promise<ImageWidget> => {
    try {
        const url = replaceUrl(Endpoints.ImageWidgets.CREATE, 'widget_id', String(widget_id));
        const response = await http.PostRequest<ImageWidget>(url, data);
        return response.data || Promise.reject('Failed to create image widget');
    } catch (err) {
        return Promise.reject(err);
    }
};

interface PatchImageRequest {
    image_url?: string;
    alt_text?: string;
    description?: string;
}

export const patchImage = async (
    widget_id: number,
    image_widget_id: number,
    data: PatchImageRequest,
): Promise<ImageWidget> => {
    try {
        const url = replaceAllInURL({
            URL: Endpoints.ImageWidgets.UPDATE,
            params: {
                widget_id: String(widget_id),
                image_widget_id: String(image_widget_id),
            },
        });
        const response = await http.PatchRequest<ImageWidget>(url, data);
        return response.data || Promise.reject('Failed to create image widget');
    } catch (err) {
        return Promise.reject(err);
    }
};
