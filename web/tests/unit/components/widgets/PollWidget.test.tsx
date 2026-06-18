import { render, waitFor, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import EngagementForm from '../../../../src/components/engagement/form';
import * as widgetService from 'services/widgetService';
import * as PollService from 'services/widgetService/PollService';
import { WidgetType } from 'models/widget';
import { draftEngagement, mockPoll, pollWidget } from '../factory';
import { USER_ROLES } from 'services/userService/constants';
import { setupWidgetTestEnvMock, setupWidgetTestEnvSpy } from './setupWidgetTestEnv';
import { createMemoryRouter, RouterProvider } from 'react-router';

function fulfilledPromise<T>(value: T): Promise<T> {
    const p = Promise.resolve(value);
    Object.assign(p, { status: 'fulfilled', value });
    return p;
}

const mockEngagementLoaderPromise = fulfilledPromise({ ...draftEngagement });
const mockWidgetsLoaderPromise = fulfilledPromise<never[]>([]);
const mockMetadataLoaderPromise = fulfilledPromise<never[]>([]);
const mockContentLoaderPromise = fulfilledPromise<never[]>([]);
const mockTaxaLoaderPromise = fulfilledPromise<never[]>([]);

jest.mock('components/map', () => () => <div></div>);
jest.mock('axios');
jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn((callback) =>
        callback({
            tenant: 'test',
            user: {
                roles: [USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS, USER_ROLES.EDIT_ENGAGEMENT, USER_ROLES.CREATE_ENGAGEMENT],
            },
            assignedEngagements: [draftEngagement.id],
        }),
    ),
    useDispatch: jest.fn(() => jest.fn()),
}));
const mockCreateWidget = jest.fn(() => ({
    unwrap: () => Promise.resolve(pollWidget),
}));
const mockUpdateWidget = jest.fn(() => ({
    unwrap: () => Promise.resolve(pollWidget),
}));

jest.mock('apiManager/apiSlices/widgets', () => ({
    ...jest.requireActual('apiManager/apiSlices/widgets'),
    useCreateWidgetMutation: () => [mockCreateWidget],
    useCreateWidgetItemsMutation: () => [mockCreateWidget],
    useUpdateWidgetMutation: () => [mockUpdateWidget],
    useDeleteWidgetMutation: () => [jest.fn(() => Promise.resolve())],
    useSortWidgetsMutation: () => [jest.fn(() => Promise.resolve())],
}));

// Mock the necessary services and contexts
jest.mock('services/widgetService/PollService', () => ({
    postPoll: jest.fn(),
    patchPoll: jest.fn(),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLocation: jest.fn(() => ({ search: '' })),
    useParams: jest.fn(() => {
        return { projectId: '', engagementId: '1' };
    }),
    useNavigate: () => jest.fn(),
    useRouteLoaderData: (routeId: string) => {
        if (routeId === 'single-engagement') {
            return {
                engagement: mockEngagementLoaderPromise,
                widgets: mockWidgetsLoaderPromise,
                metadata: mockMetadataLoaderPromise,
                content: mockContentLoaderPromise,
                taxa: mockTaxaLoaderPromise,
            };
        }
    },
}));

const router = createMemoryRouter(
    [
        {
            path: '/engagements/:engagementId/form/',
            element: <EngagementForm />,
        },
    ],
    {
        initialEntries: [`/engagements/${draftEngagement.id}/form/`],
    },
);

describe('Poll Widget tests', () => {
    const getWidgetsMock = jest.spyOn(widgetService, 'getWidgets').mockReturnValue(Promise.resolve([]));

    beforeAll(() => {
        setupWidgetTestEnvMock();
        setupWidgetTestEnvSpy();
    });

    beforeEach(() => {
        getWidgetsMock.mockReset();
        getWidgetsMock.mockResolvedValue([]);
        mockCreateWidget.mockImplementation(() => ({
            unwrap: async () => {
                getWidgetsMock.mockResolvedValue([pollWidget]);
                return pollWidget;
            },
        }));
    });

    async function addPollWidget() {
        await waitFor(() => expect(screen.getByText('Add Widget')).toBeInTheDocument());
        await waitFor(() => expect(screen.getByText('Add Widget')).toBeEnabled());
        fireEvent.click(screen.getByText('Add Widget'));
        await waitFor(() => expect(screen.getByText('Select Widget')).toBeVisible());
        fireEvent.click(screen.getByTestId(`widget-drawer-option/${WidgetType.Poll}`));

        await waitFor(() => {
            expect(screen.getByText('Poll Answers')).toBeVisible();
        });
    }

    async function inputMockPollData() {
        const titleInput = within(screen.getByTestId('title')).getByRole('textbox') as HTMLInputElement;
        const descInput = within(screen.getByTestId('description')).getByRole('textbox') as HTMLInputElement;
        const answerText1 = within(screen.getByTestId('answerText1')).getByRole('textbox') as HTMLInputElement;
        const statusButton = screen.getByTestId('status') as HTMLInputElement;
        const addAnswerButton = screen.getByText('Add Answer');

        fireEvent.change(titleInput, { target: { value: mockPoll.title } });
        fireEvent.change(descInput, { target: { value: mockPoll.description } });
        fireEvent.change(answerText1, { target: { value: mockPoll.answers[0].answer_text } });

        fireEvent.mouseDown(statusButton);
        const activeOption = screen.getByText('Active');
        fireEvent.click(activeOption);

        fireEvent.click(addAnswerButton);
        const answerText2 = within(screen.getByTestId('answerText2')).getByRole('textbox') as HTMLInputElement;
        fireEvent.change(answerText2, { target: { value: mockPoll.answers[1].answer_text } });

        // Find the parent element of the Select component using the data-testid
        const selectParent = screen.getByTestId('status').parentElement;

        // Find the hidden input within this parent element
        const hiddenInput = selectParent?.querySelector('input[name="status"]') as HTMLInputElement;

        await waitFor(() => {
            expect(titleInput.value).toBe(mockPoll.title);
            expect(descInput.value).toBe(mockPoll.description);
            expect(answerText1.value).toBe(mockPoll.answers[0].answer_text);
            expect(answerText2.value).toBe(mockPoll.answers[1].answer_text);
            expect(hiddenInput.value).toBe('active');
        });
    }

    test('Poll widget is created when option is clicked', async () => {
        render(<RouterProvider router={router} />);

        await addPollWidget();

        expect(getWidgetsMock).toHaveBeenCalled();

        expect(screen.getByText('Title')).toBeVisible();
        expect(screen.getByText('Description')).toBeVisible();
    });

    test('Multiple answers can be added on Poll widget', async () => {
        render(<RouterProvider router={router} />);
        await addPollWidget();

        const addAnswerButton = screen.getByText('Add Answer');
        fireEvent.click(addAnswerButton);
        fireEvent.click(addAnswerButton);

        await waitFor(() => {
            expect(screen.getByText('Answer Text 2')).toBeVisible();
            expect(screen.getByText('Answer Text 3')).toBeVisible();
        });
    });

    test('Poll widget handles input correctly', async () => {
        render(<RouterProvider router={router} />);
        await addPollWidget();
        await inputMockPollData();
    });

    test('Poll can be submitted after inputting mock data', async () => {
        render(<RouterProvider router={router} />);

        await addPollWidget();
        await inputMockPollData();

        const submitButton = screen.getByTestId('save-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(PollService.postPoll).toHaveBeenCalledTimes(1);
        });
    });
});
