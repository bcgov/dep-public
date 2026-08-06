import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { colors } from 'styles/Theme';
import { BodyText } from 'components/common/Typography';

interface BlueprintImagePlaceholderProps extends BoxProps {
    height?: string | number;
    title?: string;
    description?: string;
    textProps?: BoxProps;
}

/**
 * Blueprint-style placeholder for missing images in preview mode.
 * Shows an X corner-to-corner and explanatory text.
 */
export const BlueprintImagePlaceholder: React.FC<BlueprintImagePlaceholderProps> = ({
    height = '500px',
    title = 'Image Placeholder',
    description = '',
    textProps,
    ...props
}) => {
    return (
        <Box
            zIndex={1}
            {...props}
            sx={{
                height,
                pointerEvents: 'none',
                width: '100%',
                bgcolor: colors.surface.blue[20],
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxSizing: 'border-box',
                ...props.sx,
            }}
        >
            {/* X corner-to-corner using SVG to create correct diagonal lines */}
            <Box
                component="svg"
                sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {/* Diagonal line from top-left to bottom-right */}
                <line
                    x1="0"
                    y1="0"
                    x2="100"
                    y2="100"
                    stroke={colors.surface.blue[50]}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />
                {/* Diagonal line from top-right to bottom-left */}
                <line
                    x1="100"
                    y1="0"
                    x2="0"
                    y2="100"
                    stroke={colors.surface.blue[50]}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />
            </Box>
            {/* Explanatory text */}
            <Box
                zIndex={2}
                {...textProps}
                sx={{
                    textAlign: 'center',
                    padding: 4,
                    maxWidth: '600px',
                    textWrap: 'nowrap',
                    ...textProps?.sx,
                }}
            >
                <BodyText sx={{ color: 'blue.80', mb: 1, fontSize: '24px' }}>{title}</BodyText>
                <BodyText sx={{ color: 'blue.80' }}>{description}</BodyText>
            </Box>
        </Box>
    );
};

export default BlueprintImagePlaceholder;
