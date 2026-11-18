import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingCategories from 'components/landing/LandingCategories';

type TestEngagement = { id: number; name: string };
type TestPage = { items: TestEngagement[]; total: number };
type TestFetcherData = { engagements?: TestPage | Promise<TestPage> };

let mockLoaderData: { categories: unknown };
let mockFetcher: { data?: TestFetcherData; load: jest.Mock };
let mockFetcherKeys: Array<string | number> = [];
let mockSuspendAwait = false;

jest.mock('react-router', () => {
    const React = jest.requireActual('react');
    return {
        ...jest.requireActual('react-router'),
        useLoaderData: () => mockLoaderData,
        useFetcher: (options: { key: string | number }) => {
            mockFetcherKeys.push(options.key);
            return mockFetcher;
        },
        Await: ({ resolve, children }: { resolve: unknown; children: (value: unknown) => React.ReactNode }) => {
            const isPromise = resolve && typeof (resolve as Promise<unknown>).then === 'function';
            const value = isPromise
                ? mockSuspendAwait
                    ? React.use(resolve as Promise<unknown>)
                    : { items: [], total: 0 }
                : resolve;
            return children(value);
        },
    };
});

jest.mock('components/engagement/TileSkeleton', () => ({
    TileSkeleton: () => <div data-testid="tile-skeleton" />,
}));

jest.mock('components/engagement/EngagementTile', () => ({
    __esModule: true,
    default: ({ passedEngagement }: { passedEngagement: TestEngagement }) => (
        <div data-testid="engagement-tile">{passedEngagement.name}</div>
    ),
}));

