import React from 'react';
import '@bcgov/design-tokens/css-prefixed/variables.css';
import { Outlet } from 'react-router';
import { Box } from '@mui/material';
import { Notification } from 'components/common/notification';
import { NotificationModal } from 'components/common/modal';
import { FeedbackModal } from 'components/feedback/FeedbackModal';
import Footer from 'components/layout/Footer';
import { ZIndex } from 'styles/Theme';
import DocumentTitle from 'DocumentTitle';
import ScrollToTop from 'components/scrollToTop';
import FormioListener from 'components/FormioListener';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

/**
 * Simplified layout for preview pages.
 * Similar to AuthenticatedLayout but with a simplified header (no tenant switcher or user menu).
 */
export const SimplifiedLayout = () => {
    return (
        <>
            <DocumentTitle />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Notification />
                <NotificationModal />
                <Box sx={{ flexGrow: 1, width: '100%', overflowX: 'auto' }}>
                    <ScrollToTop />
                    <FormioListener />
                    <LocalizationProvider dateFormats={{ keyboardDate: 'YYYY-MM-DD' }} dateAdapter={AdapterDayjs}>
                        <Outlet />
                    </LocalizationProvider>
                    <FeedbackModal />
                </Box>
            </Box>
            <Box position="relative" zIndex={ZIndex.footer} bgcolor="background.default">
                <Footer />
            </Box>
        </>
    );
};

export default SimplifiedLayout;
