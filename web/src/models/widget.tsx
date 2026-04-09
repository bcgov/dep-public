export interface WidgetItem {
    id: number;
    widget_id: number;
    widget_data_id: number;
    sort_index: number;
}

export interface Widget {
    id: number;
    widget_type_id: WidgetType;
    engagement_id: number;
    engagement_details_tab_id?: number | null;
    items: WidgetItem[];
    title: string;
    location: WidgetLocation;
}

export enum WidgetType {
    WhoIsListening = 1,
    Document = 2,
    Subscribe = 4,
    Events = 5,
    Map = 6,
    Video = 7,
    // CAC Form was previously 8 but has been removed.
    Timeline = 9,
    Poll = 10,
    Image = 11,
}

export enum WidgetLocation {
    Summary = 1,
    Details = 2,
    Feedback = 3,
}
