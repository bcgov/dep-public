import http from 'apiManager/httpRequestHandler';
import { WidgetMap } from 'models/widgetMap';
import Endpoints from 'apiManager/endpoints';
import { replaceUrl } from 'helper';
import { GeoJSON } from 'geojson';
import { WidgetLocation } from 'models/widget';

export const fetchMaps = async (widget_id: number): Promise<WidgetMap[]> => {
    try {
        const url = replaceUrl(Endpoints.Maps.GET_LIST, 'widget_id', String(widget_id));
        const responseData = await http.GetRequest<WidgetMap[]>(url);
        return responseData.data ?? [];
    } catch (err) {
        return Promise.reject(err);
    }
};

interface PostMapRequest {
    widget_id: number;
    engagement_id: number;
    engagement_details_tab_id?: number | null;
    longitude: number;
    latitude: number;
    marker_label?: string;
    file?: File;
    location: WidgetLocation | null;
}

export const postMap = async (widget_id: number, data: PostMapRequest): Promise<WidgetMap> => {
    try {
        const url = replaceUrl(Endpoints.Maps.CREATE, 'widget_id', String(widget_id));
        const formdata = new FormData();
        if (data.file) {
            formdata.append('file', data.file);
        }
        if (data.latitude) {
            formdata.append('latitude', data.latitude.toString());
        }
        if (data.longitude) {
            formdata.append('longitude', data.longitude.toString());
        }
        if (data.engagement_details_tab_id) {
            formdata.append('engagement_details_tab_id', String(data.engagement_details_tab_id));
        }
        formdata.append('engagement_id', data.engagement_id.toString());
        formdata.append('marker_label', data.marker_label ? data.marker_label : '');
        const response = await http.PostRequest<WidgetMap>(
            url,
            formdata,
            {},
            { 'Content-type': 'multipart/form-data' },
        );
        if (response.data) {
            return response.data;
        }
        return Promise.reject('Failed to create map');
    } catch (err) {
        return Promise.reject(err);
    }
};

interface PreviewShapefileRequest {
    file?: File;
}

export const previewShapeFile = async (data: PreviewShapefileRequest): Promise<GeoJSON> => {
    try {
        const url = Endpoints.Maps.SHAPEFILE_PREVIEW;
        const formdata = new FormData();
        if (data.file) {
            formdata.append('file', data.file, data.file.name);
        }
        const response = await http.PostRequest<GeoJSON>(url, formdata, {}, { 'Content-type': 'multipart/form-data' });
        if (response.data) {
            return response.data;
        }
        return Promise.reject('Failed to preview shapefile');
    } catch (err) {
        return Promise.reject(err);
    }
};
