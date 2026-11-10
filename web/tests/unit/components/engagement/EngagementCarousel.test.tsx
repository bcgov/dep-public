import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EngagementCarousel, { getItemsPerSlide, getTileGap } from 'components/engagement/EngagementCarousel';
import { createDefaultEngagement } from 'models/engagement';
import { useMediaQuery } from '@mui/material';

jest.mock('components/engagement/EngagementTile', () => ({
    __esModule: true,
    default: ({ engagementId, fullWidth }: { engagementId: number; fullWidth?: boolean }) => (
        <div data-testid="tile" data-full-width={String(fullWidth)}>
            Tile {engagementId}
        </div>
    ),
}));

jest.mock('@mui/material', () => ({
    ...jest.requireActual('@mui/material'),
    useMediaQuery: jest.fn(() => false),
}));

const makeEngagements = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ ...createDefaultEngagement(), id: i + 1, name: `Engagement ${i + 1}` }));

const setTrackWidth = (width: number) => {
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
};

const slides = () => screen.getAllByTestId('featured-carousel-slide');
const pips = () => screen.queryAllByRole('button', { name: /(Go to|Current) slide/ });

describe('EngagementCarousel', () => {
    beforeEach(() => {
        (useMediaQuery as jest.Mock).mockReturnValue(false);
        HTMLElement.prototype.scrollTo = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('getItemsPerSlide fits as many tiles as possible, between 1 and 3', () => {
        expect(getItemsPerSlide(0)).toBe(1);
        expect(getItemsPerSlide(343)).toBe(1);
        expect(getItemsPerSlide(701)).toBe(1);
        expect(getItemsPerSlide(702)).toBe(2);
        expect(getItemsPerSlide(1060)).toBe(2);
        expect(getItemsPerSlide(1061)).toBe(3);
        expect(getItemsPerSlide(3000)).toBe(3);
    });

    test('renders the carousel independently with the supplied engagements', () => {
        setTrackWidth(1200);
        const { rerender } = render(<EngagementCarousel engagements={makeEngagements(4)} />);

        expect(screen.getAllByTestId('tile')).toHaveLength(4);
        expect(screen.queryByText('default:landing.featuredEngagements')).not.toBeInTheDocument();
        expect(pips()).toHaveLength(2);

        rerender(<EngagementCarousel engagements={makeEngagements(2)} />);
        expect(screen.getAllByTestId('tile')).toHaveLength(2);
        expect(pips()).toHaveLength(0);
    });

    test('hides controls and pips when everything fits on one slide', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(3)} />);

        expect(screen.getAllByTestId('tile')).toHaveLength(3);
        expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
        expect(pips()).toHaveLength(0);
    });

    test('pads a partial slide with invisible fillers so items stay left-aligned', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(4)} />);

        expect(slides()).toHaveLength(2);
        const fillers = screen.getAllByTestId('featured-carousel-filler');
        expect(fillers).toHaveLength(2);
        fillers.forEach((filler) => expect(filler).toHaveAttribute('aria-hidden', 'true'));
        expect(slides()[1]).toContainElement(fillers[0]);
    });

    test.each([
        [320, true, '100%'],
        [500, true, '100%'],
        [701, true, '100%'],
        [702, true, 'calc(50% - 8px)'],
        [900, true, 'calc(50% - 8px)'],
        [1060, true, 'calc(50% - 8px)'],
        [1061, false, '343px'],
        [1200, false, '343px'],
    ])('sizes tiles at track width %i', (width, fullWidth, expectedWidth) => {
        setTrackWidth(width);
        render(<EngagementCarousel engagements={makeEngagements(3)} />);

        screen.getAllByTestId('tile').forEach((tile) => {
            expect(tile).toHaveAttribute('data-full-width', String(fullWidth));
            expect(tile.parentElement).toHaveStyle({ width: expectedWidth });
        });
    });

    test('two-column slides use matching responsive fillers and a 16px gap between slides', () => {
        setTrackWidth(900);
        render(<EngagementCarousel engagements={makeEngagements(3)} />);

        expect(slides()).toHaveLength(2);
        expect(screen.getByTestId('featured-carousel-filler')).toHaveStyle({ width: 'calc(50% - 8px)' });
        expect(screen.getByTestId('featured-carousel-track')).toHaveStyle({ gap: '16px' });
        expect(getTileGap(900, 2)).toBe(16);

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(HTMLElement.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 916, behavior: 'smooth' });
    });

    test('reserves shadow space without changing slide sizing or navigation', () => {
        jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return this.dataset.testid === 'featured-carousel-track' ? 718 : 702;
        });
        render(<EngagementCarousel engagements={makeEngagements(3)} />);

        const track = screen.getByTestId('featured-carousel-track');
        expect(track).toHaveStyle({
            marginLeft: '-14px',
            marginRight: '-14px',
            paddingLeft: '14px',
            paddingRight: '14px',
            paddingTop: '24px',
            paddingBottom: '16px',
            scrollPaddingInline: '14px',
        });
        expect(slides()).toHaveLength(2);
        expect(slides()[0]).toHaveStyle({ flex: '0 0 100%' });
        expect(screen.getAllByTestId('tile')[0].parentElement).toHaveStyle({ width: 'calc(50% - 8px)' });

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(HTMLElement.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 718, behavior: 'smooth' });
        track.scrollLeft = 718;
        fireEvent.scroll(track);
        fireEvent(track, new Event('scrollend'));
        expect(pips()[1]).toHaveAttribute('aria-current', 'true');
    });

    test('updates tile and filler widths as the track crosses column thresholds', () => {
        const originalResizeObserver = global.ResizeObserver;
        let notifyResize: () => void = () => {};
        class MockResizeObserver implements ResizeObserver {
            constructor(callback: ResizeObserverCallback) {
                notifyResize = () => callback([], this);
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        }
        global.ResizeObserver = MockResizeObserver;
        try {
            let width = 701;
            jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
            render(<EngagementCarousel engagements={makeEngagements(3)} />);

            expect(screen.getAllByTestId('tile')[0].parentElement).toHaveStyle({ width: '100%' });
            width = 900;
            React.act(() => notifyResize());
            expect(screen.getAllByTestId('tile')[0]).toHaveAttribute('data-full-width', 'true');
            expect(screen.getAllByTestId('tile')[0].parentElement).toHaveStyle({ width: 'calc(50% - 8px)' });
            expect(screen.getByTestId('featured-carousel-filler')).toHaveStyle({ width: 'calc(50% - 8px)' });

            width = 1061;
            React.act(() => notifyResize());
            expect(screen.getAllByTestId('tile')[0]).toHaveAttribute('data-full-width', 'false');
            expect(screen.getAllByTestId('tile')[0].parentElement).toHaveStyle({ width: '343px' });
            expect(screen.queryByTestId('featured-carousel-filler')).not.toBeInTheDocument();
        } finally {
            global.ResizeObserver = originalResizeObserver;
        }
    });

    test('buttons move one slide at a time, are disabled at the extents, and pips follow', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(7)} />);

        const prev = screen.getByRole('button', { name: 'Previous' });
        const next = screen.getByRole('button', { name: 'Next' });
        expect(slides()).toHaveLength(3);
        expect(pips()).toHaveLength(3);
        expect(prev).toBeDisabled();
        expect(next).toBeEnabled();
        expect(pips()[0]).toHaveAttribute('aria-current', 'true');

        fireEvent.click(next);
        expect(pips()[1]).toHaveAttribute('aria-current', 'true');
        expect(prev).toBeEnabled();
        expect(HTMLElement.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 1285.5, behavior: 'smooth' });

        fireEvent.click(next);
        expect(pips()[2]).toHaveAttribute('aria-current', 'true');
        expect(next).toBeDisabled();

        fireEvent.click(prev);
        expect(pips()[1]).toHaveAttribute('aria-current', 'true');
        expect(next).toBeEnabled();
    });

    test('clicking a pip jumps to that slide', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(7)} />);

        fireEvent.click(pips()[2]);
        expect(pips()[2]).toHaveAttribute('aria-current', 'true');
        expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    test('pips have 44px touch targets and retain 12px visual dots', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(7)} />);

        const dots = screen.getAllByTestId('featured-carousel-pip-dot');
        expect(dots).toHaveLength(3);
        pips().forEach((pip, index) => {
            expect(pip).toHaveStyle({ width: '44px', height: '44px' });
            expect(pip).toContainElement(dots[index]);
            expect(dots[index]).toHaveStyle({ width: '12px', height: '12px', borderRadius: '50%' });
            expect(dots[index]).toHaveAttribute('aria-hidden', 'true');
        });

        fireEvent.click(pips()[2]);
        expect(pips()[2]).toHaveAttribute('aria-current', 'true');
        expect(HTMLElement.prototype.scrollTo).toHaveBeenLastCalledWith({ left: 2571, behavior: 'smooth' });
    });

    test('scrolling (swiping) updates the current slide', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(7)} />);

        const track = screen.getByTestId('featured-carousel-track');
        track.scrollLeft = 1285.5;
        fireEvent.scroll(track);
        expect(pips()[1]).toHaveAttribute('aria-current', 'true');
    });

    test('keeps the selected controls stable during button and pip navigation', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(10)} />);

        const track = screen.getByTestId('featured-carousel-track');
        const next = screen.getByRole('button', { name: 'Next' });
        const prev = screen.getByRole('button', { name: 'Previous' });

        fireEvent.click(next);
        track.scrollLeft = 100;
        fireEvent.scroll(track);
        expect(pips()[1]).toHaveAttribute('aria-current', 'true');
        expect(prev).toBeEnabled();

        fireEvent.click(pips()[3]);
        track.scrollLeft = 1500;
        fireEvent.scroll(track);
        expect(pips()[3]).toHaveAttribute('aria-current', 'true');
        expect(next).toBeDisabled();

        track.scrollLeft = 3856.5;
        fireEvent.scroll(track);
        fireEvent(track, new Event('scrollend'));
        expect(pips()[3]).toHaveAttribute('aria-current', 'true');

        fireEvent.click(prev);
        track.scrollLeft = 3700;
        fireEvent.scroll(track);
        expect(pips()[2]).toHaveAttribute('aria-current', 'true');
        expect(next).toBeEnabled();
    });

    test('resumes scroll tracking when navigation is interrupted by the user', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(7)} />);

        const track = screen.getByTestId('featured-carousel-track');
        fireEvent.click(pips()[2]);
        track.scrollLeft = 1285.5;
        fireEvent.scroll(track);
        expect(pips()[2]).toHaveAttribute('aria-current', 'true');

        fireEvent.wheel(track);
        fireEvent.scroll(track);
        expect(pips()[1]).toHaveAttribute('aria-current', 'true');
    });

    test('reconciles an interrupted scroll when scrollend fires', () => {
        setTrackWidth(1200);
        render(<EngagementCarousel engagements={makeEngagements(7)} />);

        const track = screen.getByTestId('featured-carousel-track');
        fireEvent.click(pips()[2]);
        track.scrollLeft = 1285.5;
        fireEvent.scroll(track);
        fireEvent(track, new Event('scrollend'));
        expect(pips()[1]).toHaveAttribute('aria-current', 'true');
    });

    test('reconciles after scrolling settles when scrollend is unavailable', () => {
        jest.useFakeTimers();
        const scrollEndOwner = [HTMLElement.prototype, Element.prototype, Node.prototype].find((prototype) =>
            Object.prototype.hasOwnProperty.call(prototype, 'onscrollend'),
        );
        const scrollEndDescriptor = scrollEndOwner && Object.getOwnPropertyDescriptor(scrollEndOwner, 'onscrollend');
        try {
            if (scrollEndOwner) Reflect.deleteProperty(scrollEndOwner, 'onscrollend');
            setTrackWidth(1200);
            render(<EngagementCarousel engagements={makeEngagements(7)} />);

            const track = screen.getByTestId('featured-carousel-track');
            fireEvent.click(pips()[2]);
            track.scrollLeft = 1285.5;
            fireEvent.scroll(track);
            expect(pips()[2]).toHaveAttribute('aria-current', 'true');

            React.act(() => jest.advanceTimersByTime(200));
            expect(pips()[1]).toHaveAttribute('aria-current', 'true');
            track.scrollLeft = 0;
            fireEvent.scroll(track);
            expect(pips()[0]).toHaveAttribute('aria-current', 'true');
        } finally {
            if (scrollEndOwner && scrollEndDescriptor) {
                Object.defineProperty(scrollEndOwner, 'onscrollend', scrollEndDescriptor);
            }
            jest.useRealTimers();
        }
    });

    test('narrower screens show fewer items per slide', () => {
        setTrackWidth(750);
        render(<EngagementCarousel engagements={makeEngagements(5)} />);

        expect(slides()).toHaveLength(3);
        expect(pips()).toHaveLength(3);
    });

    test('hides the buttons on mobile but keeps pips', () => {
        (useMediaQuery as jest.Mock).mockReturnValue(true);
        setTrackWidth(375);
        render(<EngagementCarousel engagements={makeEngagements(3)} />);

        expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
        expect(pips()).toHaveLength(3);
    });
});
