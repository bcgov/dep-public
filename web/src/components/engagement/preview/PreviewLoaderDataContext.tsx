import React, { createContext, useContext } from 'react';
import { useRouteLoaderData } from 'react-router';
import { EngagementLoaderPublicData } from 'components/engagement/public/view/EngagementLoaderPublic';

const PreviewLoaderDataContext = createContext<EngagementLoaderPublicData | null>(null);

interface PreviewLoaderDataProviderProps {
    children: React.ReactNode;
    loaderData: EngagementLoaderPublicData;
}

export const PreviewLoaderDataProvider: React.FC<PreviewLoaderDataProviderProps> = ({ children, loaderData }) => {
    return <PreviewLoaderDataContext.Provider value={loaderData}>{children}</PreviewLoaderDataContext.Provider>;
};

export const useEngagementLoaderData = (): EngagementLoaderPublicData => {
    const previewLoaderData = useContext(PreviewLoaderDataContext);
    const routeLoaderData = useRouteLoaderData('public-single-engagement') as EngagementLoaderPublicData;
    return previewLoaderData ?? routeLoaderData;
};

export default PreviewLoaderDataContext;
