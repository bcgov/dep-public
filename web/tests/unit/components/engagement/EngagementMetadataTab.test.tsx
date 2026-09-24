import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetadataTab from '../../../../src/components/engagement/admin/view/MetadataTab';
import { engagementMetadata, engagementMetadataTaxon } from '../factory';

const mockDispatch = jest.fn();

const mockLoaderData = {
    engagement: {
        id: 1,
    },
    metadata: Promise.resolve([engagementMetadata]),
    taxa: Promise.resolve([engagementMetadataTaxon]),
};

const mockFetcher = {
    data: '',
    submit: jest.fn(),
};

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    Form: ({ children, ...props }: { children: React.ReactNode }) => <form {...props}>{children}</form>,
    useFetcher: jest.fn(() => mockFetcher),
    useParams: jest.fn(() => ({
        engagementId: '1',
    })),
    useRouteLoaderData: jest.fn(() => mockLoaderData),
}));

jest.mock('@mui/x-date-pickers', () => ({
    DatePicker: () => <div>DatePicker</div>,
    TimePicker: () => <div>TimePicker</div>,
    DateTimePicker: () => <div>DateTimePicker</div>,
}));

jest.mock('hooks', () => ({
    useAppDispatch: jest.fn(() => mockDispatch),
}));

describe('MetadataTab component tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetcher.data = '';

        mockLoaderData.taxa = Promise.resolve([engagementMetadataTaxon]);
        mockLoaderData.metadata = Promise.resolve([engagementMetadata]);
    });

    test('Renders metadata heading and description', async () => {
        render(<MetadataTab />);

        expect(screen.getByText('Metadata')).toBeInTheDocument();

        expect(
            screen.getByText(/Adding metadata to your engagement gives users new ways to filter/i),
        ).toBeInTheDocument();
    });

    test('Renders taxon name from loader data', async () => {
        render(<MetadataTab />);
        await waitFor(() => {
            expect(screen.getByLabelText('Select a value for the test.')).toBeInTheDocument();
        });
    });

    test('Renders update metadata button', async () => {
        render(<MetadataTab />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Update Metadata' })).toBeInTheDocument();
        });
    });

    test('Renders select data type description', async () => {
        render(<MetadataTab />);

        await waitFor(() => {
            expect(screen.getByText(/multiple selection/i)).toBeInTheDocument();
        });
    });

    test('Renders select field options', async () => {
        render(<MetadataTab />);

        await waitFor(() => {
            expect(screen.getByLabelText('Select a value for the test.')).toBeInTheDocument();
        });

        expect(screen.getByLabelText('Select a value for the test.')).toBeInTheDocument();
    });
});

import * as notificationSlice from 'services/notificationService/notificationSlice';

describe('Metadata update notifications', () => {
    test('Shows success notification when fetcher returns success', async () => {
        mockFetcher.data = 'success';

        const notificationSpy = jest.spyOn(notificationSlice, 'openNotification').mockImplementation(jest.fn());

        render(<MetadataTab />);

        await waitFor(() => {
            expect(notificationSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'success',
                }),
            );
        });
    });

    test('Shows failure notification when fetcher returns failure', async () => {
        mockFetcher.data = 'failure';

        const notificationSpy = jest.spyOn(notificationSlice, 'openNotification').mockImplementation(jest.fn());

        render(<MetadataTab />);

        await waitFor(() => {
            expect(notificationSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: 'error',
                }),
            );
        });
    });
});

test('Renders boolean metadata as a switch', async () => {
    mockLoaderData.taxa = Promise.resolve([
        {
            ...engagementMetadataTaxon,
            data_type: 'boolean',
            preset_values: [],
        },
    ]);

    render(<MetadataTab />);

    await waitFor(() => {
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
});

test('Renders long text metadata field', async () => {
    mockLoaderData.taxa = Promise.resolve([
        {
            ...engagementMetadataTaxon,
            data_type: 'long_text',
            preset_values: [],
        },
    ]);

    render(<MetadataTab />);

    await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
});

test('Does not render custom option button when freeform is disabled', async () => {
    mockLoaderData.taxa = Promise.resolve([
        {
            ...engagementMetadataTaxon,
            freeform: false,
        },
    ]);

    render(<MetadataTab />);

    await waitFor(() => {
        expect(screen.getByLabelText('Select a value for the test.')).toBeInTheDocument();
    });

    expect(
        screen.queryByRole('button', {
            name: /\+ Add a custom option/i,
        }),
    ).not.toBeInTheDocument();
});

test('Update metadata button is disabled by default', async () => {
    render(<MetadataTab />);

    const button = await screen.findByRole('button', {
        name: 'Update Metadata',
    });

    expect(button).toBeDisabled();
});

test('Renders multiple selection description', async () => {
    render(<MetadataTab />);

    await waitFor(() => {
        expect(screen.getByText(/multiple selection/i)).toBeInTheDocument();
    });
});
