import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router';
import Footer from 'components/layout/Footer';
import { useAppSelector } from 'hooks';

const mockState = {
    language: { id: 'en' },
    user: {
        authentication: {
            authenticated: false,
        },
    },
};

const authenticatedState = {
    language: { id: 'en' },
    user: {
        authentication: {
            authenticated: true,
        },
    },
};

jest.mock('hooks', () => ({
    ...jest.requireActual('hooks'),
    useAppSelector: jest.fn((callback) => callback(mockState)),
    useAppDispatch: jest.fn(() => jest.fn()),
    useAppTranslation: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useRouteLoaderData: jest.fn(),
    Await: ({ children }: any) =>
        children?.({
            version: '1.0.0',
            branch: 'main',
            commit_url: 'https://github.com/test',
            build_date: '2024-01-01',
        }),
}));

describe('Footer component tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useAppSelector as jest.Mock).mockImplementation((callback) => callback(mockState));
    });

    test('Footer renders', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('Feedback button renders', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByTestId('feedback-button')).toBeVisible();
    });

    test.each([['footer.acknowledgement'], ['footer.moreInfo.title'], ['footer.login'], ['footer.statement.sentence']])(
        'renders %s',
        (text) => {
            render(
                <Router>
                    <Footer />
                </Router>,
            );

            expect(screen.getByText(text)).toBeInTheDocument();
        },
    );

    test.each([
        ['footer.moreInfo.home'],
        ['footer.moreInfo.about'],
        ['footer.moreInfo.disclaimer'],
        ['footer.moreInfo.privacy'],
        ['footer.moreInfo.accessibility'],
        ['footer.moreInfo.copyright'],
        ['footer.moreInfo.contact'],
    ])('renders more info link %s', (text) => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText(text)).toBeInTheDocument();
    });

    test.each([['footer.statement.methods'], ['footer.statement.or'], ['footer.statement.centre']])(
        'renders accessibility text %s',
        (text) => {
            render(
                <Router>
                    <Footer />
                </Router>,
            );

            expect(screen.getByText(text)).toBeInTheDocument();
        },
    );

    test('Version information renders for authenticated users', () => {
        (useAppSelector as jest.Mock).mockImplementation((callback) => callback(authenticatedState));

        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(
            screen.getByRole('button', {
                name: 'Expand version info',
            }),
        ).toBeInTheDocument();
    });

    test('Login link does not render for authenticated users', () => {
        (useAppSelector as jest.Mock).mockImplementation((callback) => callback(authenticatedState));

        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.queryByText('footer.login')).not.toBeInTheDocument();
    });

    test('Version information can be expanded', () => {
        (useAppSelector as jest.Mock).mockImplementation((callback) => callback(authenticatedState));

        render(
            <Router>
                <Footer />
            </Router>,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand version info',
            }),
        );

        expect(
            screen.getByRole('button', {
                name: 'Collapse version info',
            }),
        ).toBeInTheDocument();
    });

    test('Version information can be collapsed', () => {
        (useAppSelector as jest.Mock).mockImplementation((callback) => callback(authenticatedState));

        render(
            <Router>
                <Footer />
            </Router>,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Expand version info',
            }),
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Collapse version info',
            }),
        );

        expect(
            screen.getByRole('button', {
                name: 'Expand version info',
            }),
        ).toBeInTheDocument();
    });

    test('Copyright notice renders', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText(/footer\.copyrightNotice/i)).toBeInTheDocument();
    });

    test('Feedback modal opens when feedback button is clicked', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        fireEvent.click(screen.getByTestId('feedback-button'));
        expect(screen.getByText('feedback.feedbackModal.label.0')).toBeInTheDocument();
        expect(screen.getByText('feedback.feedbackModal.label.1')).toBeInTheDocument();
    });

    test('Submit button is disabled when no feedback is provided', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        fireEvent.click(screen.getByTestId('feedback-button'));
        expect(screen.getByTestId('submit-button')).toBeDisabled();
    });

    test('Selecting issue displays comment field', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        fireEvent.click(screen.getByTestId('feedback-button'));
        fireEvent.click(screen.getByTestId('comment-type-issue-button'));
        expect(screen.getByTestId('comment-input')).toBeInTheDocument();
    });

    test('Comment field updates when text is entered', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        fireEvent.click(screen.getByTestId('feedback-button'));
        fireEvent.click(screen.getByTestId('comment-type-issue-button'));
        const input = screen.getByRole('textbox');

        fireEvent.change(input, {
            target: {
                value: 'Test feedback',
            },
        });

        expect(input).toHaveValue('Test feedback');
    });
});
