import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SingleLineInputModal from '../../../../src/components/common/Modals/SingleLineInputModal';

describe('SingleLineInputModal component tests', () => {
    const handleConfirm = jest.fn();
    const handleClose = jest.fn();

    const defaultProps = {
        header: 'Test Header',
        subHeader: 'Test Sub Header',
        subText: <p>Test description</p>,
        handleConfirm,
        handleClose,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Renders header, subheader and subtext', () => {
        render(<SingleLineInputModal {...defaultProps} />);

        expect(screen.getByText('Test Header')).toBeInTheDocument();
        expect(screen.getByText('Test Sub Header')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    test('Renders default button text', () => {
        render(<SingleLineInputModal {...defaultProps} />);

        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    test('Renders custom button text', () => {
        render(<SingleLineInputModal {...defaultProps} confirmButtonText="Create Value" cancelButtonText="Go Back" />);

        expect(screen.getByRole('button', { name: 'Create Value' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });

    test('Renders custom placeholder text', () => {
        render(<SingleLineInputModal {...defaultProps} placeholder="Enter custom option" />);

        expect(screen.getByPlaceholderText('Enter custom option')).toBeInTheDocument();
    });

    test('Renders default placeholder text', () => {
        render(<SingleLineInputModal {...defaultProps} />);

        expect(screen.getByPlaceholderText('Enter a value here')).toBeInTheDocument();
    });

    test('Calls handleClose when cancel button is clicked', () => {
        render(<SingleLineInputModal {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('Calls handleConfirm when confirm button is clicked', () => {
        render(<SingleLineInputModal {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    test('Displays validation error text', () => {
        render(<SingleLineInputModal {...defaultProps} validation error="Value is invalid" />);

        expect(screen.getByText('Value is invalid')).toBeInTheDocument();
    });

    test('Does not display validation error text when validation is disabled', () => {
        render(<SingleLineInputModal {...defaultProps} error="Value is invalid" />);

        expect(screen.queryByText('Value is invalid')).not.toBeInTheDocument();
    });

    test('Adds aria label from header and subheader', () => {
        render(<SingleLineInputModal {...defaultProps} />);

        expect(screen.getByLabelText('Test Header Test Sub Header')).toBeInTheDocument();
    });
});
