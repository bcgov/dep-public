import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';

export const EventRow = ({
    source,
    icon,
    label,
    children,
}: {
    source: 'virtual' | 'in-person';
    icon?: IconDefinition;
    label: string;
    children: React.ReactNode;
}) => {
    return (
        <Grid container size={12} gap={1}>
            <Grid container size="auto" alignItems="flex-start" width="36px">
                {icon && <FontAwesomeIcon icon={icon} fontSize="28px" />}
            </Grid>
            <Grid container direction={{ xs: 'column', sm: 'row' }}>
                <Grid container width={source === 'in-person' ? '84px' : '54px'}>
                    <BodyText bold lineHeight="28px">
                        {label}
                    </BodyText>
                </Grid>
                <Grid justifyContent="center" container direction="column" size="grow">
                    {children}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default EventRow;
