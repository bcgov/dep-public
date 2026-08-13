import React from 'react';
import { Grid2 as Grid, CircularProgress, Typography, Box } from '@mui/material';
import { colors } from 'styles/Theme';
import { BodyText } from './Typography/Body';

export { colors, elevations } from 'styles/Theme';

export const globalFocusShadow = `inset 0px 0px 0px 2px ${colors.focus.regular.inner}`;

export const globalFocusVisible = {
    '&:focus-visible': {
        outline: `2px solid ${colors.focus.regular.outer}`,
        boxShadow: globalFocusShadow,
    },
};

export const MidScreenLoader = ({ message }: { message?: string }) => (
    <Grid container direction="row" justifyContent="center" alignItems="center" sx={{ minHeight: '90vh' }}>
        <Grid alignItems="center" direction="column" container>
            <CircularProgress data-testid="loader" />
            <Typography variant="body1" align="center" sx={{ mt: 2, height: '1.5em' }}>
                {message}
            </Typography>
        </Grid>
    </Grid>
);

interface RepeatedGridProps {
    times: number;
    children: React.ReactNode;
    [prop: string]: unknown;
}
export const RepeatedGrid = ({ times = 1, children, ...rest }: RepeatedGridProps) => {
    return (
        <>
            {[...new Array(times)].map((_element, index) => (
                <Grid key={`repeated-grid-${index}`} {...rest}>
                    {children}
                </Grid>
            ))}
        </>
    );
};

export const modalStyle = {
    borderRadius: '8px',
    borderTop: '8px solid',
    borderColor: colors.notification.default.shade,
    position: 'absolute',
    top: '48%',
    left: '48%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '95vh',
    width: { xs: '90%', sm: '75%', md: '700px' },
    bgcolor: 'background.paper',
    boxShadow: 10,
    pt: 2,
    pb: 3,
    pl: 3,
    pr: 4,
    m: 1,
    overflowY: 'auto',
    color: 'text.primary',
};

export const DisclaimerBox = ({
    children,
    marginTop = '2em',
}: {
    children: React.ReactNode;
    marginTop?: number | string;
}) => {
    return (
        <Box
            sx={{
                borderLeft: 8,
                borderColor: 'primary.main',
                backgroundColor: '#aaaaaa22',
            }}
        >
            <BodyText size="small" mt={marginTop} component="div" p="1em">
                {children}
            </BodyText>
        </Box>
    );
};
