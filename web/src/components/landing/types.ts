import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { SxProps } from '@mui/material';
import { MetadataFilter } from 'components/metadataManagement/types';
import { EngagementDisplayStatus } from 'constants/engagementStatus';
import { Engagement } from 'models/engagement';
import { ReactNode } from 'react';
import { TenantState } from 'reduxSlices/tenantSlice';
import { Page } from 'services/type';

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

export interface SearchParams {
    page?: string;
    size?: string;
    sort_key?: string;
    sort_order?: string;
    include_banner_url?: string;
    meta_filters?: string;
    engagement_status?: string;
    search_text?: string;
}

export interface LandingLoaderData {
    engagements: Promise<Page<Engagement> | undefined>;
    allMetaFilters: Promise<MetadataFilter[] | undefined>;
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

export interface LandingData {
    tenant: TenantState;
    engagements: Promise<Page<Engagement> | undefined>;
    allMetaFilters: Promise<MetadataFilter[] | undefined>;
    searchParams: URLSearchParams;
    setSearchParams: (params: URLSearchParams) => void;
    filtersOpen: boolean;
    setFiltersOpen: (open: boolean) => void;
    loadingEngagements: boolean;
    setLoadingEngagements: (loading: boolean) => void;
    clearFilters: () => void;
}
