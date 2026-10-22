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
        <Grid container size={12} gap={0.5}>
            <Grid
                container
                size="auto"
                justifyContent="flex-start"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                width="32px"
            >
                {icon && <FontAwesomeIcon icon={icon} fontSize="24px" />}
            </Grid>
            <Grid container direction={{ xs: 'column', sm: 'row' }}>
                <Grid container width={source === 'in-person' ? '88px' : '52px'}>
                    <BodyText bold lineHeight="24px">
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
