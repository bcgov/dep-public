import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setupEnv } from '../setEnvVars';
import * as reportSettingsService from 'services/surveyService/reportSettingsService';
import { createDefaultSurvey, Survey } from 'models/survey';
import ReportSettings from 'components/survey/report';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SurveyReportSetting } from 'models/surveyReportSetting';
import { createDefaultEngagement } from 'models/engagement';

global['Request'] = jest.fn().mockImplementation((input: string = '', init: RequestInit = {}) => ({
    // React Router data APIs call toUpperCase on request.method; default to GET
    method: (init.method || 'GET').toUpperCase(),
    url: input,
    headers: {
        get: jest.fn(),
        has: jest.fn(),
    },
    signal: {
        removeEventListener: jest.fn(),
        addEventListener: jest.fn(),
    },
    clone: jest.fn(),
}));

const survey: Survey = {
    ...createDefaultSurvey(),
    engagement: { ...createDefaultEngagement() },
    id: 1,
    name: 'Survey 1',
    engagement_id: 1,
};

const surveyReportSettingOne: SurveyReportSetting = {
    id: 1,
    survey_id: survey.id,
    question_id: 1,
    question_key: 'question key one',
    question_type: 'question type one',
    question: 'question one',
    display: true,
};

const surveyReportSettingTwo: SurveyReportSetting = {
    id: 2,
    survey_id: survey.id,
    question_id: 2,
    question_key: 'question key two',
    question_type: 'question type two',
    question: 'question two',
    display: false,
};

const SurveyReportSettings: SurveyReportSetting[] = [surveyReportSettingOne, surveyReportSettingTwo];

const draftEngagement = {
    ...createDefaultEngagement(),
    id: 1,
};

const engagementSlug = { slug: 'engagement-name' };

jest.mock('axios');

jest.mock('hooks', () => ({
    ...jest.requireActual('hooks'),
    useAppSelector: jest.fn(() => true),
    useAppDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: jest.fn(() => true),
}));

type FetcherMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
interface FetcherSubmitOptions {
    method?: FetcherMethod;
    encType?: string;
    action?: string;
}
type SubmitData = FormData | URLSearchParams | Record<string, unknown> | unknown[];

interface SubmitImplRef {
    impl?: (data: SubmitData, opts?: FetcherSubmitOptions) => void;
}

interface MockFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    onSubmit?: React.FormEventHandler<HTMLFormElement>;
    children?: React.ReactNode;
}

jest.mock('react-router', () => {
    const actual = jest.requireActual('react-router');

    const submitImplRef: SubmitImplRef = {};

    const MockForm = ({ onSubmit, children, ...rest }: MockFormProps) => (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (onSubmit) onSubmit(e);
            }}
            {...rest}
        >
            {children}
        </form>
    );

    return {
        ...actual,
        useParams: jest.fn(() => ({ surveyId: String(survey.id) })),
        useRouteLoaderData: jest.fn((id?: string) => {
            if (id === 'survey') {
                return {
                    survey,
                    slug: engagementSlug,
                    reportSettings: SurveyReportSettings,
                    engagement: draftEngagement,
                    surveyId: String(survey.id),
                };
            }
            return undefined;
        }),
        useFetcher: jest.fn(() => ({
            state: 'idle' as const,
            data: undefined as unknown,
            submit: (data: SubmitData, opts?: FetcherSubmitOptions) => {
                if (submitImplRef.impl) submitImplRef.impl(data, opts);
            },
            Form: MockForm,
        })),
        Form: MockForm,
        useRevalidator: jest.fn(() => ({
            revalidate: jest.fn(),
            state: 'idle' as const,
        })),
        useNavigate: jest.fn(() => jest.fn()),
        __TESTING__: { submitImplRef },
    };
});

const { __TESTING__ }: { __TESTING__: { submitImplRef: SubmitImplRef } } = jest.requireMock('react-router');

