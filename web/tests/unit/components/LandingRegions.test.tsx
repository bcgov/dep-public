import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLoaderData } from 'react-router';
import { LandingRegions } from 'components/landing/LandingRegions';

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLoaderData: jest.fn(),
}));

jest.mock('hooks', () => ({
    useAppTranslation: () => ({ t: (key: string) => key }),
}));

it('renders open counts and disables regions with no open engagements', async () => {
    jest.mocked(useLoaderData).mockReturnValue({
        regions: Promise.resolve({
            hasOpenEngagements: true,
            items: [
                { name: 'North & Coast', count: 3, searchParam: 'meta-region-12' },
                { name: 'South', count: 0, searchParam: 'meta-region-12' },
            ],
        }),
    });

    render(
        <MemoryRouter>
            <LandingRegions />
        </MemoryRouter>,
    );

    expect(await screen.findByText('North & Coast (3)')).toBeInTheDocument();
    expect(screen.getByText('landing.regionSection.titleOpen')).toBeInTheDocument();
    expect(screen.getByText('South (0)').closest('.MuiChip-root')).toHaveClass('Mui-disabled');
    expect(screen.getByText('South (0)').closest('a')).not.toHaveAttribute('href');
    expect(screen.getByText('North & Coast (3)').closest('a')).toHaveAttribute(
        'href',
        '/search?meta-region-12=North+%26+Coast&status=open',
    );
});

it('shows all-status counts and links without an open status filter when none are open', async () => {
    jest.mocked(useLoaderData).mockReturnValue({
        regions: Promise.resolve({
            hasOpenEngagements: false,
            items: [{ name: 'North & Coast', count: 3, searchParam: 'meta-region-12' }],
        }),
    });

    render(
        <MemoryRouter>
            <LandingRegions />
        </MemoryRouter>,
    );

    const region = await screen.findByText('North & Coast (3)');
    expect(screen.getByText('landing.regionSection.title')).toBeInTheDocument();
    expect(region.closest('a')).toHaveAttribute('href', '/search?meta-region-12=North+%26+Coast');
    expect(region.closest('.MuiChip-root')).not.toHaveClass('Mui-disabled');
});
