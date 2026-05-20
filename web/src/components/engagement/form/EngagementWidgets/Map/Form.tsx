import React, { useContext, useState, useEffect } from 'react';
import Divider from '@mui/material/Divider';
import { Grid2 as Grid, Typography, Stack, IconButton, Paper } from '@mui/material';
import { MidScreenLoader } from 'components/common';
import { Button } from 'components/common/Input/Button';
import { BodyText } from 'components/common/Typography/Body';
import { useForm, FormProvider, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from 'hooks';
import ControlledTextField from 'components/common/ControlledInputComponents/ControlledTextField';
import { openNotification } from 'services/notificationService/notificationSlice';
import { MapContext } from './MapContext';
import { postMap, previewShapeFile } from 'services/widgetService/MapService';
import { WidgetDrawerContext } from '../WidgetDrawerContext';
import ShapeFileUpload from 'components/engagement/form/EngagementWidgets/Map/ShapeFileUpload/FileUpload';
import { geoJSONDecode } from './utils';
import { GeoJSON } from 'geojson';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkSimple } from '@fortawesome/pro-regular-svg-icons/faLinkSimple';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons/faCircleXmark';
import { When } from 'react-if';
import * as turf from '@turf/turf';
import { WidgetTitle } from '../WidgetTitle';
import { WidgetLocation } from 'models/widget';
import { useParams } from 'react-router';
import {
    getEngagementContentTranslationsByCode,
    syncEngagementContentTranslationsByCode,
} from 'services/engagementContentTranslationService';

const schema = yup
    .object({
        markerLabel: yup.string().max(30, 'Marker label cannot exceed 30 characters'),
        shapefile: yup.mixed(),
        geojson: yup.mixed(),
        latitude: yup
            .number()
            .typeError('Invalid value for Latitude')
            .required('Latitude is required')
            .min(-90, 'Latitude must be greater than or equal to -90')
            .max(90, 'Latitude must be less than or equal to 90'),
        longitude: yup
            .number()
            .typeError('Invalid value for Longitude')
            .required('Longitude is required')
            .min(-180, 'Longitude must be greater than or equal to -180')
            .max(180, 'Longitude must be less than or equal to 180'),
        filename: yup.string().nullable(),
    })
    .required();

type DetailsForm = yup.TypeOf<typeof schema>;

