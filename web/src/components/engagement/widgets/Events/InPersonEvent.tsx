import React from 'react';
import { EventItem } from 'models/event';
import { Grid2 as Grid } from '@mui/material';
import { formatToPacific } from 'components/common/dateHelper';
import { faLocationDot, faCalendarDays, faClock } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';
import EventRow from 'components/engagement/widgets/Events/EventRow';

export interface EventProps {
    eventItem: EventItem;
}

const InPersonEvent = ({ eventItem }: EventProps) => {
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
        <Grid container direction="column" size={12} gap={1.5} justifyContent="flex-start">
            <EventRow icon={faLocationDot} label="Location">
                <BodyText>{eventItem.location_name}</BodyText>
            </EventRow>
            <EventRow label="Address">
                {finalAddress.map((aLine) => {
                    return <BodyText key={aLine}>{aLine ?? ''}</BodyText>;
                })}
            </EventRow>
            <EventRow icon={faCalendarDays} label="Date">
                <BodyText>{startDate}</BodyText>
            </EventRow>
            <EventRow icon={faClock} label="Time">
                <BodyText>{`${startTime} to ${endTime} PT`}</BodyText>
            </EventRow>
        </Grid>
    );
};

export default InPersonEvent;
