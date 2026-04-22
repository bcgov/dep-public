import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContentState, convertToRaw } from 'draft-js';
import { createDefaultEngagement, Engagement } from '../../../../src/models/engagement';
import { SubmissionStatus } from '../../../../src/constants/engagementStatus';
import { EngagementHero } from '../../../../src/components/engagement/public/view/EngagementHero';
import { EngagementSurveyBlock } from '../../../../src/components/engagement/public/view/EngagementSurveyBlock';

const mockUsePreview = jest.fn();
const mockUseEngagementLoaderData = jest.fn();

jest.mock('react-router', () => {
    const React = jest.requireActual('react');
    return {
        ...jest.requireActual('react-router'),
        Await: ({
            resolve,
            children,
        }: {
            resolve: Promise<unknown>;
            children: (value: unknown) => React.ReactNode;
        }) => {
            const [resolvedValue, setResolvedValue] = React.useState();

            React.useEffect(() => {
                let active = true;
                Promise.resolve(resolve).then((value) => {
                    if (active) {
                        setResolvedValue(value);
                    }
                });

                return () => {
                    active = false;
                };
            }, [resolve]);

            if (resolvedValue === undefined) {
                return null;
            }

            return <>{children(resolvedValue)}</>;
        },
        useParams: () => ({ language: 'en', slug: 'test-engagement' }),
        useLoaderData: () => ({}),
    };
});

jest.mock('components/engagement/preview/PreviewContext', () => ({
    usePreview: () => mockUsePreview(),
}));

jest.mock('components/engagement/preview/PreviewLoaderDataContext', () => ({
    useEngagementLoaderData: () => mockUseEngagementLoaderData(),
}));

jest.mock('../../../../src/components/engagement/preview/PreviewSwitch', () => {
    const resolveValue = <T,>({
        isPreviewMode,
        hasValue,
        value,
        previewFallback,
        fallback,
    }: {
        isPreviewMode?: boolean;
        hasValue: boolean;
        value: T;
        previewFallback?: T;
        fallback?: T;
    }): T | undefined => {
        const previewMode = isPreviewMode ?? mockUsePreview().isPreviewMode;
        if (hasValue) return value;
        return previewMode ? (previewFallback ?? fallback) : fallback;
    };

    return {
        previewValue: resolveValue,
        PreviewSwitch: ({ isPreviewMode, hasValue, value, previewFallback, fallback }: any) => {
            const resolvedValue = resolveValue({ isPreviewMode, hasValue, value, previewFallback, fallback });
            return <>{resolvedValue ?? null}</>;
        },
        PreviewRender: ({ isPreviewMode, hasValue, value, previewFallback, fallback, children }: any) => {
            const resolvedValue = resolveValue({ isPreviewMode, hasValue, value, previewFallback, fallback });
            if (resolvedValue === undefined || resolvedValue === null) return null;
            return <>{children(resolvedValue)}</>;
        },
    };
});

jest.mock('../../../../src/components/engagement/public/view/EngagementPreviewTag', () => ({
    EngagementPreviewTag: () => null,
}));

jest.mock('../../../../src/components/engagement/public/view', () => ({
    EngagementViewSections: {
        HERO: 'hero',
        PROVIDE_FEEDBACK: 'provideFeedback',
        VIEW_RESULTS: 'viewResults',
    },
}));

jest.mock('components/common/Input/Button', () => ({
    Button: ({ children, href, onClick }: { children: React.ReactNode; href?: string; onClick?: () => void }) =>
        href ? <a href={href}>{children}</a> : <button onClick={onClick}>{children}</button>,
}));

jest.mock('components/common/Input/RichTextArea', () => ({
    RichTextArea: ({ editorState }: { editorState: { getCurrentContent: () => { getPlainText: () => string } } }) => (
        <div>{editorState?.getCurrentContent()?.getPlainText?.() ?? ''}</div>
    ),
}));

jest.mock('components/common/Typography', () => ({
    BodyText: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    EyebrowText: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Heading1: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
    Heading2: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span aria-hidden="true" />,
}));

