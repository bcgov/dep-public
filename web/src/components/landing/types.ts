import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { SxProps } from '@mui/material';
import { MetadataFilter } from 'components/metadataManagement/types';
import { EngagementDisplayStatus } from 'constants/engagementStatus';
import { Engagement } from 'models/engagement';
import { ReactNode } from 'react';
import { TenantState } from 'reduxSlices/tenantSlice';
import { Page } from 'services/type';

export type SortOrder = 'desc' | 'asc' | undefined;

export interface SearchFilters {
    page: number;
    size: number;
    sort_key: string;
    sort_order: SortOrder;
    include_banner_url: boolean;
    metadata: MetadataFilter[];
    engagement_status: EngagementDisplayStatus[];
    search_text: string;
}

export interface LandingData {
    engagements: Page<Engagement> | undefined;
    filters: MetadataFilter[] | undefined;
}

export interface LandingLoaderData {
    engagements: Promise<Page<Engagement> | undefined>;
    filters: Promise<MetadataFilter[] | undefined>;
}

export interface FilterDrawerProps {
    searchFilters: SearchFilters;
    metadataFilters: MetadataFilter[];
    filtersOpen: boolean;
    setSearchFilters: (filters: SearchFilters) => void;
    clearFilters: () => void;
    setFiltersOpen: (open: boolean) => void;
}

export interface LandingBannerProps {
    tenant: TenantState;
}

export interface FilterBlockProps {
    searchFilters: SearchFilters;
    setSearchFilters: (filters: SearchFilters) => void;
    clearFilters: () => void;
    setFiltersOpen: (open: boolean) => void;
}

export interface TileBlockProps {
    engagements: Engagement[];
    loadingEngagements: boolean;
    totalEngagements: number;
    searchFilters: SearchFilters;
    setSearchFilters: (filters: SearchFilters) => void;
}

export interface LandingSectionProps {
    children: ReactNode;
    image?: string;
    colour?: string;
    outerStyles?: SxProps;
    innerStyles?: SxProps;
}

export interface EngagementSearchProps extends FilterBlockProps {
    engagements: Engagement[];
    loadingEngagements: boolean;
    totalEngagements: number;
    searchFilters: SearchFilters;
    setSearchFilters: (filters: SearchFilters) => void;
}

export interface EngagementTallyRowProps {
    icon: IconProp;
    count: number;
    text: string;
}
