import { useEffect } from 'react';
import { useLocation } from 'react-router';

const PageViewTracker = () => {
    const location = useLocation();
    useEffect(() => {
        try {
            globalThis.snowplow('trackPageView');
        } catch (error) {
            console.log('Track page view snowplow error:', error);
        }
    }, [location]);

    return null;
};

export default PageViewTracker;
