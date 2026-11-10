import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LandingFeatured } from 'components/landing/LandingFeatured';
import { Engagement, createDefaultEngagement } from 'models/engagement';

let mockLoaderData: { featuredEngagements: unknown };

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLoaderData: () => mockLoaderData,
    Await: ({ resolve, children }: { resolve: unknown; children: (value: unknown) => React.ReactNode }) =>
        children(resolve),
}));

jest.mock('components/engagement/EngagementCarousel', () => ({
    __esModule: true,
    default: ({ engagements, heading }: { engagements: Engagement[]; heading: React.ReactNode }) => (
        <div data-testid="carousel">
            {heading}
            {engagements.map((engagement) => (
                <div key={engagement.id}>{engagement.name}</div>
            ))}
        </div>
    ),
}));

describe('LandingFeatured', () => {
    test('renders nothing when there are no featured engagements', () => {
        mockLoaderData = { featuredEngagements: [] };
        const { container } = render(<LandingFeatured />);
        expect(container).toBeEmptyDOMElement();
    });

    test('passes featured engagements and the heading to the carousel', () => {
        mockLoaderData = {
            featuredEngagements: [{ ...createDefaultEngagement(), id: 1, name: 'Featured engagement' }],
        };
        render(<LandingFeatured />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        // Translates to "Featured engagements" when using the default i18n setup.
        expect(screen.getByRole('heading', { name: 'default:landing.featuredEngagements' })).toBeInTheDocument();
        expect(screen.getByText('Featured engagement')).toBeInTheDocument();
    });
});
