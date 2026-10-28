import { createContext, useContext } from 'react';

export interface EngagementSearchFilterContextValue {
    nextFilterState: string;
    updateFilterState: (params: URLSearchParams) => void;
}

export const EngagementSearchFilterContext = createContext<EngagementSearchFilterContextValue | null>(null);

export const useEngagementSearchFilterContext = () => {
    const context = useContext(EngagementSearchFilterContext);
    if (!context) {
        throw new Error('Engagement search filter context is unavailable');
    }
    return context;
};
