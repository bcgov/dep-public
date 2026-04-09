import React from 'react';
import { BodyText } from 'components/common/Typography/Body';
import { Grid2 as Grid, CircularProgress, Stack, IconButton, Paper } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/pro-regular-svg-icons/faPen';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons/faCircleXmark';
import { If, Then, Else } from 'react-if';
import { WidgetType } from 'models/widget';
import {
    faImageLandscape,
    faIdCard,
    faFileLines,
    faEnvelopeOpenText,
    faCalendarStar,
    faMapLocationDot,
    faClapperboardPlay,
    faListTimeline,
    faPoll,
} from '@fortawesome/pro-regular-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface WidgetProps {
    testId?: string;
    widgetTypeId: WidgetType;
    title: string;
    children?: React.ReactNode;
    [prop: string]: unknown;
    onEdit?: () => void;
    onDelete: () => void;
    deleting?: boolean;
    sortable?: boolean;
}

const icons: Record<WidgetType, IconDefinition> = {
    [WidgetType.Image]: faImageLandscape,
    [WidgetType.WhoIsListening]: faIdCard,
    [WidgetType.Document]: faFileLines,
    [WidgetType.Subscribe]: faEnvelopeOpenText,
    [WidgetType.Events]: faCalendarStar,
    [WidgetType.Map]: faMapLocationDot,
    [WidgetType.Video]: faClapperboardPlay,
    [WidgetType.Timeline]: faListTimeline,
    [WidgetType.Poll]: faPoll,
};

const WidgetPanel = ({
    testId,
    widgetTypeId,
    children,
    title,
    onEdit,
    onDelete,
    deleting,
    sortable = true,
    ...rest
}: WidgetProps) => {
    return (
        <Paper>
            <Grid p={2} container alignItems="flex-start" justifyContent="flex-start">
                <Grid size="auto">
                    <FontAwesomeIcon icon={icons[widgetTypeId]} style={{ fontSize: '24px', marginRight: '12px' }} />
                </Grid>
                <Grid container direction="row" alignItems="center" justifyContent="flex-start" size="grow">
                    <BodyText bold>{title}</BodyText>
                </Grid>
                <Grid size="auto" container direction="row" alignItems="flex-start" justifyContent="center">
                    <Stack direction="row" spacing={1}>
                        <If condition={!!onEdit}>
                            <Then>
                                <IconButton
                                    sx={{ margin: 0, padding: 0 }}
                                    color="inherit"
                                    onClick={onEdit}
                                    data-testid="widget/edit"
                                >
                                    <FontAwesomeIcon icon={faPen} style={{ fontSize: '22px' }} />
                                </IconButton>
                            </Then>
                            <Else>
                                <IconButton
                                    sx={{ p: 1.5 }}
                                    color="inherit"
                                    onClick={onEdit}
                                    data-testid="widget/edit"
                                ></IconButton>
                            </Else>
                        </If>
                        <IconButton
                            sx={{ margin: 0, padding: 0 }}
                            color="inherit"
                            onClick={onDelete}
                            data-testid={`widget/remove-${testId}`}
                        >
                            {deleting ? (
                                <CircularProgress size="1em" color="inherit" />
                            ) : (
                                <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '22px' }} />
                            )}
                        </IconButton>
                    </Stack>
                </Grid>
                <Grid size={12}>{children}</Grid>
            </Grid>
        </Paper>
    );
};

export default WidgetPanel;
