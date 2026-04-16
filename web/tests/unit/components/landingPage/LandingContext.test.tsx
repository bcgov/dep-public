import React, { useContext } from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LandingContext, LandingContextProvider } from 'components/landing/LandingContext';
import { getEngagements } from 'services/engagementService';
import { getMetadataFilters } from 'services/engagementMetadataService';
import { EngagementDisplayStatus } from 'constants/engagementStatus';
import { PAGE_SIZE } from 'components/landing/constants';

jest.mock('services/engagementService', () => ({
    getEngagements: jest.fn(),
}));

jest.mock('services/engagementMetadataService', () => ({
    getMetadataFilters: jest.fn(),
}));

const mockedGetEngagements = getEngagements as jest.MockedFunction<typeof getEngagements>;
const mockedGetMetadataFilters = getMetadataFilters as jest.MockedFunction<typeof getMetadataFilters>;

const TestConsumer = () => {
    const { setSearchFilters } = useContext(LandingContext);

    return (
        <button
            onClick={() => {
                setSearchFilters((current) => ({ ...current, status: [EngagementDisplayStatus.Open] }));
            }}
        >
            Set Open Filter
        </button>
    );
};

describe('LandingContextProvider', () => {
    beforeEach(() => {
        mockedGetEngagements.mockResolvedValue({ items: [], total: 0 });
        mockedGetMetadataFilters.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('uses default public-facing statuses when no status filter is selected', async () => {
        render(
            <LandingContextProvider>
                <TestConsumer />
            </LandingContextProvider>,
        );

        await waitFor(() => {
            expect(mockedGetEngagements).toHaveBeenCalled();
        });

        expect(mockedGetEngagements).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 1,
                size: PAGE_SIZE,
                sort_key: 'engagement.created_date',
                sort_order: 'desc',
                include_banner_url: true,
                engagement_status: [
                    EngagementDisplayStatus.Open,
                    EngagementDisplayStatus.Upcoming,
                    EngagementDisplayStatus.Closed,
                ],
            }),
        );
    });

    test('uses explicit status filter when one is selected', async () => {
        render(
            <LandingContextProvider>
                <TestConsumer />
            </LandingContextProvider>,
        );

        await waitFor(() => {
            expect(mockedGetEngagements).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Set Open Filter' }));

        await waitFor(() => {
            expect(mockedGetEngagements).toHaveBeenCalledTimes(2);
        });

        expect(mockedGetEngagements).toHaveBeenLastCalledWith(
            expect.objectContaining({
                engagement_status: [EngagementDisplayStatus.Open],
            }),
        );
    });
});
