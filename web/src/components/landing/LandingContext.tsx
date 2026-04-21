import React, { createContext, useState, useEffect, JSX } from 'react';
import { Engagement } from 'models/engagement';
import { getEngagements } from 'services/engagementService';
import { getMetadataFilters } from 'services/engagementMetadataService';
import { PAGE_SIZE } from './constants';
import { MetadataFilter } from 'components/metadataManagement/types';
import { EngagementDisplayStatus } from 'constants/engagementStatus';

interface SearchFilters {
    name: string;
    status: number[];
    metadata: MetadataFilter[];
}

export interface LandingContextProps {
    engagements: Engagement[];
    loadingEngagements: boolean;
    searchFilters: SearchFilters;
    setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
    totalEngagements: number;
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    metadataFilters: MetadataFilter[];
    clearFilters: () => void;
    drawerOpened: boolean;
    setDrawerOpened: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialSearchFilters = {
    name: '',
    status: [],
    metadata: [],
};

const defaultLandingStatuses = [
    EngagementDisplayStatus.Open,
    EngagementDisplayStatus.Upcoming,
    EngagementDisplayStatus.Closed,
];

export const LandingContext = createContext<LandingContextProps>({
    engagements: [],
    loadingEngagements: false,
    searchFilters: initialSearchFilters,
    setSearchFilters: () => {
        throw new Error('setSearchFilters unimplemented');
    },
    totalEngagements: 0,
    page: 1,
    setPage: () => {
        throw new Error('setPage unimplemented');
    },
    metadataFilters: [],
    clearFilters: () => {
        throw new Error('clearFilters unimplemented');
    },
    drawerOpened: false,
    setDrawerOpened: () => {
        throw new Error('setDrawerOpened unimplemented');
    },
});

export const LandingContextProvider = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
    const [engagements, setEngagements] = useState<Engagement[]>([]);
    const [totalEngagements, setTotalEngagements] = useState(0);
    const [loadingEngagements, setLoadingEngagements] = useState(true);
    // The array of filters that are available for the user to select
    const [metadataFilters, setMetadataFilters] = useState<MetadataFilter[]>([]);
    const [searchFilters, setSearchFilters] = useState<SearchFilters>(initialSearchFilters);
    const [page, setPage] = useState(1);
    // whether the filter drawer is covering the screen
    const [drawerOpened, setDrawerOpened] = useState(false);

    const loadEngagements = async () => {
        try {
            const { status, name } = searchFilters;
            const loadedEngagements = await getEngagements({
                page: page,
                size: PAGE_SIZE,
                sort_key: 'engagement.created_date',
                sort_order: 'desc',
                include_banner_url: true,
                // Keep landing aligned with public visibility rules:
                // show published/displayable engagements unless the user picks a specific status filter.
                engagement_status: status.length > 0 ? status : defaultLandingStatuses,
                search_text: name,
                metadata: JSON.stringify(searchFilters.metadata),
            });
            setEngagements(loadedEngagements.items);
            setTotalEngagements(loadedEngagements.total);
            setLoadingEngagements(false);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadEngagements();
    }, [searchFilters, page]);

    const loadFilters = async () => {
        try {
            const loadedFilters = await getMetadataFilters();
            setMetadataFilters(loadedFilters);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadFilters();
    }, []);

    const clearFilters = () => {
        setSearchFilters({
            ...searchFilters,
            status: [],
            metadata: [],
        });
        setPage(1);
    };

    return (
        <LandingContext.Provider
            value={{
                engagements,
                loadingEngagements,
                searchFilters,
                setSearchFilters,
                totalEngagements,
                page,
                setPage,
                metadataFilters,
                clearFilters,
                drawerOpened,
                setDrawerOpened,
            }}
        >
            {children}
        </LandingContext.Provider>
    );
};
