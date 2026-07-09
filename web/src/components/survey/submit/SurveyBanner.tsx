import React, { Suspense } from 'react';
import { Banner } from 'components/banner/Banner';
import EngagementInfoSection from 'components/publicDashboard/EngagementInfoSection';
import { useSurveyLoaderData } from '../useSurveyLoaderData';
import { Await } from 'react-router';
import Skeleton from '@mui/material/Skeleton/Skeleton';

export const SurveyBanner = () => {
    const loaderData = useSurveyLoaderData();

    return (
        <Suspense fallback={<Skeleton height={480} width="100%" />}>
            <Await resolve={loaderData.engagement} errorElement={<div>Error loading engagement data</div>}>
                {(engagement) => {
                    if (!engagement) return null;
                    return (
                        <Banner imageUrl={engagement.banner_url} height="480px">
                            <EngagementInfoSection savedEngagement={engagement} />
                        </Banner>
                    );
                }}
            </Await>
        </Suspense>
    );
};