describe('Survey report settings tests', () => {
    let updateSurveyReportSettingsMock: jest.SpyInstance<
        Promise<SurveyReportSetting[]>,
        [string, SurveyReportSetting[]]
    >;

    beforeEach(() => {
        setupEnv();
        jest.clearAllMocks();

        updateSurveyReportSettingsMock = jest
            .spyOn(reportSettingsService, 'updateSurveyReportSettings')
            .mockResolvedValue(SurveyReportSettings);

        __TESTING__.submitImplRef.impl = (data: SubmitData, _opts?: FetcherSubmitOptions) => {
            let updates: SurveyReportSetting[] = [];

            if (typeof FormData !== 'undefined' && data instanceof FormData) {
                const raw = data.get('updates');
                updates = raw ? (JSON.parse(raw?.toString()) as SurveyReportSetting[]) : [];
            } else if (Array.isArray(data)) {
                updates = data as SurveyReportSetting[];
            } else {
                const obj = data as Record<string, unknown>;
                const maybeUpdates = obj?.updates;
                updates = Array.isArray(maybeUpdates) ? (maybeUpdates as SurveyReportSetting[]) : [];
            }

            reportSettingsService.updateSurveyReportSettings(String(survey.id), updates);
        };
    });

    afterEach(() => {
        __TESTING__.submitImplRef.impl = undefined;
    });

    function renderPage() {
        const router = createMemoryRouter(
            [
                {
                    element: <ReportSettings />,
                    path: '/surveys/1/report',
                },
            ],
            { initialEntries: ['/surveys/1/report'] },
        );

        return render(<RouterProvider router={router} />);
    }

    test('View survey report settings page', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText(surveyReportSettingOne.question_type)).toBeVisible();
            expect(screen.getByText(surveyReportSettingOne.question)).toBeVisible();
            expect(screen.getByText(surveyReportSettingTwo.question_type)).toBeVisible();
            expect(screen.getByText(surveyReportSettingTwo.question)).toBeVisible();
        });

        expect(screen.getByTestId(`checkbox-${surveyReportSettingOne.id}`).children[0]).toBeChecked();
        expect(screen.getByTestId(`checkbox-${surveyReportSettingTwo.id}`).children[0]).not.toBeChecked();
    });

    test('Search question by question text', async () => {
        const { container } = renderPage();

        await waitFor(() => {
            expect(screen.getByText(surveyReportSettingOne.question)).toBeVisible();
            expect(screen.getByText(surveyReportSettingOne.question_type)).toBeVisible();
        });

        const searchField = container.querySelector('input[name="searchText"]') as HTMLInputElement;
        expect(searchField).toBeTruthy();

        fireEvent.change(searchField, { target: { value: surveyReportSettingOne.question } });
        fireEvent.click(screen.getByTestId('survey/report/search-button'));

        const tableBody = container.querySelector('tbody');
        expect(tableBody).toBeTruthy();

        const originalNumberOfRows = SurveyReportSettings.length + 1;

        await waitFor(() => {
            expect(tableBody?.children.length).toBe(originalNumberOfRows - 1);
        });
    });

    test('Survey report settings can be updated', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText(surveyReportSettingOne.question)).toBeVisible();
            expect(screen.getByText(surveyReportSettingTwo.question)).toBeVisible();
        });

        const uncheckedBox = screen.getByTestId(`checkbox-${surveyReportSettingTwo.id}`)
            .children[0] as HTMLInputElement;
        expect(uncheckedBox).toBeInTheDocument();
        expect(uncheckedBox).not.toBeChecked();

        fireEvent.click(uncheckedBox);

        await waitFor(() => {
            expect(screen.getByTestId(`checkbox-${surveyReportSettingTwo.id}`).children[0]).toBeChecked();
        });

        fireEvent.click(screen.getByTestId('survey/report/save-button'));

        await waitFor(() => {
            expect(updateSurveyReportSettingsMock).toHaveBeenCalledTimes(1);
            expect(updateSurveyReportSettingsMock).toHaveBeenCalledWith(
                String(survey.id),
                expect.arrayContaining([expect.objectContaining({ id: 2, display: true })]),
            );
        });
    });
});
