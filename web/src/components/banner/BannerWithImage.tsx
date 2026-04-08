import React, { useState } from 'react';
import { Box } from '@mui/material';
import LandingPageBanner from 'assets/images/LandingPageBanner.png';
import { BannerProps } from 'components/banner/types';

const BannerWithImage = ({ height, imageUrl, children }: BannerProps) => {
    const [imageError, setImageError] = useState(false);

    if (!imageUrl || imageError) {
        imageUrl = LandingPageBanner;
    }

    return (
        <>
            <Box
                sx={{
                    height: height ? height : '38em',
                    width: '100%',
                    position: 'relative',
                    overflow: 'clip',
                }}
            >
                <img
                    src={imageUrl}
                    style={{
                        objectFit: 'cover',
                        height: height ? height : '38em',
                        width: '100%',
                    }}
                    onError={(_e) => {
                        setImageError(true);
                    }}
                />
                {children}
            </Box>
        </>
    );
};

export default BannerWithImage;
