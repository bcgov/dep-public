import React, { useContext, useState } from 'react';
import { BodyText } from 'components/common/Typography';
import { Grid2 as Grid, CircularProgress, Paper } from '@mui/material';
import { WidgetDrawerContext } from './WidgetDrawerContext';
import { WidgetLocation, WidgetType } from 'models/widget';
import { Else, If, Then } from 'react-if';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { optionCardStyle } from './constants';
import { WidgetTabValues } from './type';
import { useCreateWidgetMutation } from 'apiManager/apiSlices/widgets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';
import { useRouteLoaderData } from 'react-router';

interface WidgetOptionCardProps {
    title: string;
    description: string;
    widgetType: WidgetType;
    tabValue: keyof typeof WidgetTabValues;
    icon: IconDefinition;
    successMessage?: string;
    errorMessage?: string;
}

const WidgetOptionCard: React.FC<WidgetOptionCardProps> = ({
    title,
    description,
    widgetType,
    tabValue,
    icon,
    successMessage,
    errorMessage,
}) => {
    const {
        widgets,
        loadWidgets,
        setWidgetDrawerOpen,
        setWidgetDrawerTabValue,
        widgetLocation,
        widgetDetailsTabId,
        isWidgetInScope,
    } = useContext(WidgetDrawerContext);
    const savedEngagement = React.use(
        (useRouteLoaderData('single-engagement') as EngagementLoaderAdminData)?.engagement,
    );
    const dispatch = useAppDispatch();
    const [createWidget] = useCreateWidgetMutation();
    const [isCreatingWidget, setIsCreatingWidget] = useState(false);

    const defaultSuccessMessage = `${title} widget successfully created.`;
    const defaultErrorMessage = `Error occurred while creating ${title.toLowerCase()} widget`;

    const handleCreateWidget = async () => {
        const alreadyExists = widgets.some((widget) => isWidgetInScope(widget) && widget.widget_type_id === widgetType);
        if (alreadyExists) {
            setWidgetDrawerTabValue(WidgetTabValues[tabValue]);
            return;
        }

        // No existing widget, create a new one
        try {
            setIsCreatingWidget(true);
            await createWidget({
                widget_type_id: widgetType,
                engagement_id: savedEngagement.id,
                title: title,
                location: widgetLocation,
                ...(widgetLocation === WidgetLocation.Details && widgetDetailsTabId
                    ? { engagement_details_tab_id: widgetDetailsTabId }
                    : {}),
            }).unwrap();
            await loadWidgets();
            dispatch(
                openNotification({
                    severity: 'success',
                    text: successMessage || defaultSuccessMessage,
                }),
            );
            setIsCreatingWidget(false);
            setWidgetDrawerTabValue(WidgetTabValues[tabValue]);
        } catch {
            setIsCreatingWidget(false);
            dispatch(
                openNotification({
                    severity: 'error',
                    text: errorMessage || defaultErrorMessage,
                }),
            );
            setWidgetDrawerOpen(false);
        }
    };

    return (
        <Paper
            data-testid={`widget-drawer-option/${widgetType}`}
            elevation={1}
            sx={optionCardStyle}
            onClick={handleCreateWidget}
        >
            <If condition={isCreatingWidget}>
                <Then>
                    <Grid container alignItems="center" justifyContent="center" direction="row" height="5.5em">
                        <CircularProgress color="inherit" />
                    </Grid>
                </Then>
                <Else>
                    <Grid
                        container
                        size={12}
                        alignItems="flex-start"
                        justifyContent="flex-start"
                        direction="row"
                        columnSpacing={2}
                    >
                        <Grid size="auto">
                            <FontAwesomeIcon
                                icon={icon}
                                style={{ padding: '10px', fontSize: '1.5rem', color: '#757575' }}
                            />
                        </Grid>
                        <Grid
                            container
                            alignItems="center"
                            justifyContent="center"
                            direction="row"
                            rowSpacing={1}
                            size="grow"
                        >
                            <Grid size={12}>
                                <BodyText size="large" bold>
                                    {title}
                                </BodyText>
                            </Grid>
                            <Grid size={12}>
                                <BodyText size="small">{description}</BodyText>
                            </Grid>
                        </Grid>
                    </Grid>
                </Else>
            </If>
        </Paper>
    );
};

export default WidgetOptionCard;
