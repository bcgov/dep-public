import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLoaderData } from 'react-router';
import { LandingRegions } from 'components/landing/LandingRegions';

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLoaderData: jest.fn(),
}));

it('renders open counts and disables regions with no open engagements', async () => {
    jest.mocked(useLoaderData).mockReturnValue({
        regions: Promise.resolve([
            { name: 'North & Coast', count: 3, searchParam: 'meta-region-12' },
            { name: 'South', count: 0, searchParam: 'meta-region-12' },
        ]),
    });

    render(
        <MemoryRouter>
            <LandingRegions />
        </MemoryRouter>,
    );

    expect(await screen.findByText('North & Coast (3)')).toBeInTheDocument();
    expect(screen.getByText('South (0)').closest('.MuiChip-root')).toHaveClass('Mui-disabled');
    expect(screen.getByText('South (0)').closest('a')).not.toHaveAttribute('href');
    expect(screen.getByText('North & Coast (3)').closest('a')).toHaveAttribute(
        'href',
        '/search?meta-region-12=North+%26+Coast&status=open',
    );
});
