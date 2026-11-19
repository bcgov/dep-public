import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { FilterChip } from 'components/landing/FilterChip';

describe('FilterChip', () => {
    test('renders action chips as pressed-state buttons', () => {
        const { rerender } = render(<FilterChip label="All topics" pressed={false} onClick={() => {}} />);

        const chip = screen.getByRole('button', { name: 'All topics' });
        expect(chip).toHaveAttribute('aria-pressed', 'false');

        rerender(<FilterChip label="All topics" pressed onClick={() => {}} />);
        expect(screen.getByRole('button', { name: 'All topics' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('keeps navigation chips as links', () => {
        render(
            <MemoryRouter>
                <FilterChip label="North Coast" linkTo="/search?region=north-coast" />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: 'North Coast' })).toHaveAttribute('href', '/search?region=north-coast');
    });
});
