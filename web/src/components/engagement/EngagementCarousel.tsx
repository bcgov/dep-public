import React, { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import Grid from '@mui/material/Grid2';
import { Box, ButtonProps, Stack, Theme, useMediaQuery } from '@mui/material';
import { Engagement } from 'models/engagement';
import EngagementTile from 'components/engagement/EngagementTile';
import { colors } from 'styles/Theme';
import { PrimaryButton } from 'components/common/Input/Button';

const TILE_WIDTH = 343;
const MIN_TILE_GAP = 16;
const MAX_ITEMS_PER_SLIDE = 3;
const SCROLL_SETTLE_DELAY = 200;
const SHADOW_INSET = 14; // enough to show the full box shadow without letting neighboring slides peek through

export const getItemsPerSlide = (containerWidth: number) =>
    Math.min(
        MAX_ITEMS_PER_SLIDE,
        Math.max(1, Math.floor((containerWidth + MIN_TILE_GAP) / (TILE_WIDTH + MIN_TILE_GAP))),
    );

const getTileWidth = (itemsPerSlide: number) => {
    if (itemsPerSlide === 1) return '100%';
    if (itemsPerSlide === 2) return `calc(50% - ${MIN_TILE_GAP / 2}px)`;
    return TILE_WIDTH;
};

// Three fixed-width tiles are spread evenly; slides use the same gap as the tiles.
export const getTileGap = (containerWidth: number, itemsPerSlide: number) =>
    itemsPerSlide === MAX_ITEMS_PER_SLIDE
        ? Math.max(MIN_TILE_GAP, (containerWidth - itemsPerSlide * TILE_WIDTH) / (itemsPerSlide - 1))
        : MIN_TILE_GAP;

const chunk = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};

const NavigationButton = (props: ButtonProps) => {
    return (
        <PrimaryButton
            {...props}
            sx={{
                backgroundColor: 'blue.90',
                borderRadius: '999px',
                minWidth: '44px',
                height: '44px',
                fontSize: '18px',
                p: 0,
                ...props.sx,
            }}
        />
    );
};

interface EngagementCarouselProps {
    engagements: Engagement[];
    heading?: ReactNode;
}

