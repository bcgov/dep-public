import LandingSection from './LandingSection';
import React from 'react';
import FilterBlock from './FilterBlock';
import TileBlock from './TileBlock';
import { EngagementSearchProps } from './types';

const EngagementSearch = (props: EngagementSearchProps) => {
    return (
        <LandingSection>
            <FilterBlock {...props} />
            <TileBlock {...props} />
        </LandingSection>
    );
};

export default EngagementSearch;
