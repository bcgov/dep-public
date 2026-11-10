import React from 'react';
import { LandingHero } from './LandingHero';
import { LandingStats } from './LandingStats';
import { LandingFeatured } from './LandingFeatured';

export const Landing = () => {
    return (
        <>
            <LandingHero />
            <LandingStats />
            <LandingFeatured />
        </>
    );
};

export default Landing;
