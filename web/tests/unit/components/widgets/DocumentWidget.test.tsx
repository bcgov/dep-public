import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import EngagementForm from '../../../../src/components/engagement/form';
import { setupEnv } from '../setEnvVars';
import * as reactRouter from 'react-router';
import * as engagementService from 'services/engagementService';
import * as widgetService from 'services/widgetService';
import * as documentService from 'services/widgetService/DocumentService';
import * as notificationSlice from 'services/notificationService/notificationSlice';
import * as engagementMetadataService from 'services/engagementMetadataService';
import * as membershipService from 'services/membershipService';
import * as engagementSettingService from 'services/engagementSettingService';
import {
    createDefaultEngagement,
    createDefaultEngagementSettings,
    Engagement,
    EngagementSettings,
} from 'models/engagement';
import { EngagementStatus } from 'constants/engagementStatus';
import { Widget, WidgetType, WidgetLocation } from 'models/widget';
import { DocumentItem } from 'models/document';
import { USER_ROLES } from 'services/userService/constants';
import { engagementMetadata } from '../factory';
import { createMemoryRouter, RouterProvider } from 'react-router';

const engagement: Engagement = {
    ...createDefaultEngagement(),
    id: 1,
    name: 'Test Engagement',
    created_date: '2022-09-14 20:16:29.846877',
    rich_content:
        '{"blocks":[{"key":"29p4m","text":"Test content","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
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

const mockEngagementSettings: EngagementSettings = {
    ...createDefaultEngagementSettings(),
};

const mockFile: DocumentItem = {
    id: 1,
    title: 'Test file',
    type: 'file',
    url: 'https://random-s3-url/new-bucket-048a62a2/test.jpg',
};

const mockFolder: DocumentItem = {
    id: 2,
    title: 'Test folder',
    type: 'folder',
    children: [mockFile],
};

const documentWidget: Widget = {
    id: 1,
    title: 'Documents',
    widget_type_id: WidgetType.Document,
    engagement_id: 1,
    items: [],
    location: WidgetLocation.Summary,
};

jest.mock('axios');

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
                engagement: Promise.resolve({
                    ...engagement,
                }),
                widgets: Promise.resolve([documentWidget]),
                metadata: Promise.resolve([]),
                content: Promise.resolve([]),
                taxa: Promise.resolve([]),
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
        initialEntries: [`/engagements/${engagement.id}/form/`],
    },
);
jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn((callback) =>
        callback({
            tenant: 'test',
            user: {
                roles: [USER_ROLES.VIEW_PRIVATE_ENGAGEMENTS, USER_ROLES.EDIT_ENGAGEMENT, USER_ROLES.CREATE_ENGAGEMENT],
            },
            assignedEngagements: [engagement.id],
        }),
    ),
    useDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('@reduxjs/toolkit/query/react', () => ({
    ...jest.requireActual('@reduxjs/toolkit/query/react'),
    fetchBaseQuery: jest.fn(),
}));

const mockCreateWidget = jest.fn(() => ({
    unwrap: jest.fn(() => Promise.resolve(documentWidget)),
}));
jest.mock('apiManager/apiSlices/widgets', () => ({
    ...jest.requireActual('apiManager/apiSlices/widgets'),
    useCreateWidgetMutation: () => [mockCreateWidget],
    useUpdateWidgetMutation: () => [jest.fn(() => Promise.resolve(documentWidget))],
    useDeleteWidgetMutation: () => [jest.fn(() => Promise.resolve())],
    useSortWidgetsMutation: () => [jest.fn(() => Promise.resolve())],
}));

jest.mock('components/map', () => () => {
    return <div></div>;
});

