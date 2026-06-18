import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import EngagementForm from '../../../../src/components/engagement/form';
import * as widgetService from 'services/widgetService';
import * as TimeLineService from 'services/widgetService/TimelineService';
import { WidgetType } from 'models/widget';
import { draftEngagement, mockTimeLine, timeLineWidget } from '../factory';
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
    unwrap: () => Promise.resolve(timeLineWidget),
}));
const mockUpdateWidget = jest.fn(() => ({
    unwrap: () => Promise.resolve(timeLineWidget),
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
jest.mock('services/widgetService/TimelineService', () => ({
    postTimeline: jest.fn(),
    patchTimeline: jest.fn(),
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

describe('TimeLine Widget tests', () => {
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
                getWidgetsMock.mockResolvedValue([timeLineWidget]);
                return timeLineWidget;
            },
        }));
    });

    async function addTimeLineWidget() {
        await waitFor(() => expect(screen.getByText('Add Widget')).toBeInTheDocument());
        await waitFor(() => expect(screen.getByText('Add Widget')).toBeEnabled());
        fireEvent.click(screen.getByText('Add Widget'));

        await waitFor(() => expect(screen.getByText('Select Widget')).toBeVisible());
        fireEvent.click(screen.getByTestId(`widget-drawer-option/${WidgetType.Timeline}`));

        await waitFor(() => {
            expect(screen.getByText('Title')).toBeVisible();
            expect(screen.getByText('Description')).toBeVisible();
        });
    }

    async function inputMockTimeLinedata() {
        const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
        const descInput = document.querySelector('textarea[name="description"]') as HTMLInputElement;

        fireEvent.change(titleInput, { target: { value: mockTimeLine.title } });
        fireEvent.change(descInput, { target: { value: mockTimeLine.description } });

        // Adding First Event
        const eventDesc1 = document.querySelector('input[name="eventDescription1"]') as HTMLInputElement;
        const eventTime1 = document.querySelector('input[name="eventTime1"]') as HTMLInputElement;
        const selectElement1 = document.querySelector('input[name="eventStatus1"]') as HTMLInputElement;
        const selectButton1 = screen.getByRole('combobox');

        fireEvent.change(eventDesc1, { target: { value: mockTimeLine.events[0].description } });
        fireEvent.change(eventTime1, { target: { value: mockTimeLine.events[0].time } });
        fireEvent.mouseDown(selectButton1);
        fireEvent.click(screen.getByRole('option', { name: 'Pending' }));

        await waitFor(() => {
            expect(titleInput.value).toBe(mockTimeLine.title);
            expect(descInput.value).toBe(mockTimeLine.description);
            expect(selectElement1.value).toBe('1');
        });
    }

    test('TimeLine widget is created when option is clicked', async () => {
        render(<RouterProvider router={router} />);
        await addTimeLineWidget();
        expect(getWidgetsMock).toHaveBeenCalled();
        expect(screen.getByText('Description')).toBeVisible();
        expect(screen.getByText('Event 1')).toBeVisible();
    });

    test('TimeLine widget handles input correctly', async () => {
        render(<RouterProvider router={router} />);
        await addTimeLineWidget();
        await inputMockTimeLinedata();
    });

    test('TimeLine can be submitted after inputting mock data', async () => {
        render(<RouterProvider router={router} />);

        await addTimeLineWidget();
        await inputMockTimeLinedata();

        const submitButton = screen.getByRole('button', { name: 'Save & Close' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(TimeLineService.postTimeline).toHaveBeenCalledTimes(1);
        });
    });
});
