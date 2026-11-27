import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const TILE_WIDTH = 343;
const MIN_TILE_GAP = 16;
export const MAX_ITEMS_PER_SLIDE = 3;

export const getItemsPerSlide = (containerWidth: number) =>
    Math.min(
        MAX_ITEMS_PER_SLIDE,
        Math.max(1, Math.floor((containerWidth + MIN_TILE_GAP) / (TILE_WIDTH + MIN_TILE_GAP))),
    );

export const getTileWidth = (itemsPerSlide: number) => {
    if (itemsPerSlide === 1) return '100%';
    if (itemsPerSlide === 2) return `calc(50% - ${MIN_TILE_GAP / 2}px)`;
    return TILE_WIDTH;
};

export const getTileGap = (containerWidth: number, itemsPerSlide: number) =>
    itemsPerSlide === MAX_ITEMS_PER_SLIDE
        ? Math.max(MIN_TILE_GAP, (containerWidth - itemsPerSlide * TILE_WIDTH) / (itemsPerSlide - 1))
        : MIN_TILE_GAP;

export const useCarouselLayout = (initialItemsPerSlide = MAX_ITEMS_PER_SLIDE) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
    const [itemsPerSlide, setItemsPerSlide] = useState(initialItemsPerSlide);
    const [tileGap, setTileGap] = useState(MIN_TILE_GAP);

    const setViewportRef = useCallback((element: HTMLDivElement | null) => {
        viewportRef.current = element;
        setViewport(element);
    }, []);

    useLayoutEffect(() => {
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
    }, [viewport]);

    return { viewportRef, setViewportRef, itemsPerSlide, tileGap, tileWidth: getTileWidth(itemsPerSlide) };
};