jest.mock('components/common/Navigation', () => ({
    Link: ({ children, to, ...props }: { children: React.ReactNode; to?: string }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

jest.mock('components/common/Input/Button', () => ({
    SolidIconButton: ({
        children,
        sx,
        ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { sx?: { display?: string } }) => (
        <button {...props} style={{ display: sx?.display }}>
            {children}
        </button>
    ),
}));

jest.mock('hooks', () => ({
    useAppTranslation: () => ({
        t: (key: string) => (key === 'landing.categorySection.viewAll' ? 'Browse all {0} engagements' : key),
    }),
}));

class TestResizeObserver implements ResizeObserver {
    static instances: TestResizeObserver[] = [];

    constructor(private callback: ResizeObserverCallback) {
        TestResizeObserver.instances.push(this);
    }

    observe(_target: Element, _options?: ResizeObserverOptions): void {}
    unobserve(_target: Element): void {}
    disconnect(): void {}

    trigger(): void {
        this.callback([], this);
    }
}

const makePage = (items: TestEngagement[]): TestPage => ({ items, total: items.length });

const makeFilter = (taxon_id: number, name: string | undefined, values: string[]) => ({
    taxon_id,
    name,
    values,
});

const renderCategories = () => render(<LandingCategories />);

describe('LandingCategories', () => {
    const originalResizeObserver = global.ResizeObserver;

    beforeEach(() => {
        mockLoaderData = { categories: [] };
        mockFetcher = { data: { engagements: makePage([]) }, load: jest.fn() };
        mockFetcherKeys = [];
        mockSuspendAwait = false;
        TestResizeObserver.instances = [];
        Object.defineProperty(global, 'ResizeObserver', { configurable: true, value: TestResizeObserver });
    });

    afterEach(() => {
        Object.defineProperty(global, 'ResizeObserver', {
            configurable: true,
            value: originalResizeObserver,
        });
    });

    test('filters categories, updates pressed state, and loads the matching search URL', async () => {
        mockLoaderData = {
            categories: [
                null,
                makeFilter(10, 'Topics', ['Climate Change', 'Water']),
                makeFilter(12, undefined, ['Safety']),
                makeFilter(13, 'Empty', []),
            ],
        };
        renderCategories();

        const allTopics = await screen.findByRole('button', { name: 'landing.categorySection.allTopics' });
        const climate = screen.getByRole('button', { name: 'Climate Change' });
        const water = screen.getByRole('button', { name: 'Water' });
        const safety = screen.getByRole('button', { name: 'Safety' });

        expect(allTopics).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('group', { name: 'landing.categorySection.filtersLabel' })).toBeInTheDocument();

        fireEvent.click(climate);
        await waitFor(() => expect(mockFetcher.load).toHaveBeenLastCalledWith('/search?meta-topics=Climate+Change'));
        expect(climate).toHaveAttribute('aria-pressed', 'true');
        expect(water).toHaveAttribute('aria-pressed', 'false');
        expect(allTopics).toHaveAttribute('aria-pressed', 'false');
        expect(mockFetcherKeys.at(-1)).toBe('10Climate Change');

        fireEvent.click(safety);
        await waitFor(() => expect(mockFetcher.load).toHaveBeenLastCalledWith('/search?meta-category-12=Safety'));
        expect(safety).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(allTopics);
        await waitFor(() => expect(mockFetcher.load).toHaveBeenLastCalledWith('/search?'));
        expect(allTopics).toHaveAttribute('aria-pressed', 'true');
        expect(screen.queryByRole('button', { name: 'Empty' })).not.toBeInTheDocument();
    });

    test('renders result tiles, fills a partial row, and links to the selected search', async () => {
        mockLoaderData = { categories: [makeFilter(10, 'Topics', ['Climate'])] };
        const items = [{ id: 1, name: 'Climate engagement' }];
        mockFetcher.data = { engagements: makePage(items) };
        const { rerender } = renderCategories();

        fireEvent.click(await screen.findByRole('button', { name: 'Climate' }));
        await waitFor(() => expect(mockFetcher.load).toHaveBeenLastCalledWith('/search?meta-topics=Climate'));

        expect(screen.getByTestId('engagement-tile')).toHaveTextContent('Climate engagement');
        expect(screen.getAllByTestId('featured-carousel-filler')).toHaveLength(1);
        expect(screen.getByRole('link', { name: 'Browse all (1) engagements' })).toHaveAttribute(
            'href',
            '/search?meta-topics=Climate',
        );
        mockFetcher.data = {
            engagements: makePage([
                { id: 1, name: 'Climate engagement' },
                { id: 2, name: 'Water engagement' },
            ]),
        };
        rerender(<LandingCategories />);
        expect(screen.queryByTestId('featured-carousel-filler')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Browse all (2) engagements' })).toBeInTheDocument();
    });

    test('updates scroll controls, masks, and scroll nudges from the horizontal position', async () => {
        mockFetcher.data = { engagements: makePage([{ id: 1, name: 'Scroll fixture' }]) };
        renderCategories();
        const scrollContainer = await screen.findByRole('group', { name: 'landing.categorySection.filtersLabel' });
        const scrollNode = scrollContainer as HTMLDivElement;
        const viewport = screen.getByTestId('engagement-tile').parentElement?.parentElement;
        expect(viewport).not.toBeNull();
        Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 600 });
        act(() => TestResizeObserver.instances[0].trigger());

        Object.defineProperties(scrollNode, {
            clientWidth: { configurable: true, value: 700 },
            scrollWidth: { configurable: true, writable: true, value: 2000 },
            scrollLeft: { configurable: true, writable: true, value: 0 },
            scrollBy: { configurable: true, value: jest.fn() },
        });
        Object.defineProperty(scrollNode.parentElement, 'clientWidth', { configurable: true, value: 600 });
        expect(scrollNode.clientWidth).toBe(700);
        expect(scrollNode.scrollWidth).toBe(2000);
        fireEvent.scroll(scrollNode);

        const leftButton = scrollContainer.parentElement?.querySelector<HTMLButtonElement>(
            '[aria-label="landing.categorySection.scrollLeft"]',
        );
        expect(leftButton).not.toBeNull();
        const rightButton = screen.getByRole('button', { name: 'landing.categorySection.scrollRight' });
        expect(rightButton).toHaveStyle({ display: 'flex' });

        fireEvent.click(rightButton);
        expect(scrollNode.scrollBy).toHaveBeenCalledWith({ left: 350, behavior: 'smooth' });

        Object.defineProperty(scrollNode, 'scrollLeft', { configurable: true, writable: true, value: 100 });
        fireEvent.scroll(scrollNode);
        expect(leftButton).toHaveStyle({ display: 'flex' });
        expect(rightButton).toHaveStyle({ display: 'flex' });

        fireEvent.click(leftButton!);
        fireEvent.click(rightButton);
        expect(scrollNode.scrollBy).toHaveBeenNthCalledWith(2, { left: -350, behavior: 'smooth' });
        expect(scrollNode.scrollBy).toHaveBeenNthCalledWith(3, { left: 350, behavior: 'smooth' });

        Object.defineProperty(scrollNode, 'scrollLeft', { configurable: true, writable: true, value: 1300 });
        fireEvent.scroll(scrollNode);
        expect(leftButton).toHaveStyle({ display: 'flex' });
        expect(rightButton).toHaveStyle({ display: 'none' });

        Object.defineProperties(scrollNode, {
            scrollWidth: { configurable: true, writable: true, value: 700 },
            scrollLeft: { configurable: true, writable: true, value: 0 },
        });
        fireEvent.scroll(scrollNode);
        expect(leftButton).toHaveStyle({ display: 'none' });
        expect(rightButton).toHaveStyle({ display: 'none' });
    });

    test('uses the parent width check and tolerates missing ResizeObserver or refs', async () => {
        const { unmount: unmountWithObserver } = renderCategories();
        const scrollNode = await screen.findByRole('group', { name: 'landing.categorySection.filtersLabel' });
        Object.defineProperties(scrollNode, {
            clientWidth: { configurable: true, value: 200 },
            scrollWidth: { configurable: true, value: 800 },
            scrollBy: { configurable: true, value: jest.fn() },
        });
        Object.defineProperty(scrollNode.parentElement, 'clientWidth', { configurable: true, value: 250 });
        fireEvent.scroll(scrollNode);
        const rightButton = scrollNode.parentElement?.querySelector<HTMLButtonElement>(
            '[aria-label="landing.categorySection.scrollRight"]',
        );
        expect(rightButton).toHaveStyle({ display: 'none' });

        const unmountedObserverCount = TestResizeObserver.instances.length;
        expect(unmountedObserverCount).toBe(2);
        act(() => TestResizeObserver.instances.forEach((observer) => observer.trigger()));
        unmountWithObserver();

        Object.defineProperty(global, 'ResizeObserver', { configurable: true, value: undefined });
        const withoutObserver = renderCategories();
        const noObserverScroll = screen
            .getAllByRole('group', {
                name: 'landing.categorySection.filtersLabel',
            })
            .at(-1) as HTMLDivElement;
        expect(noObserverScroll).toBeInTheDocument();
        Object.defineProperties(noObserverScroll, {
            clientWidth: { configurable: true, value: 300 },
            scrollWidth: { configurable: true, value: 800 },
            scrollLeft: { configurable: true, value: 0 },
        });
        Object.defineProperty(noObserverScroll.parentElement, 'clientWidth', { configurable: true, value: 250 });
        fireEvent.scroll(noObserverScroll);
        expect(
            noObserverScroll.parentElement?.querySelector('[aria-label="landing.categorySection.scrollRight"]'),
        ).toHaveStyle({
            display: 'flex',
        });
        withoutObserver.unmount();
    });

    test('shows skeletons while results are pending', async () => {
        const pendingPage = new Promise<TestPage>(() => {});
        mockSuspendAwait = true;
        mockFetcher.data = { engagements: pendingPage };
        renderCategories();

        expect(await screen.findAllByTestId('tile-skeleton')).toHaveLength(6);
        expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    });

    test('renders an empty page before the fetcher has results', async () => {
        mockFetcher.data = undefined;
        renderCategories();

        expect(await screen.findByRole('link', { name: 'Browse all (0) engagements' })).toHaveAttribute(
            'href',
            '/search?',
        );
        expect(screen.queryByTestId('engagement-tile')).not.toBeInTheDocument();
    });
});
