import React from 'react';
import ReactMapGL, { Marker, NavigationControl, Source, Layer, MapLib } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
import type { LayerSpecification } from 'maplibre-gl';
import { GeoJSON } from 'geojson';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/pro-solid-svg-icons/faLocationDot';
import { BodyText } from 'components/common/Typography/Body';
import { Stack } from '@mui/material';
import { When } from 'react-if';
import { colors, Palette } from 'styles/Theme';

// maplibre-gl loads its worker from import.meta.url, which webpack rewrites to a
// content-hashed asset path; the worker's own relative import of its shared chunk
// doesn't get rewritten to match, so it 404s. CopyWebpackPlugin allows using both files
// unhashed instead (see config/webpack.config.js) and we point the worker to these.
const workerUrl = `${process.env.PUBLIC_URL}/maplibre-gl/maplibre-gl-worker.mjs`;
setWorkerUrl(workerUrl);

interface MapProps {
    latitude: number;
    longitude: number;
    markerLabel?: string;
    geojson?: GeoJSON;
    zoom: number;
}

const layerStyle: LayerSpecification = {
    id: 'fill-layer',
    type: 'fill',
    source: 'geojson-data',
    paint: {
        'fill-color': `${Palette.primary.main}`,
        'fill-opacity': 0.5,
    },
    filter: ['all', ['==', ['geometry-type'], 'Polygon']],
};

//filter enforces that only geojson features that are linestrings use this styling
const lineStyle: LayerSpecification = {
    id: 'lines',
    type: 'line',
    source: 'geojson-data',
    filter: ['all', ['==', ['geometry-type'], 'LineString'], ['!=', ['get', 'type'], 'platform']],
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    paint: {
        'line-width': 1,
        'line-color': `${Palette.primary.main}`,
    },
};
export const MAP_STYLE =
    'https://governmentofbc.maps.arcgis.com/sharing/rest/content/items/bbe05270d3a642f5b62203d6c454f457/resources/styles/root.json';

const MapWithMarkers = ({ geojson, latitude, longitude, markerLabel, zoom }: MapProps) => {
    return (
        <ReactMapGL
            id="map-gl-container"
            initialViewState={{
                longitude: longitude,
                latitude: latitude,
                zoom: zoom,
            }}
            mapLib={maplibregl as unknown as MapLib}
            mapStyle={MAP_STYLE}
            style={{
                width: '100%',
                height: '100%',
            }}
        >
            <NavigationControl />
            <When condition={Boolean(geojson)}>
                <Source id="geojson-data" type="geojson" data={geojson ?? { type: 'FeatureCollection', features: [] }}>
                    <Layer {...layerStyle} />
                    <Layer {...lineStyle} />
                </Source>
            </When>
            <Marker latitude={latitude} longitude={longitude} anchor="bottom">
                <Stack direction="column" alignItems="center" justifyContent="center">
                    <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: '22px', color: 'red' }} />
                    <When condition={Boolean(markerLabel)}>
                        <BodyText
                            size="small"
                            bold
                            bgcolor={'#12508F'}
                            style={{ color: colors.surface.white, padding: '1px 4px' }}
                            borderRadius="10px"
                            padding="0 2px 0 2px"
                        >
                            {markerLabel}
                        </BodyText>
                    </When>
                </Stack>
            </Marker>
        </ReactMapGL>
    );
};
export default MapWithMarkers;
