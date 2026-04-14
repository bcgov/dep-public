import { render, waitFor, screen } from '@testing-library/react';
import React, { ReactNode } from 'react';
import '@testing-library/jest-dom';
import Dashboard from 'components/publicDashboard/Dashboard';
import { setupEnv } from '../setEnvVars';
import { DashboardContext } from 'components/publicDashboard/DashboardContext';
import { closedEngagement } from '../factory';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { ROUTES, getPath } from 'routes/routes';

jest.mock('axios');

jest.mock('jspdf', () => ({
    jsPDF: jest.fn(),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLocation: jest.fn(() => ({ search: '' })),
    useParams: jest.fn(() => {
        return { slug: '' };
    }),
    useNavigate: () => jest.fn(),
}));

jest.mock('hooks', () => {
    const translations: Record<string, string> = {
        'dashboard.surveyEmailsSent': 'Survey Emails Sent',
        'dashboard.surveysCompleted': 'Surveys Completed',
        'dashboard.projectLocation': 'Project Location',
        'dashboard.submissionTrend.label': 'Live Activity - Engagement',
        'dashboard.link.0': '<<Return to ',
        'dashboard.link.1': ' Engagement',
    };

    return {
        useAppTranslation: () => ({
            t: (key: string) => translations[key] || key,
        }),
        useAppSelector: jest.fn(() => true), // mock useAppSelector here if needed
    };
});

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: jest.fn(() => true),
}));

jest.mock('components/common/Navigation/Breadcrumb', () => ({
    AutoBreadcrumbs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('components/publicDashboard/KPI/SurveyEmailsSent', () => {
    const React = require('react');
    return () => React.createElement('div', null, 'Survey Emails Sent');
});

jest.mock('components/publicDashboard/KPI/SurveysCompleted', () => {
    const React = require('react');
    return () => React.createElement('div', null, 'Surveys Completed');
});

jest.mock('components/publicDashboard/KPI/ProjectLocation', () => {
    const React = require('react');
    return () => React.createElement('div', null, 'Project Location');
});

jest.mock('components/publicDashboard/SubmissionTrend/SubmissionTrend', () => {
    const React = require('react');
    return () => React.createElement('div', null, 'Live Activity - Engagement');
});

jest.mock('components/publicDashboard/SurveyBar', () => {
    const React = require('react');
    return () => React.createElement('div', null, 'Survey Bar');
});

jest.mock('components/publicDashboard/SurveyBarPrintable', () => {
    const React = require('react');
    return () => React.createElement('div', null, 'Survey Bar Printable');
});

jest.mock('maplibre-gl/dist/maplibre-gl', () => ({
    Map: () => ({}),
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(() => jest.fn()),
}));

describe('Public Dashboard page tests', () => {
    beforeEach(() => {
        setupEnv();
        render(
            <BrowserRouter>
                <DashboardContext.Provider
                    value={{
                        engagement: closedEngagement,
                        isEngagementLoading: false,
                        dashboardType: 'public',
                    }}
                >
                    <Dashboard />
                </DashboardContext.Provider>
            </BrowserRouter>,
        );
    });

    test('Public Dashboard is rendered correctly', async () => {
        await waitFor(() => {
            const elements = screen.getAllByText(closedEngagement.name);
            expect(elements.length).toBeGreaterThan(1);
        });
    });

    test('Navigation links work correctly', async () => {
        const returnLink = screen.getByText('dashboard.engagementLink');
        expect(returnLink).toBeInTheDocument();
        const user = userEvent.setup();
        await user.click(returnLink);
        await waitFor(() => {
            expect(window.location.pathname).toBe(
                getPath(ROUTES.ENGAGEMENT_DETAILS_AUTHORING, { engagementId: closedEngagement.id }),
            );
        });
    });

    test('Public Dashboard has sub components', async () => {
        expect(screen.getByText(/Survey Emails Sent/i)).toBeInTheDocument();
        expect(screen.getByText(/Surveys Completed/i)).toBeInTheDocument();
        expect(screen.getByText(/Project Location/i)).toBeInTheDocument();
        expect(screen.getByText(/Live Activity - Engagement/i)).toBeInTheDocument();
    });
});
