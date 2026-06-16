// Import necessary utilities and components
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { ReactNode } from 'react';
import CommentReview from 'components/comments/admin/review/CommentReview';
import * as submissionService from 'services/submissionService';
import * as surveyService from 'services/surveyService';
import { createDefaultComment } from 'models/comment';
import { createDefaultSurvey } from 'models/survey';
import { createDefaultSubmission } from 'models/surveySubmission';
import { USER_ROLES } from 'services/userService/constants';
import { setupEnv } from '../setEnvVars';

// Mocking the external modules and services used in CommentReview
jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    Link: ({ children }: { children: ReactNode }) => {
        return <a>{children}</a>;
    },
}));
jest.mock('axios');
jest.mock('services/submissionService', () => ({
    getSubmission: jest.fn(),
    reviewComments: jest.fn(),
}));
jest.mock('services/surveyService', () => ({
    getSurvey: jest.fn(),
}));
jest.mock('services/notificationService/notificationSlice', () => ({
    openNotification: jest.fn(),
}));
// Extend the react-router mock
jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useNavigate: jest.fn(),
    useParams: jest.fn(() => ({
        submissionId: '1', // Mock submissionId here
        surveyId: '1', // Mock surveyId if needed
    })),
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn((callback) =>
        callback({
            user: {
                roles: [
                    USER_ROLES.REVIEW_COMMENTS,
                    USER_ROLES.EXPORT_ALL_TO_CSV,
                    USER_ROLES.EXPORT_INTERNAL_COMMENT_SHEET,
                    USER_ROLES.EXPORT_PROPONENT_COMMENT_SHEET,
                ],
            },
            assignedEngagements: [1],
            tenant: 'test',
        }),
    ),
    useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('hooks', () => {
    const translations: Record<string, string> = {};

    return {
        useAppTranslation: () => ({
            t: (key: string) => translations[key] || key,
        }),
        useAppDispatch: () => jest.fn(),
        useAppSelector: jest.fn(() => true),
    };
});

// Define the test suite for CommentReview
describe('CommentReview Component', () => {
    // Mock data for submission and survey
    const mockSurveyOne = {
        ...createDefaultSurvey(),
        id: 1,
        name: 'Survey One',
        slug: 'survey-one',
        engagement_id: 1,
        created_date: '2022-09-14 10:00:00',
        engagement: {
            id: 0,
            name: '',
            slug: '',
            description: '',
            rich_description: '',
            description_title: '',
            status_id: 0,
            start_date: '',
            end_date: '2024-04-10', // Apr 10, 2024
            published_date: '',
            scheduled_date: '',
            user_id: '',
            created_date: '',
            updated_date: '',
            banner_url: '',
            banner_filename: '',
            content: '',
            rich_content: '',
            engagement_status: { id: 0, status_name: '' },
            surveys: [],
            submission_status: 1,
            tenant_id: 0,
            submissions_meta_data: {
                total: 0,
                pending: 0,
                needs_further_review: 0,
                rejected: 0,
                approved: 0,
            },
            feedback_heading: '',
            feedback_body: '',
            selected_survey_id: 0,
            status_block: [],
            is_internal: false,
            consent_message: '',
            sponsor_name: '',
        },
    };

    const mockComment1 = {
        ...createDefaultComment(),
        id: 1,
        text: 'Mock comment text',
        survey_id: mockSurveyOne.id,
        submission_id: 1,
        reviewed_by: 'Mock Reviewer',
        comment_status_id: 1,
        created_date: '2022-09-14 10:00:00',
        review_date: '2022-09-14 10:00:00',
    };
    const mockSubmission1 = {
        ...createDefaultSubmission(),
        id: 1,
        survey_id: 1,
        comments: [mockComment1],
        reviewed_by: 'Mock Reviewer',
    };

    // Setup before each test to initialize mock returns
    beforeEach(() => {
        setupEnv();
        jest.spyOn(submissionService, 'getSubmission').mockReturnValue(Promise.resolve(mockSubmission1));
        jest.spyOn(surveyService, 'getSurvey').mockReturnValue(Promise.resolve(mockSurveyOne));
    });

    // Test to verify that submission and comment details are loaded and displayed
    test('loads and displays submission and comment details', async () => {
        render(<CommentReview />);
        await waitFor(() => {
            expect(screen.getByText('Comment ID:')).toBeInTheDocument();
            expect(screen.getByText('Comment Date:')).toBeInTheDocument();
            expect(screen.getByText(mockComment1.text)).toBeInTheDocument();
        });
    });

    // Test to handle review status change and email preview triggering
    test('handle review change and trigger Email Preview', async () => {
        render(<CommentReview />);
        await waitFor(() => {
            fireEvent.click(screen.getByText('Reject'));
        });

        // Verify the modal opens and contains the expected date in the message
        fireEvent.click(screen.getByText('Preview Email'));
        await waitFor(() => {
            expect(screen.getByText('Close Preview')).toBeInTheDocument();
            expect(screen.getByText(/Apr 10, 2024/i)).toBeInTheDocument();
        });
    });
});
