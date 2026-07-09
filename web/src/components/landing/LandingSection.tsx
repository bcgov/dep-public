import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { LandingSectionProps } from './types';
import { colors, Layout } from 'styles/Theme';

const LandingSection = ({ children, image, colour, outerStyles = {}, innerStyles = {} }: LandingSectionProps) => {
    return (
        <Grid
            container
            direction="column"
            sx={{
                backgroundImage: image ? `url(${image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: image ? 'transparent' : colour || colors.surface.white,
                width: '100%',
                padding: Layout.padding.default, // Outer padding
                ...outerStyles,
            }}
        >
            <Grid
                container
                direction="column"
                sx={{
                    margin: '0 auto', // Centre content
                    width: '100%', // Becomes 100% width under max width value
                    maxWidth: Layout.width.default, // Maximum width of content container
                    ...innerStyles,
                }}
            >
                {children}
            </Grid>
        </Grid>
    );
};

export default LandingSection;
