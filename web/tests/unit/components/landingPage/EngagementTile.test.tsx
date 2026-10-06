import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router';
import EngagementTile from 'components/landing/EngagementSearch/EngagementTile';
import { createDefaultEngagement, Engagement } from 'models/engagement';
import { SubmissionStatus } from 'constants/engagementStatus';
import { getEngagement } from 'services/engagementService';

jest.mock('hooks', () => ({
    useAppTranslation: () => ({
        t: (key: string) => key,
    }),
}));

jest.mock('services/engagementService', () => ({
    getEngagement: jest.fn(),
}));

const mockGetEngagement = getEngagement as jest.Mock;

const baseEngagement: Engagement = {
    ...createDefaultEngagement(),
    id: 1,
    slug: 'test-engagement',
    name: 'Test Engagement',
    banner_url: '',
    start_date: '2026-01-17 12:00:00',
    end_date: '2026-09-30 12:00:00',
    submission_status: SubmissionStatus.Upcoming,
};

const renderTile = (engagement: Engagement) =>
    render(
        <MemoryRouter>
            <EngagementTile engagementId={engagement.id} passedEngagement={engagement} />
        </MemoryRouter>,
    );

describe('EngagementTile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders a loading skeleton before the engagement is loaded, when not passed in', async () => {
        mockGetEngagement.mockReturnValue(new Promise(() => undefined));
        render(
            <MemoryRouter>
                <EngagementTile engagementId={1} />
            </MemoryRouter>,
        );
        expect(screen.queryByText(baseEngagement.name)).not.toBeInTheDocument();
    });

    it('fetches the engagement by id when no engagement is passed in', async () => {
        mockGetEngagement.mockResolvedValue(baseEngagement);
        render(
            <MemoryRouter>
                <EngagementTile engagementId={1} />
            </MemoryRouter>,
        );
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        expect(mockGetEngagement).toHaveBeenCalledWith(1);
    });

    it('renders an error message if the engagement fails to load', async () => {
        mockGetEngagement.mockRejectedValue(new Error('failed'));
        render(
            <MemoryRouter>
                <EngagementTile engagementId={1} />
            </MemoryRouter>,
        );
        await waitFor(() => expect(screen.getByText('landingPage.tile.error')).toBeInTheDocument());
    });

    it('shows the "upcoming" call to action and opening start date', async () => {
        renderTile({ ...baseEngagement, submission_status: SubmissionStatus.Upcoming });
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        expect(screen.getByText('landingPage.tile.cta.upcoming')).toBeInTheDocument();
        const time = screen.getByText('Jan 17, 2026');
        expect(time.closest('time')).toHaveAttribute('dateTime', '2026-01-17');
    });

    it('shows the "open" call to action and closing end date', async () => {
        renderTile({ ...baseEngagement, submission_status: SubmissionStatus.Open });
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        expect(screen.getByText('landingPage.tile.cta.open')).toBeInTheDocument();
        const time = screen.getByText('Sep 30, 2026');
        expect(time.closest('time')).toHaveAttribute('dateTime', '2026-09-30');
    });

    it('shows the "closed" call to action and closed end date', async () => {
        renderTile({ ...baseEngagement, submission_status: SubmissionStatus.Closed });
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        expect(screen.getByText('landingPage.tile.cta.closed')).toBeInTheDocument();
        expect(screen.getByText('Sep 30, 2026')).toBeInTheDocument();
    });

    it('shows the "closed with results" call to action and closed end date', async () => {
        renderTile({ ...baseEngagement, submission_status: SubmissionStatus.ClosedWithResults });
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        expect(screen.getByText('landingPage.tile.cta.closedWithResults')).toBeInTheDocument();
        expect(screen.getByText('Sep 30, 2026')).toBeInTheDocument();
    });

    it('renders a chip for each metadata entry', async () => {
        renderTile({
            ...baseEngagement,
            metadata: [
                { id: 1, value: 'Health', taxon_id: 1 },
                { id: 2, value: 'Transportation', taxon_id: 2 },
            ],
        });
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        expect(screen.getByText('Health')).toBeInTheDocument();
        expect(screen.getByText('Transportation')).toBeInTheDocument();
    });

    it('renders no metadata chips when the engagement has no metadata', async () => {
        renderTile({ ...baseEngagement, metadata: [] });
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: /./ })).not.toBeInTheDocument();
    });

    it('links to the public engagement page for the loaded engagement', async () => {
        renderTile(baseEngagement);
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        const link = screen.getByRole('link');
        expect(link.getAttribute('href')).toContain(baseEngagement.slug);
    });

    it('marks the status chip as hovered while the card is hovered, and unhovered otherwise', async () => {
        renderTile(baseEngagement);
        await waitFor(() => expect(screen.getByText('Test Engagement')).toBeInTheDocument());
        const link = screen.getByRole('link');
        const chip = () => screen.getByText('Upcoming').closest('.MuiChip-root');

        expect(chip()).toHaveClass('unhovered');

        fireEvent.mouseEnter(link);
        expect(chip()).toHaveClass('hovered');

        fireEvent.mouseLeave(link);
        expect(chip()).toHaveClass('unhovered');
    });
});
