import LandingSection from './LandingSection';
import React from 'react';
import SearchAndFilterArea from './SearchAndFilterArea';
import ResultsArea from './ResultsArea';
import CountAndSortArea from './CountAndSortArea';

const EngagementSearch = () => {
    return (
        <LandingSection>
            <SearchAndFilterArea />
            <CountAndSortArea />
            <ResultsArea />
        </LandingSection>
    );
};

export default EngagementSearch;
