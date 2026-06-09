import { useEffect } from 'react';
import { useLocation } from 'react-router';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        globalThis.scrollTo(0, 0); // Scroll to the top of the page on route change
    }, [pathname]);

    return null;
};

export default ScrollToTop;
