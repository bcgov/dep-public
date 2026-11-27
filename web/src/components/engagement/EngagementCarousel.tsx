import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import Grid from '@mui/material/Grid2';
import { Box, Stack, Theme, useMediaQuery } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { Engagement } from 'models/engagement';
import EngagementTile from 'components/engagement/EngagementTile';
import { colors } from 'styles/Theme';
import { SecondaryButton, SolidIconButton } from 'components/common/Input/Button';
import { useAppTranslation } from 'hooks';
import { MAX_ITEMS_PER_SLIDE, useCarouselLayout } from './useCarouselLayout';

const SCROLL_SETTLE_DELAY = 200;
const SHADOW_INSET = 14; // enough to show the full box shadow without letting neighboring slides peek through

export { getItemsPerSlide, getTileWidth, getTileGap } from './useCarouselLayout';

const chunk = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};

interface EngagementCarouselProps {
    engagements: Engagement[];
    heading?: ReactNode;
    ariaLabel?: string;
    loadNextPage?: () => Promise<EngagementCarouselPage>;
}

export interface EngagementCarouselPage {
    engagements: Engagement[];
    loadNextPage?: () => Promise<EngagementCarouselPage>;
}

const EngagementCarousel = ({ engagements, heading, ariaLabel, loadNextPage }: EngagementCarouselProps) => {
    const { t: translate } = useAppTranslation();
    // States for traversal and loading of engagement pages
    const [pageState, setPageState] = useState<{
        source: Engagement[];
        sourceNext: typeof loadNextPage;
        extra: Engagement[];
        next: typeof loadNextPage;
        failed: boolean;
    }>({ source: engagements, sourceNext: loadNextPage, extra: [], next: loadNextPage, failed: false });
    const isCurrentSource = pageState.source === engagements && pageState.sourceNext === loadNextPage;
    const allEngagements = isCurrentSource ? [...engagements, ...pageState.extra] : engagements;

    // Recursively load the next page of engagements
    useEffect(() => {
        if (!isCurrentSource || !pageState.next || pageState.failed) return;
        let cancelled = false;
        const next = pageState.next;
        void Promise.resolve()
            .then(next)
            .then(
                (page) => {
                    if (cancelled) return;
                    setPageState((state) => {
                        if (state.source !== engagements || state.sourceNext !== loadNextPage) return state;
                        const seen = new Set([...engagements, ...state.extra].map((engagement) => engagement.id));
                        const extra = page.engagements.filter((engagement) => {
                            if (seen.has(engagement.id)) return false;
                            seen.add(engagement.id);
                            return true;
                        });
                        return { ...state, extra: [...state.extra, ...extra], next: page.loadNextPage };
                    });
                },
                () => {
                    if (!cancelled) setPageState((state) => ({ ...state, failed: true }));
                },
            );
        return () => {
            cancelled = true;
        };
    }, [engagements, loadNextPage, isCurrentSource, pageState.next, pageState.failed]);

    // Reset the whole promise chain when the source engagements or loadNextPage function changes
    useEffect(() => {
        setPageState({ source: engagements, sourceNext: loadNextPage, extra: [], next: loadNextPage, failed: false });
    }, [engagements, loadNextPage]);

    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
    const { viewportRef, setViewportRef, itemsPerSlide, tileGap, tileWidth } = useCarouselLayout();
    const trackRef = useRef<HTMLDivElement>(null);
    const programmaticScroll = useRef(false);
    const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [announcement, setAnnouncement] = useState('');
    const previousSlide = useRef(0);

    const slides = chunk(allEngagements, itemsPerSlide);
    const slideCount = slides.length;
    const showControls = slideCount > 1;

    useEffect(() => {
        if (currentSlide !== previousSlide.current && currentSlide < slideCount) {
            setAnnouncement(
                translate('engagementCarousel.slideAnnouncement')
                    .replace('{0}', (currentSlide + 1).toString())
                    .replace('{1}', slideCount.toString()),
            );
            previousSlide.current = currentSlide;
        }
    }, [currentSlide, slideCount, translate]);

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
        <Box
            role="region"
            sx={{ width: '100%', minWidth: 0 }}
            aria-label={
                ariaLabel ?? translate('engagementCarousel.label').replace('{0}', allEngagements.length.toString())
            }
        >
            <Box role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
                {announcement}
            </Box>
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
                        <SolidIconButton
                            color="primary"
                            aria-label="Previous"
                            disabled={currentSlide <= 0}
                            onClick={() => scrollToSlide(currentSlide - 1)}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </SolidIconButton>
                        <SolidIconButton
                            color="primary"
                            aria-label="Next"
                            disabled={currentSlide >= slideCount - 1}
                            onClick={() => scrollToSlide(currentSlide + 1)}
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </SolidIconButton>
                    </Grid>
                )}
            </Grid>
            <Grid ref={setViewportRef} size={12}>
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
                        pt: '1.5rem',
                        pb: '1rem',
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
            {isCurrentSource && pageState.failed && (
                <Box role="alert">
                    {translate('engagementCarousel.loadError')}{' '}
                    <SecondaryButton
                        type="button"
                        size="small"
                        onClick={() => {
                            setPageState((state) => ({ ...state, failed: false }));
                        }}
                    >
                        {translate('engagementCarousel.retry')}
                    </SecondaryButton>
                </Box>
            )}
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
        </Box>
    );
};;;;;;;;

export default EngagementCarousel;
