import React from 'react';
import { render, screen } from '@testing-library/react';
import { LandingDate } from 'components/landing/LandingDynamicDate';
import { createDefaultEngagement, Engagement } from 'models/engagement';
import type { EngagementCarouselPage } from 'components/engagement/EngagementCarousel';

let mockLoaderData: {
    newEngagements: EngagementCarouselPage | Promise<EngagementCarouselPage>;
    closingSoonEngagements: EngagementCarouselPage | Promise<EngagementCarouselPage>;
};

jest.mock('react-router', () => ({
    ...jest.requireActual('react-router'),
    useLoaderData: () => mockLoaderData,
    Await: ({
        resolve,
        children,
    }: {
        resolve: EngagementCarouselPage | Promise<EngagementCarouselPage>;
        children: (value: EngagementCarouselPage) => React.ReactNode;
    }) => {
        if (resolve instanceof Promise) throw resolve;
        return children(resolve);
    },
}));

jest.mock('components/engagement/EngagementCarouselSkeleton', () => ({
    EngagementCarouselSkeleton: () => <div data-testid="carousel-skeleton" />,
}));

jest.mock('hooks', () => ({
    useAppTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('components/engagement/EngagementCarousel', () => ({
    __esModule: true,
    default: ({ engagements, heading }: { engagements: Engagement[]; heading: React.ReactNode }) => (
        <div>
            {heading}
            {engagements.map((engagement) => (
                <div key={engagement.id}>{engagement.name}</div>
            ))}
        </div>
    ),
}));

it('renders the engagements and heading for the selected variant', () => {
    mockLoaderData = {
        newEngagements: { engagements: [{ ...createDefaultEngagement(), id: 1, name: 'My New Engagement' }] },
        closingSoonEngagements: { engagements: [{ ...createDefaultEngagement(), id: 2, name: 'My Old Engagement' }] },
    };
    const { rerender } = render(<LandingDate variant="new" />);
    expect(screen.getByText('landing.dynamicDateSection.new')).toBeInTheDocument();
    expect(screen.getByText('My New Engagement')).toBeInTheDocument();
    expect(screen.queryByText('My Old Engagement')).not.toBeInTheDocument();

    rerender(<LandingDate variant="closingSoon" />);
    expect(screen.getByText('landing.dynamicDateSection.closingSoon')).toBeInTheDocument();
    expect(screen.getByText('My Old Engagement')).toBeInTheDocument();
    expect(screen.queryByText('My New Engagement')).not.toBeInTheDocument();
});

it('hides an empty section', () => {
    mockLoaderData = { newEngagements: { engagements: [] }, closingSoonEngagements: { engagements: [] } };
    const { container } = render(<LandingDate />);
    expect(container).toBeEmptyDOMElement();
});

it('shows the shared carousel skeleton while engagements load', () => {
    mockLoaderData = { newEngagements: new Promise(() => {}), closingSoonEngagements: { engagements: [] } };
    render(<LandingDate />);
    expect(screen.getByTestId('carousel-skeleton')).toBeInTheDocument();
});
