import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmissionTrend from 'components/publicDashboard/SubmissionTrend/SubmissionTrend';
import * as userResponseDetailService from 'services/analytics/userResponseDetailService';
import { closedEngagement } from '../factory';
import { UserResponseDetailByMonth } from 'models/analytics/userResponseDetail';

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: jest.fn(() => false),
}));

jest.mock('hooks', () => {
    const translations: Record<string, string> = {
        'dashboard.noData': 'No Data Available',
        'dashboard.submissionTrend.filter.label': 'Select Date Range',
        'dashboard.submissionTrend.filter.toggleBy.0': 'Weekly',
        'dashboard.submissionTrend.filter.toggleBy.1': 'Monthly',
        'dashboard.submissionTrend.filter.reset': 'Reset All Filters',
    };

    return {
        useAppTranslation: () => ({
            t: (key: string) => translations[key] || key,
        }),
    };
});

// Setting the mock ResizeObserver on the global window object
globalThis.ResizeObserver = jest.fn().mockImplementation(() => {
    return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    };
});

const mockEngagement = closedEngagement;

const getMonthlyDataMock = jest.spyOn(userResponseDetailService, 'getUserResponseDetailByMonth');

describe('SubmissionTrend Component Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('displays loading indicator while fetching data', async () => {
        getMonthlyDataMock.mockReturnValueOnce(
            Promise.resolve({
                showdataby: '',
                responses: 0,
            }),
        );
        render(<SubmissionTrend engagement={mockEngagement} engagementIsLoading={true} />);
        await waitFor(() => {
            expect(getMonthlyDataMock).toHaveBeenCalled();
        });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders correctly on successful monthly data fetch', async () => {
        const mockData: UserResponseDetailByMonth = { showdataby: 'January', responses: 100 };
        getMonthlyDataMock.mockResolvedValue(mockData);
        render(<SubmissionTrend engagement={mockEngagement} engagementIsLoading={false} />);
        await waitFor(() => {
            expect(getMonthlyDataMock).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByText('Select Date Range')).toBeInTheDocument();
            // Check if the "Weekly" toggle button is present
            const weeklyToggleButton = screen.getByText('Weekly');
            expect(weeklyToggleButton).toBeInTheDocument();

            // Check if the "Monthly" toggle button is present
            const monthlyToggleButton = screen.getByText('Monthly');
            expect(monthlyToggleButton).toBeInTheDocument();

            // Check if the "Reset All Filters" toggle button is present
            const resetFilterButton = screen.getByText('Reset All Filters');
            expect(resetFilterButton).toBeInTheDocument();
        });
    });

    test('displays error message on fetch failure', async () => {
        getMonthlyDataMock.mockRejectedValue(new Error('Fetch Error'));
        render(<SubmissionTrend engagement={mockEngagement} engagementIsLoading={false} />);
        await waitFor(() => {
            expect(getMonthlyDataMock).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByText('No Data Available')).toBeInTheDocument();
        });
    });
});
