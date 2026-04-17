import React from 'react';
import { useParams } from 'react-router';
import { EngagementHero } from './EngagementHero';
import { EngagementDescription } from './EngagementDescription';
import { EngagementDetailsTabs } from './EngagementDetailsTabs';
import { EngagementSurveyBlock } from './EngagementSurveyBlock';
import { EngagementSubscribeBlock } from './EngagementSubscribeBlock';
import { SuggestedEngagements } from './SuggestedEngagements';

export enum EngagementViewSections {
    HERO = 'hero',
    DESCRIPTION = 'description',
    DETAILS_TABS = 'detailsTabs',
    CONTENT_TABS = 'contentTabs',
    PROVIDE_FEEDBACK = 'provideFeedback',
    VIEW_RESULTS = 'viewResults',
    SUBSCRIBE = 'subscribe',
    MORE_ENGAGEMENTS = 'moreEngagements',
}

export const PublicEngagementView = () => {
    const { slug, engagementId, language } = useParams();
    const viewKey = `${slug ?? engagementId ?? 'engagement'}-${language ?? 'default'}`;
    return (
        <React.Fragment key={viewKey}>
            <EngagementHero />
            <EngagementDescription />
            <EngagementDetailsTabs />
            <EngagementSurveyBlock />
            <EngagementSubscribeBlock />
            <SuggestedEngagements />
        </React.Fragment>
    );
};

export default PublicEngagementView;

export { engagementLoaderPublic } from './EngagementLoaderPublic';
export type { EngagementLoaderPublicData } from './EngagementLoaderPublic';
export { engagementListLoader } from './EngagementListLoader';
