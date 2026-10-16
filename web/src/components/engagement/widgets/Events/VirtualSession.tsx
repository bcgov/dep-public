import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { formatToPacific } from 'components/common/dateHelper';
import { EventProps } from './InPersonEvent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faClock } from '@fortawesome/pro-regular-svg-icons';
import { BodyText } from 'components/common/Typography/Body';
import { Button } from 'components/common/Input/Button';

const VirtualSession = ({ eventItem }: EventProps) => {
    // Styles

    const iconStyles = {
        display: 'flex',
        fontSize: '1.5em',
        verticalAlign: 'middle',
        width: '1.5rem',
    };

    const rowContainerProps = {
        container: true,
        direction: { xs: 'column', sm: 'row' },
        size: 12,
        justifyContent: 'flex-start',
    } as const;

    const bodyTextProps = { sx: { ml: { xs: 4, sm: 0 } } } as const;

    const headingProps = {
        container: true,
        width: '5.5rem',
        gap: 1,
        direction: 'row',
        flexWrap: 'nowrap',
    } as const;

    // Define time/date
    const startDate = formatToPacific(eventItem.start_date, 'DD MMM, YYYY');
    const startTime = formatToPacific(eventItem.start_date, 'h:mm a');
    const endTime = formatToPacific(eventItem.end_date, 'h:mm a');

    return (
        <>
            <Grid container direction="column" size={12} gap={1.5} justifyContent="flex-start">
                <Grid {...rowContainerProps}>
                    <Grid {...headingProps}>
                        <FontAwesomeIcon icon={faCalendarDays} style={iconStyles} />
                        <BodyText bold>Date</BodyText>
                    </Grid>
                    <BodyText {...bodyTextProps}>{startDate}</BodyText>
                </Grid>
                <Grid {...rowContainerProps}>
                    <Grid {...headingProps}>
                        <FontAwesomeIcon icon={faClock} style={iconStyles} />
                        <BodyText bold>Time</BodyText>
                    </Grid>
                    <BodyText {...bodyTextProps}>{`${startTime} to ${endTime} PT`}</BodyText>
                </Grid>
                <Grid {...rowContainerProps}>
                    <Button variant="primary" size="large" href={eventItem.url} sx={{ mt: '1em' }}>
                        {eventItem.url_label}
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

export default VirtualSession;
