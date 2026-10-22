export interface EngagementDetailsTab {
    id: number;
    engagement_id: number;
    label: string;
    slug: string;
    heading: string;
    body: string;
    sort_index: number;
}

export const createDefaultDetailsTab = (): EngagementDetailsTab => {
    return {
        id: -1,
        engagement_id: -1,
        label: 'Tab 1',
        slug: 'tab_1',
        heading: '',
        body: '',
        sort_index: 1,
    };
};
