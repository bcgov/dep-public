import React from 'react';
import { Accordion, accordionSummaryClasses, Box, BoxProps } from '@mui/material';

/**
 * A styled Box component that pads and outlines its content with the primary color of the theme.
 * Used to create visually distinct sections in the UI.
 */
export const OutlineBox = (props: BoxProps) => {
    return (
        <Box
            {...props}
            sx={{
                backgroundColor: (theme) => theme.palette.background.paper,
                color: (theme) => theme.palette.primary.contrastText,
                outline: (theme) => `1px solid ${theme.palette.primary.light}`,
                padding: '1em 1.5em',
                borderRadius: '8px',
                ...props.sx,
            }}
        >
            {props.children}
        </Box>
    );
};

export const EngagementAccordion = ({
    children,
    ...props
}: { children: React.ReactNode } & React.ComponentProps<typeof Accordion>) => (
    <Accordion
        elevation={0}
        {...props}
        sx={{
            boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid',
            borderColor: 'gray.50',
            borderRadius: '1rem !important',
            [`& .${accordionSummaryClasses.root}`]: {
                display: 'flex',
                columnGap: '0.5rem',
            },
        }}
    >
        {children}
    </Accordion>
);

export { Table, TableHead, TableHeadRow, TableHeadCell, TableBody, TableRow, TableCell, TableContainer } from './Table';
export { DetailsContainer, Detail } from './Details';
export { UserAvatar } from './UserAvatar';
