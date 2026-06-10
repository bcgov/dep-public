import React from 'react';
import { PreviewProvider } from './PreviewContext';
import { EngagementHero } from '../public/view/EngagementHero';
import { EngagementDescription } from '../public/view/EngagementDescription';
import { EngagementDetailsTabs } from '../public/view/EngagementDetailsTabs';
import { EngagementSurveyBlock } from '../public/view/EngagementSurveyBlock';
import { EngagementSubscribeBlock } from '../public/view/EngagementSubscribeBlock';
import { SuggestedEngagements } from 'engagements/public/view/SuggestedEngagements';
import { SubmissionStatusTypes } from 'constants/engagementStatus';
import { Box } from '@mui/material';
import { PreviewLanguageSwitcher } from './PreviewLanguageSwitcher';

interface PreviewContentProps {
    previewStateType: SubmissionStatusTypes;
}

/**
 * Wrapper component that renders the public engagement view in preview mode.
 * Wraps the view with PreviewContext to enable placeholder rendering for missing content.
 */
export const PreviewContent: React.FC<PreviewContentProps> = ({ previewStateType }) => {
    return (
        <PreviewProvider isPreviewMode={true} showPlaceholders={true} previewStateType={previewStateType}>
            <Box component="main" sx={{ position: 'relative' }}>
                <PreviewLanguageSwitcher />
                <EngagementHero />
                <EngagementDescription />
                <EngagementDetailsTabs />
                <EngagementSurveyBlock />
                <EngagementSubscribeBlock />
                <SuggestedEngagements />
            </Box>
        </PreviewProvider>
    );
};

export default PreviewContent;
