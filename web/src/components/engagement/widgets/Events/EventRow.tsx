import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';

export const EventRow = ({ icon, label, children }: { icon?: IconDefinition; label: string; children: React.ReactNode }) => {
    return (
        <Grid container size={12} gap={1}>
            <Grid container size="auto" alignItems="flex-start" width="32px">
                {icon && <FontAwesomeIcon icon={icon} fontSize="28px" />}
            </Grid>
            <Grid container width="88px">
                <BodyText bold lineHeight="28px">{label}</BodyText>
            </Grid>
            <Grid container direction="column" size="grow">
                {children}
            </Grid>
        </Grid>
    );
};

export default EventRow;