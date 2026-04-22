import React, { useContext } from 'react';
import '@bcgov/design-tokens/css-prefixed/variables.css'; // Variables will be within scope within PublicLayout and its children
import { Outlet } from 'react-router';
import PublicHeader from '../layout/Header/PublicHeader';
import InternalHeader from '../layout/Header/InternalHeader';
import { Notification } from 'components/common/notification';
import PageViewTracker from 'routes/PageViewTracker';
import { NotificationModal } from 'components/common/modal';
import { FeedbackModal } from 'components/feedback/FeedbackModal';
import Footer from 'components/layout/Footer';
import DocumentTitle from 'DocumentTitle';
import ScrollToTop from 'components/scrollToTop';
import { Box } from '@mui/material';
import { colors } from 'components/common';
import { AuthKeyCloakContext } from 'components/auth/AuthKeycloakContext';

export const PublicLayout = () => {
    const { isAuthenticated } = useContext(AuthKeyCloakContext);

    return (
        <Box
            sx={{
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
            }}
        >
            <Box
                sx={{
                    maxWidth: '1926px',
                    margin: '0 auto',
                    background: colors.surface.white,
                }}
            >
                <DocumentTitle />
                <PageViewTracker />
                <Notification />
                <NotificationModal />
                {isAuthenticated ? <InternalHeader showSideNav={false} /> : <PublicHeader />}
                <ScrollToTop />
                <Box component="main" sx={isAuthenticated ? { marginTop: { xs: '3.5em', md: '6.5em' } } : undefined}>
                    <Outlet />
                </Box>
                <FeedbackModal />
                <Footer />
            </Box>
        </Box>
    );
};

export default PublicLayout;
