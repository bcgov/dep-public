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

    const iconStyles = {
        display: 'flex',
        marginInlineEnd: '0.8750em',
        fontSize: '1.5em',
        verticalAlign: 'middle',
        width: '1.5rem',
    };

    const rowContainerProps = {
        container: true,
        direction: { xs: 'column', sm: 'row' },
        flexWrap: 'nowrap',
        size: 12,
        justifyContent: 'flex-start',
    } as const;

    const bodyTextProps = { sx: { ml: { xs: 4, sm: 0 } } } as const;

    const headingProps = {
        container: true,
        minWidth: '7.5rem',
        width: '7.5rem',
        gap: 1,
        direction: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'flex-start',
    } as const;

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
            <Grid {...rowContainerProps}>
                <Grid {...headingProps}>
                    <FontAwesomeIcon icon={faLocationDot} style={iconStyles} />
                    <BodyText bold>Location</BodyText>
                </Grid>
                <BodyText {...bodyTextProps}>{eventItem.location_name}</BodyText>
            </Grid>
            <Grid {...rowContainerProps} mb={1}>
                <Grid {...headingProps}>
                    <BodyText bold ml={4}>
                        Address
                    </BodyText>
                </Grid>
                {finalAddress.map((aLine) => {
                    return <BodyText {...bodyTextProps}>{aLine ?? ''}</BodyText>;
                })}
            </Grid>
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
        </Grid>
    );
};

export default InPersonEvent;
