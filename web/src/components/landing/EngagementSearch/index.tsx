import LandingSection from '../LandingSection';
import React from 'react';
import SearchAndFilterArea from './SearchAndFilterArea';
import ResultsArea from './ResultsArea';
import CountAndSortArea from './CountAndSortArea';
import { ThemeProvider } from '@mui/material';
import { DarkTheme } from 'styles/Theme';
import FilterDrawer from './FilterDrawer';

const EngagementSearch = () => {
    return (
        <LandingSection>
            <ThemeProvider theme={DarkTheme}>
                <FilterDrawer />
            </ThemeProvider>
            <SearchAndFilterArea />
            <CountAndSortArea />
            <ResultsArea />
        </LandingSection>
    );
};

export default EngagementSearch;
