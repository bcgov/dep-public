import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilesTab from '../../../../src/components/engagement/admin/view/FilesTab';
import { mockEngagementFile, mockEngagementPdfFile } from '../factory';
import userEvent from '@testing-library/user-event';

const mockDispatch = jest.fn();
const mockSubmit = jest.fn();
const mockFiles = [mockEngagementPdfFile, mockEngagementFile];
const mockLoaderData = { files: Promise.resolve(mockFiles) };

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useRouteLoaderData: jest.fn(() => mockLoaderData),
    useSubmit: jest.fn(() => mockSubmit),
    useParams: jest.fn(() => ({ engagementId: '1' })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Await: ({ children }: any) => children(mockFiles),
}));

jest.mock('hooks', () => ({ useAppDispatch: jest.fn(() => mockDispatch) }));

jest.mock('../../../../src/components/engagement/admin/view/FilesLightbox', () => ({
    FilesLightbox: () => null,
    canBePreviewed: jest.fn(() => true),
}));

jest.mock('services/uploadedFileService', () => ({ downloadObject: jest.fn() }));

jest.mock('services/notificationModalService/notificationModalSlice', () => ({
    openNotificationModal: jest.fn((payload) => payload),
}));

jest.mock('services/notificationService/notificationSlice', () => ({
    openNotification: jest.fn((payload) => payload),
}));

jest.mock('components/common/FileUpload', () => ({
    __esModule: true,
    default: ({ handleAddFile }: { handleAddFile: (files: File[]) => void }) => (
        <button
            onClick={() =>
                handleAddFile([
                    new File(['pdf-content'], 'replacement.pdf', {
                        type: 'application/pdf',
                    }),
                ])
            }
        >
            Mock Upload File
        </button>
    ),
}));

describe('FilesTab component tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Renders files heading', () => {
        render(<FilesTab />);

        expect(screen.getByText('Files')).toBeInTheDocument();
    });

    test('Renders uploaded file names', async () => {
        render(<FilesTab />);

        await waitFor(() => {
            expect(screen.getByText(mockEngagementFile.uploaded_file.filename)).toBeInTheDocument();
            expect(screen.getByText(mockEngagementPdfFile.uploaded_file.filename)).toBeInTheDocument();
        });
    });

    test('Renders uploaded by column heading', async () => {
        render(<FilesTab />);

        await waitFor(() => {
            expect(screen.getByText('Uploaded by')).toBeInTheDocument();
        });
    });

    test('Renders uploader name from file data', async () => {
        render(<FilesTab />);

        await waitFor(() => {
            expect(screen.getAllByText(mockEngagementFile.uploaded_file.uploader_name)).toHaveLength(2);
        });
    });

    test('Renders file table headers', async () => {
        render(<FilesTab />);

        await waitFor(() => {
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Size')).toBeInTheDocument();
            expect(screen.getByText('Location')).toBeInTheDocument();
            expect(screen.getByText('File Type')).toBeInTheDocument();
            expect(screen.getByText('Uploaded by')).toBeInTheDocument();
        });
    });

    test('Renders select action buttons', async () => {
        render(<FilesTab />);
        await waitFor(() => {
            expect(
                screen.getAllByRole('button', {
                    name: /select action/i,
                }),
            ).toHaveLength(2);
        });
    });

    test('Renders banner file location', async () => {
        render(<FilesTab />);
        await waitFor(() => {
            expect(screen.getByText('Hero Banner')).toBeInTheDocument();
        });
    });

    const openPdfActionMenu = async () => {
        const user = userEvent.setup();
        render(<FilesTab />);
        const actionButtons = await screen.findAllByRole('button', {
            name: /select action/i,
        });
        // PDF file is first in mockFiles
        await user.click(actionButtons[0]);
        return user;
    };

    test('Shows Replace PDF action for PDF files', async () => {
        await openPdfActionMenu();
        expect(await screen.findByText('Replace PDF')).toBeInTheDocument();
    });

    test('Opens replace PDF dialog when Replace PDF is selected', async () => {
        const user = await openPdfActionMenu();
        await user.click(await screen.findByText('Replace PDF'));
        expect(
            await screen.findByText(`Replacing PDF for ${mockEngagementPdfFile.uploaded_file.filename}`),
        ).toBeInTheDocument();
    });

    test('Replace button starts disabled before a file is selected', async () => {
        const user = await openPdfActionMenu();
        await user.click(await screen.findByText('Replace PDF'));
        expect(
            screen.getByRole('button', {
                name: 'Replace',
            }),
        ).toBeDisabled();
    });

    test('Selecting a replacement file enables Replace button', async () => {
        const user = await openPdfActionMenu();
        await user.click(await screen.findByText('Replace PDF'));
        await user.click(await screen.findByText('Mock Upload File'));
        expect(
            screen.getByRole('button', {
                name: 'Replace',
            }),
        ).toBeEnabled();
    });

    test('Replace confirmation dispatches modal with Replace action', async () => {
        const user = await openPdfActionMenu();
        await user.click(await screen.findByText('Replace PDF'));
        await user.click(await screen.findByText('Mock Upload File'));
        await user.click(
            screen.getByRole('button', {
                name: 'Replace',
            }),
        );

        expect(mockDispatch).toHaveBeenCalled();
        const dispatchedModal = mockDispatch.mock.calls[mockDispatch.mock.calls.length - 1][0];
        expect(dispatchedModal.data.confirmButtonText).toBe('Replace');
        expect(dispatchedModal.data.header).toContain('replace the existing PDF');
    });

    test('Replacement confirmation submits PUT request', async () => {
        const user = await openPdfActionMenu();
        await user.click(await screen.findByText('Replace PDF'));
        await user.click(await screen.findByText('Mock Upload File'));
        await user.click(
            screen.getByRole('button', {
                name: 'Replace',
            }),
        );

        const dispatchedModal = mockDispatch.mock.calls[mockDispatch.mock.calls.length - 1][0];
        dispatchedModal.data.handleConfirm();
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        expect(mockSubmit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({
                method: 'put',
                navigate: false,
                encType: 'multipart/form-data',
            }),
        );
    });
});
