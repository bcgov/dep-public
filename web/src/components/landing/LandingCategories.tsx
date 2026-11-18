import React, { Suspense, useLayoutEffect } from 'react';
import { getTileWidth, getItemsPerSlide as getItemsPerRow } from 'components/engagement/EngagementCarousel';
import LandingSection from './LandingSection';
import { Heading2 } from 'components/common/Typography';
import { LandingLoaderData } from './landingLoader';
import { Await, useLoaderData, useFetcher } from 'react-router';
import { FilterChip } from './FilterChip';
import { Grid2 as Grid, Skeleton, Stack } from '@mui/material';
import { getPath, ROUTES } from 'routes/routes';
import { TileSkeleton } from 'components/engagement/TileSkeleton';
import EngagementTile from 'components/engagement/EngagementTile';
import { EngagementSearchLoaderData } from 'components/engagement/search/engagementSearchLoader';
import { Engagement } from 'models/engagement';
import { Page } from 'services/type';
import { Link } from 'components/common/Navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong } from '@fortawesome/pro-regular-svg-icons';
import { SolidIconButton } from 'components/common/Input/Button';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useAppTranslation } from 'hooks';

export const LandingCategories = () => {
    const { t: translate } = useAppTranslation();
    const loaderData = useLoaderData() as LandingLoaderData;
    const [selectedTaxon, setSelectedTaxon] = React.useState<Awaited<LandingLoaderData['categories']>[number] | null>(
        null,
    );
    const [selectedValue, setSelectedValue] = React.useState<string | null>(null);
    const fetcher = useFetcher<EngagementSearchLoaderData>({
        key: (selectedTaxon?.taxon_id ?? 0) + (selectedValue ?? ''),
    });
    const metaKey = `meta-${selectedTaxon?.name?.toLocaleLowerCase() ?? 'category-' + selectedTaxon?.taxon_id}`;
    const params = new URLSearchParams(selectedTaxon && selectedValue ? { [metaKey]: selectedValue } : {});
    React.useEffect(() => {
        fetcher.load(`${getPath(ROUTES.PUBLIC_SEARCH)}?${params}`);
    }, [selectedTaxon, selectedValue]);
    const [itemsPerRow, setItemsPerRow] = React.useState(getItemsPerRow(window.innerWidth));
    const [viewport, setViewport] = React.useState<HTMLDivElement | null>(null);
    const [scrollContainer, setScrollContainer] = React.useState<HTMLDivElement | null>(null);
    const [scrollSide, setScrollSide] = React.useState<'left' | 'right' | 'both' | null>(null);

    // Refresh items-per-slide and tile gap when the viewport width changes.
    useLayoutEffect(() => {
        if (!viewport) return;
        const update = () => {
            if (viewport.clientWidth > 0) {
                setItemsPerRow(getItemsPerRow(viewport.clientWidth));
            }
        };
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(update);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [viewport]);

    // Update scroll side based on scroll position of the container.
    useLayoutEffect(() => {
        if (!scrollContainer) return;

        const updateScrollSide = () => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
            // If the scroll container is less wide than its parent, no scrolling can be needed
            if (clientWidth <= (scrollContainer.parentNode as HTMLDivElement).clientWidth) {
                setScrollSide(null);
                return;
            }
            if (scrollLeft === 0) {
                setScrollSide(scrollWidth > clientWidth ? 'right' : null);
            } else if (scrollLeft + clientWidth >= scrollWidth) {
                setScrollSide('left');
            } else {
                setScrollSide('both');
            }
        };

        updateScrollSide();
        scrollContainer.addEventListener('scroll', updateScrollSide);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollSide);
        observer?.observe(scrollContainer);
        return () => {
            scrollContainer.removeEventListener('scroll', updateScrollSide);
            observer?.disconnect();
        };
    }, [scrollContainer]);

    const nudgeScroll = (direction: 'left' | 'right') => {
        if (!scrollContainer) return;
        const scrollAmount = scrollContainer.clientWidth * 0.5;
        scrollContainer.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    };

    const engagementTileWidth = getTileWidth(itemsPerRow);

    const fillerTileCount = (engagements: Awaited<EngagementSearchLoaderData['engagements']>) => {
        const totalItems = engagements.items.length;
        const itemsOnLastSlide = totalItems % itemsPerRow; // remainder after dividing total items by items per row
        if (!itemsOnLastSlide) return 0;
        return itemsPerRow - itemsOnLastSlide;
    };

    const getScrollMaskImage = () => {
        const scrollMaskTransparencySize = '60px';
        const scrollMaskFadeDistance = '120px';
        if (scrollSide === 'left' || scrollSide === 'right') {
            const gradientDirection = scrollSide === 'left' ? 'to right' : 'to left';
            return `linear-gradient(${gradientDirection}, transparent 0%, transparent ${scrollMaskTransparencySize}, black ${scrollMaskFadeDistance}, black 100%)`;
        }
        if (scrollSide === 'both') {
            return `linear-gradient(to right, transparent ${scrollMaskTransparencySize}, black ${scrollMaskFadeDistance}, black calc(100% - ${scrollMaskFadeDistance}), transparent calc(100% - ${scrollMaskTransparencySize}))`;
        }
        return '';
    };

    const clearSelection = () => {
        setSelectedValue(null);
        setSelectedTaxon(null);
    };

    return (
        <Suspense>
            <Await resolve={loaderData.categories}>
                {(categories) => (
                    <LandingSection innerStyles={{ flexDirection: 'row' }}>
                        <Heading2 decorated>{translate('landing.categorySection.title')}</Heading2>
                        {/* Scrollable container for category chips */}
                        <Grid container direction="row">
                            <SolidIconButton
                                onClick={() => nudgeScroll('left')}
                                aria-label={translate('landing.categorySection.scrollLeft')}
                                sx={{
                                    mr: '-44px',
                                    zIndex: 3,
                                    display: scrollSide === 'left' || scrollSide === 'both' ? 'flex' : 'none',
                                }}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </SolidIconButton>
                            <Stack
                                ref={setScrollContainer}
                                role="group"
                                aria-label={translate('landing.categorySection.filtersLabel')}
                                direction="row"
                                gap={2}
                                width="calc(100% + 2rem)"
                                m={-2}
                                p={2}
                                sx={{
                                    overflowX: 'auto',
                                    scrollbarWidth: 'none',
                                    maskSize: '100% 100%',
                                    maskImage: getScrollMaskImage(),
                                    alignItems: 'center',
                                }}
                            >
                                <FilterChip
                                    sx={{ height: { xs: '28px', sm: '44px' } }}
                                    pressed={selectedValue === null}
                                    label={translate('landing.categorySection.allTopics')}
                                    onClick={clearSelection}
                                />
                                {categories.map((filter) =>
                                    filter?.values.map((f) => (
                                        <FilterChip
                                            sx={{ height: { xs: '28px', sm: '44px' } }}
                                            key={f + filter?.taxon_id}
                                            pressed={selectedTaxon === filter && selectedValue === f}
                                            label={f}
                                            onClick={() => {
                                                setSelectedTaxon(filter);
                                                setSelectedValue(f);
                                            }}
                                        />
                                    )),
                                )}
                            </Stack>
                            <SolidIconButton
                                onClick={() => nudgeScroll('right')}
                                aria-label={translate('landing.categorySection.scrollRight')}
                                sx={{
                                    ml: '-44px',
                                    zIndex: 3,
                                    display: scrollSide === 'right' || scrollSide === 'both' ? 'flex' : 'none',
                                }}
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                            </SolidIconButton>
                        </Grid>
                        <Suspense fallback={<EngagementsSkeleton />}>
                            <Await
                                resolve={
                                    fetcher.data?.engagements ??
                                    Promise.resolve({ items: [], total: 0 } as Page<Engagement>)
                                }
                            >
                                {(engagements) => (
                                    <>
                                        <Grid
                                            container
                                            width="100%"
                                            ref={setViewport}
                                            my={3}
                                            gap={2}
                                            justifyContent="space-between"
                                        >
                                            {engagements.items.map((engagement: Engagement) => (
                                                <Grid width={engagementTileWidth} key={engagement.id} flex="0 0 auto">
                                                    <EngagementTile
                                                        fullWidth
                                                        engagementId={engagement.id}
                                                        passedEngagement={engagement}
                                                    />
                                                </Grid>
                                            ))}
                                            {Array.from(
                                                {
                                                    length: fillerTileCount(engagements),
                                                },
                                                (_, i) => (
                                                    <Grid
                                                        key={`filler-${i}`}
                                                        aria-hidden
                                                        data-testid="featured-carousel-filler"
                                                        sx={{
                                                            width: engagementTileWidth,
                                                            flex: '0 0 auto',
                                                            visibility: 'hidden',
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </Grid>
                                        <Grid size={12}>
                                            <Link
                                                size="large"
                                                to={getPath(ROUTES.PUBLIC_SEARCH) + `?${params.toString()}`}
                                            >
                                                {translate('landing.categorySection.viewAll').split('{0}')[0]}
                                                <b> ({engagements.total}) </b>
                                                {translate('landing.categorySection.viewAll').split('{0}')[1]}
                                                <FontAwesomeIcon
                                                    icon={faArrowRightLong}
                                                    style={{ paddingInlineStart: '8px' }}
                                                />
                                            </Link>
                                        </Grid>
                                    </>
                                )}
                            </Await>
                        </Suspense>
                    </LandingSection>
                )}
            </Await>
        </Suspense>
    );
};

const EngagementsSkeleton = () => (
    <>
        <Grid container my={3} gap={2} justifyContent="space-between">
            {Array.from({ length: 6 }).map((_, index) => (
                <TileSkeleton key={index} />
            ))}
        </Grid>
        <Grid size={12}>
            <Link>
                <Skeleton variant="text" width="250px" />
            </Link>
        </Grid>
    </>
);

export default LandingCategories;
