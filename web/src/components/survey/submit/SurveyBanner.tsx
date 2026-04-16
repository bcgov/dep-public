import React from 'react';
import { Banner } from 'components/banner/Banner';
import EngagementInfoSection from 'components/publicDashboard/EngagementInfoSection';
import { useSurveyLoaderData } from './useSurveyLoaderData';

export const SurveyBanner = () => {
    const { engagement } = useSurveyLoaderData();

    if (!engagement) return null;

    return (
        <Banner imageUrl={engagement.banner_url} height="480px">
            <EngagementInfoSection savedEngagement={engagement} />
        </Banner>
    );
};