describe.skip('Document widget in engagement page tests', () => {
    // Uses old engagement form to render the document widget
    // TODO: Replace with new test that makes sure document widgets are rendered in form contexts
    jest.spyOn(notificationSlice, 'openNotification').mockImplementation(jest.fn());
    jest.spyOn(engagementService, 'getEngagement').mockReturnValue(Promise.resolve(engagement));
    const fetchDocumentsMock = jest
        .spyOn(documentService, 'fetchDocuments')
        .mockReturnValue(Promise.resolve([mockFolder]));
    jest.spyOn(engagementMetadataService, 'getEngagementMetadata').mockReturnValue(
        Promise.resolve([engagementMetadata]),
    );
    jest.spyOn(membershipService, 'getTeamMembers').mockReturnValue(Promise.resolve([]));
    jest.spyOn(engagementSettingService, 'getEngagementSettings').mockReturnValue(
        Promise.resolve(mockEngagementSettings),
    );
    const getWidgetsMock = jest.spyOn(widgetService, 'getWidgets').mockReturnValue(Promise.resolve([]));
    const useParamsMock = jest.spyOn(reactRouter, 'useParams');

    beforeEach(() => {
        setupEnv();
        setupMock();
    });

    function setupMock() {
        useParamsMock.mockReturnValue({ engagementId: '1' });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([]));
        mockCreateWidget.mockReturnValue({
            unwrap: jest.fn(() => Promise.resolve(documentWidget)),
        });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([documentWidget]));
    }

    async function openAddWidgetDrawer(container: HTMLElement) {
        await waitFor(() => {
            expect(screen.getByText('Add Widget')).toBeEnabled();
        });

        const addWidgetButton = screen.getByText('Add Widget');
        fireEvent.click(addWidgetButton);

        await waitFor(() => {
            expect(screen.getByText('Select Widget')).toBeVisible();
        });
    }

    async function openAddDocumentWidgetDrawer() {
        const documentOption = screen.getByTestId(`widget-drawer-option/${WidgetType.Document}`);
        expect(documentOption).toBeVisible();
        fireEvent.click(documentOption);
        documentOption.click();

        await waitFor(() => {
            expect(screen.getByText('Test file')).toBeVisible();
            expect(screen.getByText('Test folder')).toBeVisible();
        });
    }

    test('Document widget is created when option is clicked', async () => {
        useParamsMock.mockReturnValue({ engagementId: '1' });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([]));
        mockCreateWidget.mockReturnValue({
            unwrap: jest.fn(() => Promise.resolve(documentWidget)),
        });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([documentWidget]));
        const { container } = render(<RouterProvider router={router} />);

        await openAddWidgetDrawer(container);
        await openAddDocumentWidgetDrawer();

        expect(mockCreateWidget).toHaveBeenNthCalledWith(1, {
            widget_type_id: WidgetType.Document,
            engagement_id: engagement.id,
            title: documentWidget.title,
        });
        expect(getWidgetsMock).toHaveBeenCalled();
        expect(screen.getByText('Create Folder')).toBeVisible();
        expect(screen.getByText('Add Document Link')).toBeVisible();
        expect(screen.getByText('Upload Document')).toBeVisible();
    });

    test('Create folder appears', async () => {
        useParamsMock.mockReturnValue({ engagementId: '1' });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([]));
        mockCreateWidget.mockReturnValue({
            unwrap: jest.fn(() => Promise.resolve(documentWidget)),
        });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([documentWidget]));
        fetchDocumentsMock.mockReturnValueOnce(Promise.resolve([mockFolder]));
        const { container } = render(<RouterProvider router={router} />);

        await openAddWidgetDrawer(container);
        await openAddDocumentWidgetDrawer();

        const createFolderButton = screen.getByText('Create Folder');
        await waitFor(() => {
            expect(createFolderButton).toBeVisible();
        });

        createFolderButton.click();
        await waitFor(() => {
            expect(screen.getByText('Folder name')).toBeVisible();
            expect(screen.getByTestId('create-folder-form/save-button')).toBeVisible();
        });
    });

    test('Create file appears', async () => {
        useParamsMock.mockReturnValue({ engagementId: '1' });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([]));
        mockCreateWidget.mockReturnValue({
            unwrap: jest.fn(() => Promise.resolve(documentWidget)),
        });
        getWidgetsMock.mockReturnValueOnce(Promise.resolve([documentWidget]));
        const { container } = render(<RouterProvider router={router} />);

        await openAddWidgetDrawer(container);
        await openAddDocumentWidgetDrawer();

        const addDocumentButton = screen.getByText('Add Document Link');
        fireEvent.click(addDocumentButton);
        addDocumentButton.click();

        await waitFor(() => {
            expect(screen.getByText('Link')).toBeVisible();
            expect(screen.getByText('Name')).toBeVisible();
            expect(screen.getByText('Folder')).toBeVisible();
        });
    });
});
