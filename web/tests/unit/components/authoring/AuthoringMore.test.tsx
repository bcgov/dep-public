import React, { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthoringMore from '../../../../src/components/engagement/admin/create/authoring/AuthoringMore';
import { EngagementStatus, SubmissionStatus } from '../../../../src/constants/engagementStatus';
import { createDefaultEngagement, Engagement } from '../../../../src/models/engagement';
import { SuggestedEngagement } from '../../../../src/models/suggestedEngagement';
import { Page } from '../../../../src/services/type';

const mockUseLoaderData = jest.fn();
const mockUseOutletContext = jest.fn();
const mockSetValue = jest.fn();
const mockGetValues = jest.fn(() => ({}));
const mockReset = jest.fn();
const mockSetDefaultValues = jest.fn();
const mockFieldOnChange = jest.fn();

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLoaderData: () => mockUseLoaderData(),
    useOutletContext: () => mockUseOutletContext(),
}));

jest.mock('react-hook-form', () => ({
    ...jest.requireActual('react-hook-form'),
    Controller: ({ name, render }: { name: string; render: (props: unknown) => ReactNode }) =>
        render({
            field: {
                name,
                value: -1,
                onChange: mockFieldOnChange,
            },
        }),
    useFormContext: () => ({
        setValue: mockSetValue,
        getValues: mockGetValues,
        reset: mockReset,
        control: {},
        formState: {
            errors: {},
            isDirty: false,
            isSubmitting: false,
        },
    }),
}));

jest.mock('components/common/Input', () => ({
    FormField: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    TextField: ({ id, value, onChange }: { id: string; value?: string; onChange?: (value: string) => void }) => (
        <input id={id} value={value ?? ''} onChange={(event) => onChange?.(event.target.value)} />
    ),
    Select: ({
        id,
        options,
        value,
        onChange,
    }: {
        id: string;
        options: { label: string; value: number }[];
        value: number;
        onChange: (event: { target: { value: string } }) => void;
    }) => (
        <select
            aria-label={id}
            data-testid={id}
            value={value}
            onChange={(event) => onChange({ target: { value: event.target.value } })}
        >
            {options.map((option) => (
                <option key={`${id}-${option.value}`} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    ),
}));

jest.mock('../../../../src/components/engagement/admin/create/authoring/AuthoringFormLayout', () => ({
    AuthoringFormContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    AuthoringFormSection: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

jest.mock('components/common/Navigation/UnsavedWorkConfirmation', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../../../../src/components/engagement/admin/create/authoring/AuthoringContext', () => ({
    defaultValuesObject: {},
}));

const buildEngagement = (
    overrides: Partial<Engagement> & Pick<Engagement, 'id' | 'name' | 'status_id' | 'tenant_id'>,
): Engagement => ({
    ...createDefaultEngagement(),
    ...overrides,
});

describe('AuthoringMore', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const currentEngagement = buildEngagement({
            id: 42,
            name: 'Current Engagement',
            status_id: EngagementStatus.Published,
            submission_status: SubmissionStatus.Open,
            tenant_id: 7,
        });

        const engagementList: Page<Engagement> = {
            items: [
                currentEngagement,
                buildEngagement({
                    id: 1,
                    name: 'Upcoming Engagement',
                    status_id: EngagementStatus.Published,
                    submission_status: SubmissionStatus.Upcoming,
                    tenant_id: 7,
                }),
                buildEngagement({
                    id: 2,
                    name: 'Open Engagement',
                    status_id: EngagementStatus.Published,
                    submission_status: SubmissionStatus.Open,
                    tenant_id: 7,
                }),
                buildEngagement({
                    id: 3,
                    name: 'Closed Engagement',
                    status_id: EngagementStatus.Closed,
                    submission_status: SubmissionStatus.Closed,
                    tenant_id: 7,
                }),
                buildEngagement({
                    id: 4,
                    name: 'Draft Engagement',
                    status_id: EngagementStatus.Draft,
                    submission_status: SubmissionStatus.Upcoming,
                    tenant_id: 7,
                }),
                buildEngagement({
                    id: 5,
                    name: 'Scheduled Engagement',
                    status_id: EngagementStatus.Scheduled,
                    submission_status: SubmissionStatus.Upcoming,
                    tenant_id: 7,
                }),
                buildEngagement({
                    id: 6,
                    name: 'Unpublished Engagement',
                    status_id: EngagementStatus.Unpublished,
                    submission_status: SubmissionStatus.Unpublished,
                    tenant_id: 7,
                }),
            ],
            total: 7,
        };

        const suggestions: SuggestedEngagement[] = [];

        mockUseOutletContext.mockReturnValue({
            setDefaultValues: mockSetDefaultValues,
            fetcher: { data: null },
            pageName: 'more',
            engagement: currentEngagement,
        });

        mockUseLoaderData.mockReturnValue({
            engagement: Promise.resolve(currentEngagement),
            engagementList: Promise.resolve(engagementList),
            suggestions: Promise.resolve(suggestions),
        });
    });

    test('shows upcoming, open, and closed engagements while excluding draft, scheduled, and unpublished', async () => {
        render(<AuthoringMore />);

        await waitFor(() => {
            expect(screen.getAllByText('Upcoming Engagement').length).toBeGreaterThan(0);
        });

        expect(screen.getAllByText('Upcoming Engagement').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Open Engagement').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Closed Engagement').length).toBeGreaterThan(0);

        expect(screen.queryAllByText('Draft Engagement')).toHaveLength(0);
        expect(screen.queryAllByText('Scheduled Engagement')).toHaveLength(0);
        expect(screen.queryAllByText('Unpublished Engagement')).toHaveLength(0);
        expect(screen.queryAllByText('Current Engagement')).toHaveLength(0);
    });
});
