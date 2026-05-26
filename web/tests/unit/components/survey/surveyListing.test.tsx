import React, { ReactNode } from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryRouter, RouterProvider } from 'react-router';
import SurveyListing from '../../../../src/components/survey/listing';
import { setupEnv } from '../setEnvVars';
import * as surveyService from 'services/surveyService';
import * as notificationSlice from 'services/notificationService/notificationSlice';
import { createDefaultSurvey } from 'models/survey';
import { createDefaultEngagement } from 'models/engagement';
import { EngagementStatus } from 'constants/engagementStatus';
import assert from 'assert';
import { USER_ROLES } from 'services/userService/constants';

const mockEngagementOne = {
    ...createDefaultEngagement(),
    id: 1,
    name: 'Engagement One',
    created_date: '2022-09-14 10:00:00',
    rich_content:
        '{"blocks":[{"key":"29p4m","text":"Test content","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    content: 'Test content',
    rich_description:
        '{"blocks":[{"key":"bqupg","text":"Test description","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    description: 'Test description',
    description_title: 'Test Description Title',
    start_date: '2022-09-01 12:00:00',
    end_date: '2022-09-30 12:00:00',
    engagement_status: {
        id: EngagementStatus.Draft,
        status_name: 'Draft',
    },
};
const mockSurveyOne = {
    ...createDefaultSurvey(),
    id: 1,
    name: 'Survey One',
    engagement_id: 1,
    engagement: mockEngagementOne,
    created_date: '2022-09-14 10:00:00',
};

const mockEngagementTwo = {
    ...mockEngagementOne,
    id: 2,
    name: 'Engagement Two',
    engagement_status: {
        id: EngagementStatus.Published,
        status_name: 'Open',
    },
    created_date: '2022-09-15 10:00:00',
    published_date: '2022-09-19 10:00:00',
    submissions_meta_data: {
        total: 1,
        pending: 0,
        needs_further_review: 0,
        rejected: 0,
        approved: 1,
    },
};

const mockSurveyTwo = {
    ...createDefaultSurvey(),
    id: 2,
    name: 'Survey Two',
    engagement_id: 2,
    engagement: mockEngagementTwo,
    created_date: '2022-09-15 10:00:00',
    comments_meta_data: {
        total: 12,
        pending: 1,
        approved: 4,
        rejected: 3,
        needs_further_review: 4,
    },
};

jest.mock('axios');

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    Link: ({ children }: { children: ReactNode }) => {
        return <a>{children}</a>;
    },
    useMediaQuery: () => false,
}));

jest.mock('components/permissionsGate', () => ({
    ...jest.requireActual('components/permissionsGate'),
    PermissionsGate: ({ children }: { children: ReactNode }) => {
        return <>{children}</>;
    },
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn(() => {
        return {
            roles: [USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS, USER_ROLES.EDIT_ENGAGEMENT, USER_ROLES.CREATE_ENGAGEMENT],
            assignedEngagements: [mockEngagementOne.id, mockEngagementTwo.id],
        };
    }),
    useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({
        search: '',
    })),
}));

const router = createMemoryRouter(
    [
        {
            element: <SurveyListing />,
            path: '/',
        },
    ],
    { initialEntries: ['/'] },
);

describe('Survey form page tests', () => {
    jest.spyOn(notificationSlice, 'openNotification').mockImplementation(jest.fn());
    const getSurveysPageMock = jest.spyOn(surveyService, 'getSurveysPage');

    beforeEach(() => {
        setupEnv();
    });
    test('Survey table is rendered and surveys are fetched', async () => {
        getSurveysPageMock.mockReturnValue(
            Promise.resolve({
                items: [mockSurveyOne, mockSurveyTwo],
                total: 2,
            }),
        );
        render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Survey One')).toBeInTheDocument();
            expect(screen.getByText('2022-09-14')).toBeInTheDocument();

            expect(screen.getByText('Survey Two')).toBeInTheDocument();
            expect(screen.getByText('2022-09-15')).toBeInTheDocument();
            expect(screen.getByText('2022-09-19')).toBeInTheDocument();
        });

        expect(screen.getByText('Create Survey', { exact: false })).toBeInTheDocument();
    });

    test('Search filter works and fetchs surveys with the search text as a param', async () => {
        getSurveysPageMock.mockReturnValue(
            Promise.resolve({
                items: [mockSurveyOne],
                total: 1,
            }),
        );
        const { container } = render(<RouterProvider router={router} />);

        await waitFor(() => {
            expect(screen.getByText('Survey One')).toBeInTheDocument();
        });

        const searchField = container.querySelector('input[name="searchText"]');
        assert(searchField, 'Unable to find search field that matches the given query');

        fireEvent.change(searchField, { target: { value: 'Survey One' } });
        fireEvent.click(screen.getByTestId('survey/listing/search-button'));

        await waitFor(() => {
            expect(getSurveysPageMock).toHaveBeenLastCalledWith({
                page: 1,
                size: 10,
                sort_key: 'survey.created_date',
                sort_order: 'desc',
                search_text: 'Survey One',
                is_unlinked: false,
                is_template: false,
                is_hidden: false,
                is_linked: false,
                created_date_from: '',
                created_date_to: '',
                published_date_from: '',
                published_date_to: '',
            });
        });
    });
});
