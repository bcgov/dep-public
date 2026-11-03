import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilesTab from '../../../../src/components/engagement/admin/view/FilesTab';
import { mockEngagementFile } from '../factory';

const mockDispatch = jest.fn();
const mockSubmit = jest.fn();
const mockFiles = [mockEngagementFile];
const mockLoaderData = { files: Promise.resolve(mockFiles) };

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useRouteLoaderData: jest.fn(() => mockLoaderData),
    useSubmit: jest.fn(() => mockSubmit),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Await: ({ children, resolve }: any) => children(mockFiles),
}));

jest.mock('hooks', () => ({ useAppDispatch: jest.fn(() => mockDispatch) }));

jest.mock('../../../../src/components/engagement/admin/view/FilesLightbox', () => ({
    FilesLightbox: () => null,
    canBePreviewed: jest.fn(() => true),
}));

jest.mock('services/uploadedFileService', () => ({ downloadObject: jest.fn() }));

describe('FilesTab component tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Renders files heading', () => {
        render(<FilesTab />);

        expect(screen.getByText('Files')).toBeInTheDocument();
    });

    test('Renders uploaded file name', async () => {
        render(<FilesTab />);

        await waitFor(() => {
            expect(screen.getByText(mockEngagementFile.uploaded_file.filename)).toBeInTheDocument();
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
            expect(screen.getByText(mockEngagementFile.uploaded_file.uploader_name)).toBeInTheDocument();
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

    test('Renders select action button', async () => {
        render(<FilesTab />);

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /select action/i,
                }),
            ).toBeInTheDocument();
        });
    });

    test('Renders banner file location', async () => {
        render(<FilesTab />);

        await waitFor(() => {
            expect(screen.getByText('Hero Banner')).toBeInTheDocument();
        });
    });
});
