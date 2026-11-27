import React from 'react';
import { LandingHero } from './LandingHero';
import { LandingStats } from './LandingStats';
import { LandingFeatured } from './LandingFeatured';
import { LandingCategories } from './LandingCategories';
import { LandingRegions } from './LandingRegions';
import { LandingDynamicDate } from './LandingDynamicDate';

export const Landing = () => {
    return (
        <>
            <LandingHero />
            <LandingStats />
            <LandingFeatured />
            <LandingCategories />
            <LandingRegions />
            <LandingDynamicDate />
        </>
    );
};

export default Landing;
