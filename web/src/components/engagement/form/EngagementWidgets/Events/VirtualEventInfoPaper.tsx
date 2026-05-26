import React, { useContext } from 'react';
import { Grid2 as Grid, IconButton, Paper } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripDotsVertical } from '@fortawesome/pro-solid-svg-icons/faGripDotsVertical';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons/faCircleXmark';
import { faPen } from '@fortawesome/pro-regular-svg-icons/faPen';
import { When } from 'react-if';
import { formatToPacific } from 'components/common/dateHelper';
import { EventInfoPaperProps } from './EventInfoPaper';
import { EventsContext } from './EventsContext';
import { BodyText } from 'components/common/Typography/Body';

const VirtualEventInfoPaper = ({ event, removeEvent, ...rest }: EventInfoPaperProps) => {
    const eventItem = event.event_items[0];
    const { handleChangeEventToEdit, handleEventDrawerOpen } = useContext(EventsContext);

    return (
        <Paper elevation={3}>
            <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start">
                <Grid size={1}>
                    <IconButton sx={{ padding: 0, margin: 0 }} color="inherit" aria-label="drag-indicator">
                        <FontAwesomeIcon icon={faGripDotsVertical} style={{ fontSize: '24px', margin: '0px 4px' }} />
                    </IconButton>
                </Grid>

                <Grid
                    size={9.5}
                    container
                    direction="row"
                    alignItems={'flex-start'}
                    justifyContent="flex-start"
                    spacing={1}
                >
                    <When condition={!!eventItem.event_name}>
                        <Grid size={3}>
                            <BodyText>Name:</BodyText>
                        </Grid>
                        <Grid size={9}>
                            <BodyText overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
                                {eventItem.event_name}
                            </BodyText>
                        </Grid>
                    </When>
                    <When condition={!!eventItem.description}>
                        <Grid size={3}>
                            <BodyText>Description:</BodyText>
                        </Grid>
                        <Grid size={9}>
                            <BodyText overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
                                {eventItem.description}
                            </BodyText>
                        </Grid>
                    </When>
                    <Grid size={3}>
                        <BodyText>Date:</BodyText>
                    </Grid>
                    <Grid size={9}>
                        <BodyText overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
                            {formatToPacific(eventItem.start_date, 'MMMM DD, YYYY')}
                        </BodyText>
                    </Grid>

                    <Grid size={3}>
                        <BodyText>Time:</BodyText>
                    </Grid>
                    <Grid size={9}>
                        <BodyText overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
                            {`${formatToPacific(eventItem.start_date, 'h:mm a')} to ${formatToPacific(
                                eventItem.end_date,
                                'h:mm a',
                            )} PT`}
                        </BodyText>
                    </Grid>
                    <Grid size={3}>
                        <BodyText>Link: </BodyText>
                    </Grid>

                    <Grid size={9}>
                        <BodyText overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
                            {eventItem.url} - {eventItem.url_label}
                        </BodyText>
                    </Grid>
                </Grid>
                <Grid container size={1.5}>
                    <Grid size={6}>
                        <IconButton
                            onClick={() => {
                                handleChangeEventToEdit(event);
                                handleEventDrawerOpen(event.type, true);
                            }}
                            sx={{ padding: 1, margin: 0 }}
                            color="inherit"
                            aria-label="edit-icon"
                        >
                            <FontAwesomeIcon icon={faPen} style={{ fontSize: '22px' }} />
                        </IconButton>
                    </Grid>
                    <Grid size={6}>
                        <IconButton
                            onClick={() => removeEvent(event.id)}
                            sx={{ padding: 1, margin: 0 }}
                            color="inherit"
                            aria-label="delete-icon"
                        >
                            <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '22px' }} />
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default VirtualEventInfoPaper;
