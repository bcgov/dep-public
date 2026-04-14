import React from 'react';
import { DashboardContextProvider } from './DashboardContext';
import EngagementAccordions from './EngagementList';

export const Dashboard = () => {
    return (
        <DashboardContextProvider>
            <EngagementAccordions />
        </DashboardContextProvider>
    );
};

export default Dashboard;