jest.mock('hooks', () => ({
    useAppSelector: jest.fn((selector) => selector({ user: { authentication: { authenticated: false } } })),
    useAppTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../../../src/components/engagement/public/email/EmailModal', () => () => null);

jest.mock('components/engagement/widgets/WidgetSwitch', () => ({
    WidgetSwitch: () => null,
}));

const rawText = (text: string) => JSON.stringify(convertToRaw(ContentState.createFromText(text)));

const createEngagement = (overrides: Partial<Engagement> = {}): Engagement => ({
    ...createDefaultEngagement(),
    id: 99,
    name: 'Water Use Review',
    sponsor_name: 'Environment',
    start_date: '2026-04-01',
    end_date: '2026-05-01',
    submission_status: SubmissionStatus.Upcoming,
    feedback_heading: 'Provide feedback',
    feedback_body: rawText('Feedback section body'),
    status_block: [
        {
            survey_status: 'Open',
            block_text: '',
            button_text: 'Learn more',
            link_type: 'internal',
            internal_link: 'provideFeedback',
        },
        {
            survey_status: 'ViewResults',
            block_text: '',
            button_text: 'Review results',
            link_type: 'internal',
            internal_link: 'viewResults',
        },
        {
            survey_status: 'Closed',
            block_text: rawText('This engagement is closed. Results are pending.'),
            link_type: 'none',
        },
        {
            survey_status: 'Upcoming',
            block_text: rawText('This engagement is not available for feedback yet.'),
            link_type: 'none',
        },
    ],
    surveys: [{ id: 1, name: 'Main Survey', engagement_id: 99 } as any],
    ...overrides,
});

const renderPublicSections = async () => {
    await act(async () => {
        render(
            <>
                <EngagementHero />
                <EngagementSurveyBlock />
            </>,
        );
        await Promise.resolve();
        await Promise.resolve();
    });
};

describe('Public engagement state content', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUsePreview.mockReturnValue({
            isPreviewMode: false,
            previewStateType: null,
        });
    });

    test('renders the upcoming state message only once in the hero on the live page', async () => {
        mockUseEngagementLoaderData.mockReturnValue({
            engagement: Promise.resolve(createEngagement()),
            widgets: Promise.resolve([]),
        });

        await renderPublicSections();

        await waitFor(() => {
            expect(screen.getAllByText('This engagement is not available for feedback yet.')).toHaveLength(1);
        });

        expect(screen.getByText('Feedback section body')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Learn more' })).not.toBeInTheDocument();
    });

    test('renders the closed state message in the hero and keeps the feedback CTA in the survey section', async () => {
        mockUseEngagementLoaderData.mockReturnValue({
            engagement: Promise.resolve(
                createEngagement({
                    submission_status: SubmissionStatus.Closed,
                }),
            ),
            widgets: Promise.resolve([]),
        });

        await renderPublicSections();

        await waitFor(() => {
            expect(screen.getAllByText('This engagement is closed. Results are pending.')).toHaveLength(1);
        });

        expect(screen.getByRole('link', { name: 'buttonText.viewFeedback' })).toBeInTheDocument();
    });

    test('renders the open-state hero CTA in the banner while keeping the feedback action in the survey section', async () => {
        mockUseEngagementLoaderData.mockReturnValue({
            engagement: Promise.resolve(
                createEngagement({
                    submission_status: SubmissionStatus.Open,
                }),
            ),
            widgets: Promise.resolve([]),
        });

        await renderPublicSections();

        expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Provide Feedback Now' })).toBeInTheDocument();
    });

    test('renders preview upcoming state text in the hero without duplicating it in the survey body', async () => {
        mockUsePreview.mockReturnValue({
            isPreviewMode: true,
            previewStateType: 'Upcoming',
        });
        mockUseEngagementLoaderData.mockReturnValue({
            engagement: Promise.resolve(
                createEngagement({
                    submission_status: SubmissionStatus.Open,
                }),
            ),
            widgets: Promise.resolve([]),
        });

        await renderPublicSections();

        await waitFor(() => {
            expect(screen.getAllByText('This engagement is not available for feedback yet.')).toHaveLength(1);
        });

        expect(screen.getByText('Feedback section body')).toBeInTheDocument();
    });
});
