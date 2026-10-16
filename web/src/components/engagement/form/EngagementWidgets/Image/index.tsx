import React, { Suspense, useContext } from 'react';
import Form from './Form';
import { Grid2 as Grid } from '@mui/material';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import { WidgetType } from 'models/widget';
import { fetchImageWidgets } from 'services/widgetService/ImageService';
import { Await } from 'react-router';
import { MidScreenLoader } from 'components/common';

export const ImageForm = () => {
    const { widgets, isWidgetInScope } = useContext(WidgetDrawerContext);
    const widget =
        widgets.find((widget) => widget.widget_type_id === WidgetType.Image && isWidgetInScope(widget)) ?? null;
    const imageWidget = widget
        ? fetchImageWidgets(widget.id).then((result) => (result.length ? result[result.length - 1] : null))
        : Promise.resolve(null);
    const widgetBundle = Promise.all([widget, imageWidget]);
    return (
        <Suspense fallback={<LoadingCard />}>
            <Await resolve={widgetBundle}>
                <Form />
            </Await>
        </Suspense>
    );
};

const LoadingCard = () => (
    <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start" spacing={2}>
        <Grid size={12}>
            <MidScreenLoader />
        </Grid>
    </Grid>
);

export default ImageForm;
