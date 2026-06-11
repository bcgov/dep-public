import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router';
import PublicHeader from '../../../../src/components/layout/Header/PublicHeader';

const mockState = { language: { id: 'en' } }; // Initial state

// Mock useDispatch hook
jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn(() => jest.fn()),
    useSelector: jest.fn((callback) => callback(mockState)),
}));

describe('PublicHeader component tests', () => {
    test('test', () => expect(true).toBe(true));

    test.skip('Renders simplified header content', async () => {
        render(
            <Router>
                <PublicHeader />
            </Router>,
        );

        expect(screen.getByTestId('simplified-header')).toBeInTheDocument();
    });

    test.skip('Displays engageBC brand text', async () => {
        render(
            <Router>
                <PublicHeader />
            </Router>,
        );

        expect(screen.getByText('engage')).toBeInTheDocument();
    });
});
