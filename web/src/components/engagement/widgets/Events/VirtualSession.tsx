import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { formatToPacific } from 'components/common/dateHelper';
import { EventProps } from './InPersonEvent';
import { faCalendarDays, faClock } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';
import { Button } from 'components/common/Input/Button';
import EventRow from 'components/engagement/widgets/Events/EventRow';

const VirtualSession = ({ eventItem }: EventProps) => {
    // Define time/date
    const startDate = formatToPacific(eventItem.start_date, 'DD MMM, YYYY');
    const startTime = formatToPacific(eventItem.start_date, 'h:mm a');
    const endTime = formatToPacific(eventItem.end_date, 'h:mm a');

    return (
        <Grid container direction="column" size={12} gap={1.5} justifyContent="flex-start">
            <EventRow icon={faCalendarDays} label="Date">
                <BodyText>{startDate}</BodyText>
            </EventRow>
            <EventRow icon={faClock} label="Time">
                <BodyText>{`${startTime} to ${endTime} PT`}</BodyText>
            </EventRow>
            <Button variant="primary" size="large" href={eventItem.url} sx={{ width: 'max-content', mt: '1.5rem' }}>
                {eventItem.url_label}
            </Button>
        </Grid>
    );
};

export default VirtualSession;
