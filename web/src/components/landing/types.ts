import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { SxProps } from '@mui/material';
import { MetadataFilter } from 'components/metadataManagement/types';
import { EngagementDisplayStatus } from 'constants/engagementStatus';
import { ReactNode } from 'react';

export type SortOrder = 'desc' | 'asc';

export interface SearchFilters {
    page?: number;
    size?: number;
    sort_key?: string;
    sort_order?: SortOrder;
    include_banner_url?: boolean;
    meta_filters?: MetadataFilter[];
    engagement_status?: EngagementDisplayStatus[];
    search_text?: string;
}

export interface LandingSectionProps {
    children: ReactNode;
    image?: string;
    colour?: string;
    outerStyles?: SxProps;
    innerStyles?: SxProps;
}

export interface EngagementTallyRowProps {
    icon: IconProp;
    count: number;
    text: string;
}
