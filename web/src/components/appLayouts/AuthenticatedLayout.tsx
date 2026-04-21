import React from 'react';
import '@bcgov/design-tokens/css-prefixed/variables.css'; // Variables will be within scope within AuthenticatedLayout and its children
import { Outlet } from 'react-router';
import { Box, ThemeProvider } from '@mui/material';
import InternalHeader from '../layout/Header/InternalHeader';
import { Notification } from 'components/common/notification';
import { NotificationModal } from 'components/common/modal';
import { FeedbackModal } from 'components/feedback/FeedbackModal';
import Footer from 'components/layout/Footer';
import { AdminTheme, ZIndex } from 'styles/Theme';
import DocumentTitle from 'DocumentTitle';
import ScrollToTop from 'components/scrollToTop';
import FormioListener from 'components/FormioListener';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export const AuthenticatedLayout = () => {
    return (
        <ThemeProvider theme={AdminTheme}>
            <DocumentTitle />
            <Box sx={{ display: 'flex' }}>
                <InternalHeader />
                <Notification />
                <NotificationModal />
                <ScrollToTop />
                <FormioListener />
                <LocalizationProvider
                    dateFormats={{
                        keyboardDate: 'YYYY-MM-DD',
                    }}
                    dateAdapter={AdapterDayjs}
                >
                    <Box
                        component="main"
                        sx={{ flexGrow: 1, marginTop: { xs: '3.5em', md: '6.5em' }, width: '100%', overflowX: 'auto' }}
                    >
                        <Outlet />
                        <FeedbackModal />
                    </Box>
                </LocalizationProvider>
            </Box>
            <Box
                sx={{
                    backgroundColor: 'var(--bcds-surface-background-white)',
                    zIndex: ZIndex.footer,
                    position: 'relative',
                }}
            >
                <Footer />
            </Box>
        </ThemeProvider>
    );
};

export default AuthenticatedLayout;
