import React from 'react';
import { LandingHero } from './LandingHero';
import { LandingStats } from './LandingStats';
import { LandingFeatured } from './LandingFeatured';
import { LandingCategories } from './LandingCategories';
import { LandingRegions } from './LandingRegions';

export const Landing = () => {
    return (
        <>
            <LandingHero />
            <LandingStats />
            <LandingFeatured />
            <LandingCategories />
            <LandingRegions />
        </>
    );
};

export default Landing;
