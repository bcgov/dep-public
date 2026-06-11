import React from 'react';
import { Divider, Grid2 as Grid } from '@mui/material';
import { Heading3 } from 'components/common/Typography';
import WidgetOptionCard from './WidgetOptionCard';
import { WidgetType } from 'models/widget';
import {
    faCalendarStar,
    faClapperboardPlay,
    faFileLines,
    faImageLandscape,
    faListTimeline,
    faMapLocationDot,
    faPoll,
    faUserCircle,
} from '@fortawesome/pro-regular-svg-icons';

const WidgetOptionCards = () => {
    return (
        <Grid size={12} container alignItems="stretch" justifyContent={'flex-start'} spacing={3}>
            <Grid size={12}>
                <Heading3>Select Widget</Heading3>
                <Divider sx={{ marginTop: '1em' }} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Who Is Listening"
                    description="Add contacts to this engagement"
                    widgetType={WidgetType.WhoIsListening}
                    tabValue="WHO_IS_LISTENING_FORM"
                    icon={faUserCircle}
                />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Documents"
                    description="Add documents and folders"
                    widgetType={WidgetType.Document}
                    tabValue="DOCUMENT_FORM"
                    icon={faFileLines}
                />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Events"
                    description="Add information about in-person or virtual information sessions"
                    widgetType={WidgetType.Events}
                    tabValue="EVENTS_FORM"
                    icon={faCalendarStar}
                />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Map"
                    description="Add a map with the project location"
                    widgetType={WidgetType.Map}
                    tabValue="MAP_FORM"
                    icon={faMapLocationDot}
                />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Video"
                    description="Embed a video to share information about the project"
                    widgetType={WidgetType.Video}
                    tabValue="VIDEO_FORM"
                    icon={faClapperboardPlay}
                />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Timeline"
                    description="Add a timeline to this engagement"
                    widgetType={WidgetType.Timeline}
                    tabValue="TIMELINE_FORM"
                    icon={faListTimeline}
                />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Poll"
                    description="Add a poll to gather feedback from the public"
                    widgetType={WidgetType.Poll}
                    tabValue="POLL_FORM"
                    icon={faPoll}
                />
            </Grid>
            <Grid size={{ xs: 12, lg: 6, xl: 4 }}>
                <WidgetOptionCard
                    title="Image"
                    description="Displays a static image, with optional caption"
                    widgetType={WidgetType.Image}
                    tabValue="IMAGE_FORM"
                    icon={faImageLandscape}
                />
            </Grid>
        </Grid>
    );
};

export default WidgetOptionCards;
