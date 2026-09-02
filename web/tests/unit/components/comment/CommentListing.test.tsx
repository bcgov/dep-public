import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React, { ReactNode } from 'react';
import '@testing-library/jest-dom';
import { setupEnv } from '../setEnvVars';
import * as commentService from 'services/commentService';
import * as surveyService from 'services/surveyService';
import * as submissionService from 'services/submissionService';
import { createDefaultSurvey } from 'models/survey';
import { createDefaultSubmission } from 'models/surveySubmission';
import { createDefaultComment } from 'models/comment';
import SubmissionListing from 'components/comments/admin/reviewListing';
import CommentTextListing from 'components/comments/admin/textListing';
import * as utils from 'utils';
import { USER_ROLES } from 'services/userService/constants';
import type { AxiosResponse } from 'axios';
import { createDefaultEngagement } from 'models/engagement';

const defaultSurvey = {
    ...createDefaultSurvey(),
    engagement: {
        ...createDefaultEngagement(),
        feedback_body:
            '{"blocks":[{"key":"bqupg","text":"Test description","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
        feedback_heading: 'Engagement 1',
        surveys: [],
        selected_survey_id: 1,
    },
};

const mockSurveyOne = {
    ...defaultSurvey,
    id: 1,
    name: 'Survey One',
    engagement_id: 1,
    created_date: '2022-09-14 10:00:00',
};

const mockComment1 = {
    ...createDefaultComment(),
    id: 1,
    text: 'Mock comment text',
    survey_id: mockSurveyOne.id,
    submission_id: 1,
    reviewed_by: 'Mock Reviewer',
};
const mockSubmission1 = {
    ...createDefaultSubmission(),
    id: 1,
    survey_id: 1,
    comments: [mockComment1],
    reviewed_by: 'Mock Reviewer',
};

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: () => false,
    Link: ({ children }: { children: ReactNode }) => {
        return <a>{children}</a>;
    },
}));

jest.mock('axios');

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLocation: jest.fn(() => ({ search: '' })),
    useParams: jest.fn(() => {
        return { surveyId: 1 };
    }),
    useNavigate: jest.fn(),
    Link: ({ children, to }: { children: ReactNode; to: string }) => {
        return <a href={to}>{children}</a>;
    },
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn((callback) =>
        callback({
            tenant: 'test',
            user: {
                roles: [
                    USER_ROLES.REVIEW_COMMENTS,
                    USER_ROLES.EXPORT_ALL_TO_CSV,
                    USER_ROLES.EXPORT_INTERNAL_COMMENT_SHEET,
                    USER_ROLES.EXPORT_PROPONENT_COMMENT_SHEET,
                ],
                userDetail: {
                    first_name: 'Mock first name',
                    last_name: 'Mock last name',
                },
            },
            assignedEngagements: [mockSurveyOne.engagement_id],
        }),
    ),
    useDispatch: jest.fn(() => jest.fn()),
}));

describe('Comment listing tests', () => {
    jest.spyOn(surveyService, 'getSurvey').mockReturnValue(Promise.resolve(mockSurveyOne));
    jest.spyOn(submissionService, 'getSubmissionPage').mockReturnValue(
        Promise.resolve({
            items: [mockSubmission1],
            total: 1,
        }),
    );
    const mockGetCommentsSheet = jest.spyOn(commentService, 'getStaffCommentSheet').mockReturnValue(
        Promise.resolve({
            data: new Blob(),
            status: 200,
            statusText: '',
            headers: {},
            config: { headers: {} },
        } as AxiosResponse<Blob>),
    );
    const mockDownloadFile = jest.spyOn(utils, 'downloadFile').mockImplementation(() => jest.fn());

    beforeEach(() => {
        setupEnv();
    });

    test('Comment table is rendered', async () => {
        render(<SubmissionListing />);

        await waitFor(() => {
            expect(screen.getByText(mockSubmission1.reviewed_by)).toBeVisible();
            expect(screen.getByText(`${mockSurveyOne.name} Submissions`)).toBeVisible();
        });
    });

    test('Export comments work', async () => {
        render(<CommentTextListing />);

        await waitFor(() => {
            expect(screen.getByText(mockComment1.text)).toBeVisible();
        });

        const exportButton = screen.getByText('Export to CSV');
        fireEvent.click(exportButton);

        // Check if the dropdown content is visible
        const dropdownContent = screen.getByText('Internal Only/Detailed');
        await waitFor(() => {
            expect(dropdownContent).toBeInTheDocument();
        });

        // Click on the dropdown value
        fireEvent.click(dropdownContent);
        await waitFor(() => {
            expect(mockGetCommentsSheet).toHaveBeenCalledOnce();
            expect(mockDownloadFile).toHaveBeenCalledOnce();
        });
    });

    test('Advanced search appear', async () => {
        render(<SubmissionListing />);

        await waitFor(() => {
            expect(screen.getByText(`${mockSurveyOne.name} Submissions`)).toBeVisible();
            expect(screen.getByText(mockSubmission1.reviewed_by)).toBeVisible();
        });

        const advancedSearch = screen.getByText('Advanced Search');
        fireEvent.click(advancedSearch);

        await waitFor(() => {
            expect(screen.getByText('Reset All Filters')).toBeVisible();
        });
    });
});
