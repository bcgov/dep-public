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

    test('Acknowledgement section renders', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText('footer.acknowledgement')).toBeInTheDocument();
    });

    test('More information section renders', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText('footer.moreInfo.title')).toBeInTheDocument();
    });

    test('More information links render', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText('footer.moreInfo.home')).toBeInTheDocument();
        expect(screen.getByText('footer.moreInfo.about')).toBeInTheDocument();
        expect(screen.getByText('footer.moreInfo.disclaimer')).toBeInTheDocument();
        expect(screen.getByText('footer.moreInfo.privacy')).toBeInTheDocument();
        expect(screen.getByText('footer.moreInfo.accessibility')).toBeInTheDocument();
        expect(screen.getByText('footer.moreInfo.copyright')).toBeInTheDocument();
        expect(screen.getByText('footer.moreInfo.contact')).toBeInTheDocument();
    });

    test('Login link renders for unauthenticated users', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText('footer.login')).toBeInTheDocument();
    });

    test('Version information renders for authenticated users', () => {
        (useAppSelector as jest.Mock).mockImplementation((callback) => callback(authenticatedState));

        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText(/footer\.appVersion/i)).toBeInTheDocument();
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

        const button = screen.getByTitle('Expand version info');

        fireEvent.click(button);

        expect(screen.getByTitle('Collapse version info')).toBeInTheDocument();

        fireEvent.click(screen.getByTitle('Collapse version info'));

        expect(screen.queryByText('footer.apiVersion')).not.toBeInTheDocument();
    });

    test('Copyright notice renders', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText(/footer\.copyrightNotice/i)).toBeInTheDocument();
    });

    test('Accessibility statement renders', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText('footer.statement.sentence')).toBeInTheDocument();
    });

    test('Accessibility links render', () => {
        render(
            <Router>
                <Footer />
            </Router>,
        );

        expect(screen.getByText('footer.statement.methods')).toBeInTheDocument();
        expect(screen.getByText('footer.statement.or')).toBeInTheDocument();
        expect(screen.getByText('footer.statement.centre')).toBeInTheDocument();
    });
});