const Form = () => {
    const dispatch = useAppDispatch();
    const { widget, mapData, isLoadingMap, setPreviewMapOpen, setPreviewMap, updateZoom } = useContext(MapContext);
    const { setWidgetDrawerOpen } = useContext(WidgetDrawerContext);
    const { languageCode } = useParams<{ languageCode?: string }>();
    const activeLanguageCode = (languageCode ?? 'en').toLowerCase();
    const [isCreating, setIsCreating] = useState(false);
    const [uploadName, setUploadName] = useState('');
    const [calculatingZoom, setCalculatingZoom] = useState(false);

    const methods = useForm<DetailsForm>({
        resolver: yupResolver(schema) as unknown as Resolver<DetailsForm>,
    });

    useEffect(() => {
        if (!mapData || !widget) {
            return;
        }
        const initializeForm = async () => {
            methods.setValue('latitude', mapData.latitude || undefined);
            methods.setValue('longitude', mapData.longitude || undefined);
            methods.setValue('geojson', geoJSONDecode(mapData.geojson) ?? undefined);
            methods.setValue('filename', mapData.file_name ?? undefined);

            if (activeLanguageCode === 'en') {
                methods.setValue('markerLabel', mapData.marker_label || '');
                return;
            }

            const contentTranslations = await getEngagementContentTranslationsByCode(
                widget.engagement_id,
                activeLanguageCode,
            );
            const widgetTranslation = contentTranslations.widgets.find((t) => t.widget_id === widget.id);
            methods.setValue('markerLabel', widgetTranslation?.map_marker_label ?? mapData.marker_label ?? '');
        };
        initializeForm();
    }, [mapData, activeLanguageCode, widget?.id]);

    const { handleSubmit, reset, trigger, watch } = methods;

    const [longitude, latitude, markerLabel, geojson, shapefile, filename] = watch([
        'longitude',
        'latitude',
        'markerLabel',
        'geojson',
        'shapefile',
        'filename',
    ]);

    const createMap = async (data: DetailsForm) => {
        if (!widget) {
            return;
        }

        const validatedData = await schema.validate(data);
        const { latitude, longitude, markerLabel, shapefile } = validatedData;
        await postMap(widget.id, {
            widget_id: widget.id,
            engagement_id: widget.engagement_id,
            marker_label: markerLabel,
            longitude: longitude,
            latitude: latitude,
            file: shapefile,
            location: widget.location in WidgetLocation ? widget.location : null,
        });
        dispatch(openNotification({ severity: 'success', text: 'A new map was successfully added' }));
    };

    const saveMarkerLabelTranslation = async (markerLabel: string | undefined) => {
        if (!widget) {
            return;
        }
        const existingContentTranslations = await getEngagementContentTranslationsByCode(
            widget.engagement_id,
            activeLanguageCode,
        );
        const existingTranslation = existingContentTranslations.widgets.find((t) => t.widget_id === widget.id);
        const nextTranslations = existingTranslation
            ? existingContentTranslations.widgets.map((t) =>
                  t.widget_id === widget.id ? { ...t, map_marker_label: markerLabel } : t,
              )
            : [...existingContentTranslations.widgets, { widget_id: widget.id, map_marker_label: markerLabel }];
        await syncEngagementContentTranslationsByCode(widget.engagement_id, activeLanguageCode, {
            widgets: nextTranslations,
        });
        dispatch(
            openNotification({ severity: 'success', text: 'Map marker label translation was successfully saved' }),
        );
    };

    const onSubmit: SubmitHandler<DetailsForm> = async (data: DetailsForm) => {
        if (!widget) {
            return;
        }
        try {
            setIsCreating(true);
            if (activeLanguageCode == 'en') {
                await createMap(data);
            } else {
                const validatedData = await schema.validate(data);
                await saveMarkerLabelTranslation(validatedData.markerLabel);
            }
            setIsCreating(false);
            reset({});
            setWidgetDrawerOpen(false);
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'An error occurred while trying to save map' }));
            setIsCreating(false);
        }
    };

    const handlePreviewMap = async () => {
        const valid = await trigger(['latitude', 'longitude', 'markerLabel', 'shapefile']);
        const validatedData = await schema.validate({ latitude, longitude, markerLabel, geojson, shapefile });
        let previewGeoJson: turf.AllGeoJSON | GeoJSON | undefined;
        if (!valid) {
            return;
        }
        if (shapefile) {
            previewGeoJson = await previewShapeFile({
                file: shapefile,
            });
            updateZoom(previewGeoJson);
        }
        setPreviewMap({
            longitude: validatedData.longitude,
            latitude: validatedData.latitude,
            markerLabel: validatedData.markerLabel,
            geojson: previewGeoJson ?? validatedData.geojson,
        });
        setPreviewMapOpen(true);
    };

    const handleAddFile = async (files: File[]) => {
        let previewGeoJson: turf.AllGeoJSON | GeoJSON | undefined;
        if (files.length > 0) {
            methods.setValue('shapefile', files[0]);
            previewGeoJson = await previewShapeFile({
                file: files[0],
            });
            setCalculatingZoom(true);
            updateZoom(previewGeoJson);
            const centerPoint = turf.center(previewGeoJson);
            methods.setValue('longitude', centerPoint.geometry.coordinates[0]);
            methods.setValue('latitude', centerPoint.geometry.coordinates[1]);
            setCalculatingZoom(false);
            return;
        }
        methods.setValue('shapefile', undefined);
        setUploadName('');
    };

    if (isLoadingMap) {
        return (
            <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start" spacing={2}>
                <Grid size={12}>
                    <MidScreenLoader />
                </Grid>
            </Grid>
        );
    }

    if (!widget) {
        return null;
    }

    return (
        <Grid size={12} container alignItems="flex-start" justifyContent={'flex-start'} spacing={3}>
            <Grid size={12}>
                <WidgetTitle widget={widget} />
                <Divider sx={{ marginTop: '0.5em' }} />
            </Grid>
            <Grid size={12}>
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container direction="row" alignItems="baseline" justifyContent="flex-start" spacing={2}>
                            <Grid size={12}>
                                <ShapeFileUpload
                                    data-testid="shapefile-upload"
                                    handleAddFile={handleAddFile}
                                    savedFileName={uploadName}
                                    savedFile={methods.getValues('shapefile')}
                                    aria-label={'Upload a shape file.'}
                                />
                            </Grid>

                            <When condition={Boolean(filename)}>
                                <Grid size={12}>
                                    <BodyText bold mb="2px">
                                        File Uploaded
                                    </BodyText>
                                    <Paper elevation={1} sx={{ width: '100%' }}>
                                        <Grid
                                            container
                                            direction="row"
                                            alignItems={'center'}
                                            justifyContent="flex-start"
                                        >
                                            <Grid size="auto">
                                                <Stack spacing={2} direction="row" alignItems="center">
                                                    <FontAwesomeIcon
                                                        icon={faLinkSimple}
                                                        style={{ fontSize: '22px', color: '#757575' }}
                                                    />
                                                    <Typography>{mapData?.file_name}</Typography>
                                                </Stack>
                                            </Grid>
                                            <IconButton
                                                onClick={() => {
                                                    methods.setValue('filename', undefined);
                                                    methods.setValue('geojson', undefined);
                                                }}
                                                sx={{ padding: 0, margin: 0 }}
                                                color="inherit"
                                                aria-label="Remove GeoJSON"
                                            >
                                                <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '22px' }} />
                                            </IconButton>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            </When>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Latitude (Required)
                                </BodyText>
                                <BodyText>Latitude in British Columbia is between 48.30 and 60.00</BodyText>
                                <ControlledTextField
                                    name="latitude"
                                    aria-label={
                                        'Latitude: Latitude in British Columbia is between 48.30 and 60.00. Required field, numeric value with up to two decimal places.'
                                    }
                                />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Longitude (Required)
                                </BodyText>
                                <BodyText>Longitude in British Columbia is between  -139.06 and -114.03</BodyText>
                                <ControlledTextField
                                    name="longitude"
                                    aria-label={
                                        'Longitude: Longitude in British Columbia is between -139.06 and -114.03. Required field, numeric value with up to two decimal places.'
                                    }
                                />
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold mb="2px">
                                    Marker Label (Optional)
                                </BodyText>
                                <BodyText>This text will appear next to your marker on the map</BodyText>
                                <ControlledTextField
                                    name="markerLabel"
                                    aria-label="Marker label: This text will appear next to your marker on the map. Optional field, maximum 30 characters."
                                />
                            </Grid>
                            <Grid size={12} container direction="row" justifyContent={'flex-end'}>
                                <Grid>
                                    <Button loading={calculatingZoom} onClick={handlePreviewMap}>
                                        Preview Map
                                    </Button>
                                </Grid>
                            </Grid>
                            <Grid
                                size={12}
                                container
                                direction="row"
                                spacing={1}
                                justifyContent={'flex-start'}
                                marginTop="2em"
                            >
                                <Grid>
                                    <Button variant="primary" type="submit" loading={isCreating}>
                                        Save &amp; Close
                                    </Button>
                                </Grid>
                                <Grid>
                                    <Button onClick={() => setWidgetDrawerOpen(false)}>Cancel</Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </form>
                </FormProvider>
            </Grid>
        </Grid>
    );
};

export default Form;
