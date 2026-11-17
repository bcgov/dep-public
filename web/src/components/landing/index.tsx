import React from 'react';
import { LandingHero } from './LandingHero';
import { LandingStats } from './LandingStats';
import { LandingFeatured } from './LandingFeatured';
import { LandingRegions } from './LandingRegions';

export const Landing = () => {
    return (
        <>
            <LandingHero />
            <LandingStats />
            <LandingFeatured />
            <LandingRegions />
        </>
    );
};

export default Landing;