const EngagementCarousel = ({ engagements, heading }: EngagementCarouselProps) => {
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const programmaticScroll = useRef(false);
    const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [itemsPerSlide, setItemsPerSlide] = useState(MAX_ITEMS_PER_SLIDE);
    const [tileGap, setTileGap] = useState(MIN_TILE_GAP);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = chunk(engagements, itemsPerSlide);
    const slideCount = slides.length;
    const showControls = slideCount > 1;
    const tileWidth = getTileWidth(itemsPerSlide);

    // Refresh items-per-slide and tile gap when the viewport width changes.
    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const update = () => {
            if (viewport.clientWidth > 0) {
                const items = getItemsPerSlide(viewport.clientWidth);
                setItemsPerSlide(items);
                setTileGap(getTileGap(viewport.clientWidth, items));
            }
        };
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(update);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, []);

    // Callback to clear the scroll timer and prevent multiple triggers of the scroll fallback.
    const clearScrollTimer = useCallback(() => {
        if (scrollTimer.current !== null) {
            clearTimeout(scrollTimer.current);
            scrollTimer.current = null;
        }
    }, []);

    // Callback to synchronize the current slide with the track's scroll position.
    const syncCurrentSlide = useCallback(() => {
        const track = trackRef.current;
        const viewport = viewportRef.current;
        if (!track || !viewport || viewport.clientWidth === 0 || slideCount === 0) return;
        const index = Math.round(track.scrollLeft / (viewport.clientWidth + tileGap));
        setCurrentSlide(Math.min(Math.max(index, 0), slideCount - 1));
    }, [slideCount, tileGap]);

    // Callback to finish a programmatic scroll and update the current slide.
    const finishProgrammaticScroll = useCallback(() => {
        clearScrollTimer();
        programmaticScroll.current = false;
        syncCurrentSlide();
    }, [clearScrollTimer, syncCurrentSlide]);

    // Attach the 'scrollend' event listener to the track to handle programmatic scroll completion.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        track.addEventListener('scrollend', finishProgrammaticScroll);
        return () => track.removeEventListener('scrollend', finishProgrammaticScroll);
    }, [finishProgrammaticScroll]);

    // Actionless effect that returns a cleanup function, used to clear the scroll timer on unmount.
    useEffect(() => clearScrollTimer, [clearScrollTimer]);

    // Callback to schedule a fallback scroll in case the 'scrollend' event is not supported.
    const scheduleScrollFallback = useCallback(() => {
        const track = trackRef.current;
        if (!track || 'onscrollend' in track) return;
        clearScrollTimer();
        scrollTimer.current = setTimeout(finishProgrammaticScroll, SCROLL_SETTLE_DELAY);
    }, [clearScrollTimer, finishProgrammaticScroll]);

    // Trigger the scroll fallback when a programmatic scroll is in progress.
    useEffect(() => {
        if (programmaticScroll.current) scheduleScrollFallback();
    }, [scheduleScrollFallback]);

    // Callback to scroll to a specific slide, with configurable animation behavior.
    const scrollToSlide = useCallback(
        (index: number, behavior: ScrollBehavior = 'smooth') => {
            const track = trackRef.current;
            const viewport = viewportRef.current;
            setCurrentSlide(index);
            if (!track || !viewport) return;
            const left = index * (viewport.clientWidth + tileGap);
            clearScrollTimer();
            programmaticScroll.current = behavior === 'smooth' && Math.abs(track.scrollLeft - left) > 1;
            track.scrollTo?.({ left, behavior });
            if (programmaticScroll.current) scheduleScrollFallback();
        },
        [clearScrollTimer, scheduleScrollFallback, tileGap],
    );

    // Keep the position valid when a resize changes how many slides there are.
    useEffect(() => {
        if (currentSlide > slideCount - 1) {
            scrollToSlide(Math.max(slideCount - 1, 0), 'auto');
        }
    }, [slideCount, currentSlide, scrollToSlide]);

    // Handler for the scroll event, differentiating between programmatic and user-initiated scrolls.
    const handleScroll = () => {
        if (programmaticScroll.current) {
            scheduleScrollFallback();
        } else {
            syncCurrentSlide();
        }
    };

    // Handler for user-initiated scrolls, clearing the scroll timer and marking the scroll as non-programmatic.
    const handleUserScroll = () => {
        clearScrollTimer();
        programmaticScroll.current = false;
    };

    return (
        <>
            <Grid
                container
                size={12}
                alignItems="center"
                justifyContent={heading ? 'space-between' : 'flex-end'}
                wrap="nowrap"
            >
                {heading}
                {showControls && !isMobile && (
                    <Grid container columnSpacing={1}>
                        <NavigationButton
                            color="primary"
                            aria-label="Previous"
                            disabled={currentSlide <= 0}
                            onClick={() => scrollToSlide(currentSlide - 1)}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </NavigationButton>
                        <NavigationButton
                            color="primary"
                            aria-label="Next"
                            disabled={currentSlide >= slideCount - 1}
                            onClick={() => scrollToSlide(currentSlide + 1)}
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </NavigationButton>
                    </Grid>
                )}
            </Grid>
            <Grid ref={viewportRef} size={12}>
                <Box
                    ref={trackRef}
                    data-testid="featured-carousel-track"
                    onScroll={handleScroll}
                    onWheel={handleUserScroll}
                    onTouchStart={handleUserScroll}
                    onPointerDown={handleUserScroll}
                    onKeyDown={handleUserScroll}
                    sx={{
                        display: 'flex',
                        gap: `${tileGap}px`,
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                        pt: '24px',
                        pb: '16px',
                        // Expand the scrollport to display box shadows, but
                        // keep its content aligned with the viewport.
                        mx: `-${SHADOW_INSET}px`,
                        px: `${SHADOW_INSET}px`,
                        scrollPaddingInline: `${SHADOW_INSET}px`,
                    }}
                >
                    {slides.map((slide, slideIndex) => (
                        <Box
                            key={slide[0].id}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${slideIndex + 1} of ${slideCount}`}
                            data-testid="featured-carousel-slide"
                            sx={{
                                flex: '0 0 100%',
                                display: 'flex',
                                scrollSnapAlign: 'start',
                                scrollSnapStop: 'always',
                                justifyContent: 'space-between',
                            }}
                        >
                            {slide.map((engagement) => (
                                <Box
                                    key={engagement.id}
                                    sx={{
                                        width: tileWidth,
                                        flex: '0 0 auto',
                                    }}
                                >
                                    <EngagementTile
                                        passedEngagement={engagement}
                                        engagementId={engagement.id}
                                        fullWidth={itemsPerSlide < MAX_ITEMS_PER_SLIDE}
                                    />
                                </Box>
                            ))}
                            {/* Invisible fillers keep a partial slide left-aligned under space-between */}
                            {Array.from({ length: itemsPerSlide - slide.length }, (_, i) => (
                                <Box
                                    key={`filler-${i}`}
                                    aria-hidden
                                    data-testid="featured-carousel-filler"
                                    sx={{ width: tileWidth, flex: '0 0 auto', visibility: 'hidden' }}
                                />
                            ))}
                        </Box>
                    ))}
                </Box>
            </Grid>
            {showControls && (
                <Grid size={12}>
                    <Stack direction="row" justifyContent="center" data-testid="featured-carousel-pips">
                        {slides.map((slide, index) => (
                            <Box
                                key={slide[0].id}
                                component="button"
                                type="button"
                                aria-label={
                                    index === currentSlide
                                        ? `Current slide ${index + 1} of ${slides.length}`
                                        : `Go to slide ${index + 1} of ${slides.length}`
                                }
                                aria-current={index === currentSlide}
                                onClick={() => scrollToSlide(index)}
                                sx={{
                                    width: 44,
                                    height: 44,
                                    flex: '0 0 44px',
                                    p: 0,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 0,
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <Box
                                    aria-hidden
                                    data-testid="featured-carousel-pip-dot"
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        boxSizing: 'border-box',
                                        borderRadius: '50%',
                                        border: `1px solid ${colors.surface.blue[100]}`,
                                        backgroundColor:
                                            index === currentSlide ? colors.surface.blue[100] : 'transparent',
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Grid>
            )}
        </>
    );
};

export default EngagementCarousel;
