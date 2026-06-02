import React from 'react';
import { EventItem } from 'models/event';
import { Grid2 as Grid } from '@mui/material';
import { formatToPacific } from 'components/common/dateHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faCalendarDays, faClock } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';

export interface EventProps {
    eventItem: EventItem;
}

const InPersonEvent = ({ eventItem }: EventProps) => {
    // Define styles
    const containerStyles = {
        // alignItems: 'center',
        paddingLeft: '0 !important',
    };
    const iconStyles = {
        display: 'flex',
        marginRight: '0.8750em',
        fontSize: '1.5em',
        width: '1em',
        verticalAlign: 'middle',
    };

    // Parse the address into multiple lines
    const parsedAddress = eventItem.location_address?.split(',') || [''];
    const finalAddress = parsedAddress.every((val) => val === '')
        ? parsedAddress
        : parsedAddress.map((line, index) => (parsedAddress.length - 1 === index ? line : line + ','));

    // Create start and end time/date
    const startDate = formatToPacific(eventItem.start_date, 'DD MMM, YYYY');
    const startTime = formatToPacific(eventItem.start_date, 'h:mm a');
    const endTime = formatToPacific(eventItem.end_date, 'h:mm a');

    return (
        <>
            <Grid container justifyContent="flex-start" size={12} sx={containerStyles} marginBottom={1}>
                <Grid container size={12}>
                    <Grid size={{ xs: 0, md: 1 }} style={{ maxWidth: '2rem' }}>
                        <FontAwesomeIcon icon={faLocationDot} style={iconStyles} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3, xl: 2 }}>
                        <BodyText bold>Location</BodyText>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8, xl: 8 }}>
                        <BodyText sx={{ mb: 'inherit' }}>{eventItem.location_name}</BodyText>
                    </Grid>
                </Grid>
                <Grid container size={12}>
                    <Grid size={{ xs: 0, md: 1 }} style={{ maxWidth: '2rem' }}>
                        <div style={{ opacity: 0, ...iconStyles }}></div>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3, xl: 2 }} alignSelf="flex-start">
                        <BodyText bold>Address</BodyText>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8, xl: 8 }}>
                        {finalAddress.map((aLine) => {
                            return <BodyText>{aLine ?? ''}</BodyText>;
                        })}
                    </Grid>
                </Grid>
            </Grid>
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
        </>
    );
};

export default InPersonEvent;
