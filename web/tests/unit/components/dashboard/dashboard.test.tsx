import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React, { ReactNode } from 'react';
import '@testing-library/jest-dom';
import Dashboard from 'components/dashboard';
import { setupEnv } from '../setEnvVars';
import * as engagementService from 'services/engagementService';
import * as aggregatorService from 'services/analytics/aggregatorService';
import * as userResponseDetailService from 'services/analytics/userResponseDetailService';
import * as surveyResultService from 'services/analytics/surveyResult';
import * as notificationSlice from 'services/notificationService/notificationSlice';
import { openEngagement, closedEngagement } from '../factory';

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    Link: ({ children }: { children: ReactNode }) => {
        return <a>{children}</a>;
    },
}));

jest.mock('react-router', () => {
    const actual = jest.requireActual('react-router');

    return {
        ...actual,
        useMatches: () => [],
    };
});

jest.mock('axios');

jest.mock('components/common', () => ({
    ...jest.requireActual('components/common'),
    PrimaryButtonOld: ({ children, ...rest }: { children: ReactNode; [prop: string]: unknown }) => {
        return <button {...rest}>{children}</button>;
    },
}));

jest.mock('components/common', () => ({
    ...jest.requireActual('components/common'),
    PrimaryButtonOld: ({ children, ...rest }: { children: ReactNode; [prop: string]: unknown }) => {
        return <button {...rest}>{children}</button>;
    },
}));

jest.mock('maplibre-gl/dist/maplibre-gl', () => ({
    Map: () => ({}),
}));

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: jest.fn(() => true),
}));

jest.mock('hooks', () => ({
    ...jest.requireActual('hooks'),
    useAppTranslation: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('components/common/Navigation/Breadcrumb', () => ({
    AutoBreadcrumbs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('components/publicDashboard/KPI/SurveyEmailsSent', () => {
    return () => React.createElement('div', null, 'Survey Emails Sent');
});

jest.mock('components/publicDashboard/KPI/SurveysCompleted', () => {
    return () => React.createElement('div', null, 'Surveys Completed');
});

jest.mock('components/publicDashboard/KPI/ProjectLocation', () => {
    return () => React.createElement('div', null, 'Project Location');
});

jest.mock('components/publicDashboard/SubmissionTrend/SubmissionTrend', () => {
    return () => React.createElement('div', null, 'Submission Trend');
});

jest.mock('components/publicDashboard/SurveyBar', () => {
    return () => React.createElement('div', null, 'Survey Bar');
});

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(() => jest.fn()),
}));

describe('Dashboard page tests', () => {
    jest.spyOn(notificationSlice, 'openNotification').mockImplementation(jest.fn());
    const getEngagementMock = jest
        .spyOn(engagementService, 'getEngagements')
        .mockReturnValue(Promise.resolve({ items: [], total: 0 }));
    const getAggregatorMock = jest.spyOn(aggregatorService, 'getAggregatorData');
    const getUserResponseDetailByMonthMock = jest.spyOn(userResponseDetailService, 'getUserResponseDetailByMonth');
    const getSurveyResultDataMock = jest.spyOn(surveyResultService, 'getSurveyResultData');

    beforeEach(() => {
        setupEnv();
    });

    test('Dashboard is rendered and engagements are fetched', async () => {
        getEngagementMock.mockReturnValueOnce(
            Promise.resolve({
                items: [openEngagement, closedEngagement],
                total: 2,
            }),
        );
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Open Engagement')).toBeInTheDocument();
            expect(screen.getByText('Closed Engagement')).toBeInTheDocument();
        });
    });

    test('Accordion expands and dashboard is displayed', async () => {
        getEngagementMock.mockReturnValueOnce(
            Promise.resolve({
                items: [closedEngagement, openEngagement],
                total: 1,
            }),
        );
        getAggregatorMock.mockReturnValueOnce(
            Promise.resolve({
                key: '',
                value: 0,
            }),
        );
        getUserResponseDetailByMonthMock.mockReturnValueOnce(
            Promise.resolve({
                showdataby: '',
                responses: 0,
            }),
        );
        getSurveyResultDataMock.mockReturnValueOnce(
            Promise.resolve({
                data: [
                    {
                        label: '',
                        position: 0,
                        result: [{ value: '', count: 0 }],
                    },
                ],
            }),
        );
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Open Engagement')).toBeInTheDocument();
        });

        const accordion = screen.getByTestId(`engagement-accordion-${openEngagement.id}`);
        expect(accordion).toBeVisible();

        fireEvent.click(accordion);
        expect(screen.getByTestId(`dashboard-frame-${openEngagement.id}`)).toBeVisible();
    });
});
