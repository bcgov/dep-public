import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { formatToPacific } from 'components/common/dateHelper';
import { EventProps } from './InPersonEvent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faClock } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';
import { Button } from 'components/common/Input/Button';

const VirtualSession = ({ eventItem }: EventProps) => {
    // Define styles
    const containerStyles = {
        alignItems: 'center',
        paddingLeft: '0 !important',
    };
    const iconStyles = {
        display: 'flex',
        marginRight: '0.8750em',
        fontSize: '1.5em',
        width: '1em',
        verticalAlign: 'middle',
    };

    // Define time/date
    const startDate = formatToPacific(eventItem.start_date, 'DD MMM, YYYY');
    const startTime = formatToPacific(eventItem.start_date, 'h:mm a');
    const endTime = formatToPacific(eventItem.end_date, 'h:mm a');

    return (
        <>
            <Grid container justifyContent="flex-start" size={12} sx={containerStyles}>
                <Grid size={{ xs: 0, sm: 1 }} style={{ maxWidth: '2rem' }}>
                    <FontAwesomeIcon icon={faCalendarDays} style={iconStyles} />
                </Grid>
                <Grid size={{ xs: 6, md: 3, xl: 2 }}>
                    <BodyText bold>Date</BodyText>
                </Grid>
                <Grid size={{ xs: 12, md: 8, xl: 9 }}>
                    <BodyText>{startDate}</BodyText>
                </Grid>
            </Grid>
            <Grid container justifyContent="flex-start" size={12} sx={containerStyles}>
                <Grid size={{ xs: 0, sm: 1 }} style={{ maxWidth: '2rem' }}>
                    <FontAwesomeIcon icon={faClock} style={iconStyles} />
                </Grid>
                <Grid size={{ xs: 6, md: 3, xl: 2 }}>
                    <BodyText bold>Time</BodyText>
                </Grid>
                <Grid size={{ xs: 12, md: 8, xl: 9 }}>
                    <BodyText>{`${startTime} to ${endTime} PT`}</BodyText>
                </Grid>
            </Grid>
            <Grid container justifyContent="flex-start" size={12} sx={containerStyles}>
                <Button variant="primary" size="large" href={eventItem.url} sx={{ mt: '2em' }}>
                    {eventItem.url_label}
                </Button>
            </Grid>
        </>
    );
};

export default VirtualSession;
