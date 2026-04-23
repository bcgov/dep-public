import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import EngagementForm from '../../../../src/components/engagement/form';
import * as widgetService from 'services/widgetService';
import { WidgetType } from 'models/widget';
import { draftEngagement, subscribeWidget } from '../factory';
import { USER_ROLES } from 'services/userService/constants';
import { setupWidgetTestEnvMock, setupWidgetTestEnvSpy } from '../widgets/setupWidgetTestEnv';
import { createMemoryRouter, RouterProvider } from 'react-router';

jest.mock('components/map', () => () => <div></div>);
jest.mock('axios');
jest.mock('components/common/RichTextEditor', () => ({
    __esModule: true,
    default: ({
        setRawText,
        handleEditorStateChange,
    }: {
        setRawText: (text: string) => void;
        handleEditorStateChange: (state: string) => void;
    }) => (
        <div
            data-testid="rich-text-editor"
            contentEditable
            onInput={(event) => {
                const text = (event.currentTarget.textContent ?? '').trim();
                setRawText(text);
                handleEditorStateChange(text);
            }}
        />
    ),
}));
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
    unwrap: () => Promise.resolve(subscribeWidget),
}));
const mockUpdateWidget = jest.fn(() => ({
    unwrap: () => Promise.resolve(subscribeWidget),
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
jest.mock('services/subscriptionService', () => ({
    postSubscribeForm: jest.fn(),
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

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useRouteMatch: () => ({ url: '/engagements/create/form/' }),
    useRouteLoaderData: (routeId: string) => {
        if (routeId === 'single-engagement') {
            return {
                engagement: Promise.resolve(draftEngagement),
                widgets: Promise.resolve([]),
                metadata: Promise.resolve([]),
            };
        }
    },
    useLoaderData: () => ({
        engagement: Promise.resolve(draftEngagement),
        widgets: Promise.resolve([]),
        metadata: Promise.resolve([]),
    }),
}));

async function addSubscribeWidget() {
    await waitFor(() => expect(screen.getByText('Add Widget')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Add Widget')).toBeEnabled());
    fireEvent.click(screen.getByText('Add Widget'));
    await waitFor(() => expect(screen.getByText('Select Widget')).toBeVisible());
    fireEvent.click(screen.getByTestId(`widget-drawer-option/${WidgetType.Subscribe}`));

    await waitFor(() => {
        expect(screen.getByText('Email List')).toBeVisible();
        expect(screen.getByText('Form Sign-up')).toBeVisible();
    });
}

async function inputMockSubscribeData() {
    const callToActionText = document.querySelector('input[name="callToActionText"]') as HTMLInputElement;
    const richTextEditorDesc = screen.getByTestId('rich-text-editor') as HTMLDivElement;

    const linkRadioButton = screen.getByLabelText('Link');
    const buttonRadioButton = screen.getByLabelText('Button');

    // Simulate typing into the rich text editor
    richTextEditorDesc.textContent = 'Your desired text';
    fireEvent.input(richTextEditorDesc);
    fireEvent.change(callToActionText, { target: { value: 'Click here' } });
    fireEvent.click(linkRadioButton);

    await waitFor(() => {
        expect(richTextEditorDesc.textContent).toBe('Your desired text');
        expect(callToActionText.value).toBe('Click here');
        // Check if the "Link" radio button is selected
        expect(linkRadioButton).toBeChecked();
        // Check if the "Button" radio button is not selected
        expect(buttonRadioButton).not.toBeChecked();
    });
}

async function selectEmailList() {
    const emailListButton = screen.getByRole('button', { name: 'Email List' });
    fireEvent.click(emailListButton);
    await waitFor(() => {
        expect(screen.getByText('Description')).toBeVisible();
        expect(screen.getByText('Call-to-action Type')).toBeVisible();
    });
}

async function selectFormSignUp() {
    const formSignUpButton = screen.getByRole('button', { name: 'Form Sign-up' });
    fireEvent.click(formSignUpButton);
    await waitFor(() => {
        expect(screen.getByText('Description')).toBeVisible();
        expect(screen.getByText('Call-to-action Type')).toBeVisible();
    });
}

describe('Subscribe Widget tests', () => {
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
                getWidgetsMock.mockResolvedValue([subscribeWidget]);
                return subscribeWidget;
            },
        }));
    });

    test('Subscribe widget is created when option is clicked', async () => {
        render(<RouterProvider router={router} />);

        await addSubscribeWidget();

        expect(getWidgetsMock).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Email List' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Form Sign-up' })).toBeVisible();
    });

    test('Subscribe widget Email List handles input correctly', async () => {
        render(<RouterProvider router={router} />);
        await addSubscribeWidget();
        await selectEmailList();
        await inputMockSubscribeData();
    });

    test('Subscribe widget Form sign up handles input correctly', async () => {
        render(<RouterProvider router={router} />);
        await addSubscribeWidget();
        await selectFormSignUp();
        await inputMockSubscribeData();
    });
});
