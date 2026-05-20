import React, { useRef, useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import { Box, Paper, Grid2 as Grid } from '@mui/material';
import MapWithMarkers from 'components/map';
import { WidgetMap } from 'models/widgetMap';
import { Button } from 'components/common/Input/Button';
import { geoJSONDecode, calculateZoomLevel } from 'components/engagement/form/EngagementWidgets/Map/utils';

interface ExpandModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    map: WidgetMap | null;
    markerLabel?: string;
}

export const ExpandModal = ({ open, setOpen, map, markerLabel }: ExpandModalProps) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [mapWidth, setMapWidth] = useState(250);
    const [mapHeight, setMapHeight] = useState(250);

    useEffect(() => {
        if (mapContainerRef.current) {
            setMapWidth(mapContainerRef.current.clientWidth);
            setMapHeight(mapContainerRef.current.clientHeight);
        }
    }, []);

    if (!map) {
        return null;
    }

    return (
        <Modal
            open={open}
            onClose={() => {
                setOpen(false);
            }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            keepMounted={false}
        >
            <Paper
                style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                }}
            >
                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    sx={{
                        width: '80vw',
                        height: '75vh',
                    }}
                >
                    <Grid>
                        <Box
                            ref={mapContainerRef}
                            sx={{
                                width: '80vw',
                                height: '65vh',
                            }}
                        >
                            <MapWithMarkers
                                geojson={geoJSONDecode(map.geojson)}
                                longitude={map.longitude}
                                latitude={map.latitude}
                                markerLabel={markerLabel ?? map.marker_label}
                                zoom={calculateZoomLevel(mapWidth, mapHeight, geoJSONDecode(map.geojson))}
                            />
                        </Box>
                    </Grid>
                    <Grid size={12} container justifyContent="flex-end" padding={2}>
                        <Grid>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setOpen(false);
                                }}
                            >
                                Close
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Modal>
    );
};
