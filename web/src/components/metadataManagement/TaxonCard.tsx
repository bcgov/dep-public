import {
    Grid2 as Grid,
    Paper,
    Tooltip,
    Chip,
    IconButton,
    Collapse,
    Avatar,
    Badge,
    Typography,
    Skeleton,
    Stack,
    Divider,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import { faGripDotsVertical } from '@fortawesome/pro-solid-svg-icons/faGripDotsVertical';
import React from 'react';
import { BodyText, Heading3 } from 'components/common/Typography';
import { TaxonTypes } from './TaxonTypes';
import { TaxonCardProps } from './types';
import { Draggable, DraggableProvided } from '@hello-pangea/dnd';
import { MetadataFilterTypes } from './MetadataFilterTypes';
import {
    faTag,
    faTags,
    faFilter,
    faShieldCheck,
    faBlockQuote,
    faFilterSlash,
    IconDefinition,
    faPlus,
} from '@fortawesome/pro-regular-svg-icons';

const DetailsRow = ({ name, icon, children }: { name: string; icon: IconDefinition; children: React.ReactNode }) => {
    return (
        <>
            <Grid size={12}>
                <Divider />
            </Grid>
            <Grid size="auto">
                <Tooltip title={name} placement="top">
                    <Avatar sx={{ bgcolor: 'text.secondary', height: 40, width: 40 }}>
                        <FontAwesomeIcon icon={icon} style={{ fontSize: '22px' }} />
                    </Avatar>
                </Tooltip>
            </Grid>
            <Grid size="grow">{children}</Grid>
        </>
    );
};

export const TaxonCard: React.FC<TaxonCardProps> = ({ taxon, isExpanded, onExpand, isSelected, onSelect, index }) => {
    const handleExpand = (clickEvent: React.MouseEvent<HTMLElement>) => {
        clickEvent.stopPropagation();
        onExpand(taxon);
    };

    const taxonType = TaxonTypes[taxon.data_type ?? 'text'];

    const taxonTypeIcon = () => {
        return (
            <Tooltip
                placement="top"
                title={`${taxonType.name} ${!taxon.one_per_engagement ? '(select multiple)' : ''}`}
            >
                <Badge
                    color="primary"
                    badgeContent={
                        <FontAwesomeIcon icon={faPlus} style={{ fontSize: '12px', color: 'inherit', margin: '-2px' }} />
                    }
                    invisible={!taxonType.supportsMulti || taxon.one_per_engagement}
                >
                    <Avatar
                        variant="rounded"
                        sx={{
                            bgcolor: 'primary.light',
                            height: { xs: '30px', sm: '40px' },
                            width: { xs: '30px', sm: '40px' },
                        }}
                    >
                        <FontAwesomeIcon icon={taxonType.icon} style={{ fontSize: '22px' }} />
                    </Avatar>
                </Badge>
            </Tooltip>
        );
    };

    return (
        <Draggable key={taxon.id} draggableId={taxon.id.toString()} index={index}>
            {(provided: DraggableProvided) => (
                <Grid
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                    size={12}
                    onClick={() => onSelect(taxon)}
                    component={Paper}
                    style={{
                        display: 'flex',
                        alignItems: 'center', // Center items vertically
                        padding: '10px',
                        width: '100%',
                        marginBottom: '1em',
                        cursor: 'pointer',
                        ...provided.draggableProps.style,
                    }}
                    elevation={isSelected ? 3 : 1}
                    container
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    aria-label="A card representing a taxon in the engagement metadata."
                    role="gridcell"
                    id={`taxon-${taxon.id}`}
                >
                    <Grid container size={12} alignItems="center" spacing={{ xs: 1, sm: 2 }} direction="row">
                        <Grid size="auto" ml={1}>
                            <Tooltip color="error" title="Drag to reorganize" placement="top" id="drag-handle-tooltip">
                                <IconButton
                                    sx={{ cursor: 'grab', color: 'inherit' }}
                                    {...provided.dragHandleProps}
                                    size="small"
                                    aria-label="Drag to reorganize; press to select and edit this taxon."
                                    // this button doubles as a keyboard focus target for the card
                                >
                                    <FontAwesomeIcon
                                        icon={faGripDotsVertical}
                                        style={{ fontSize: '24px', margin: '0px 4px' }}
                                    />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Grid size="auto">{taxonTypeIcon()}</Grid>
                        <Grid size="grow">
                            <Heading3
                                bold
                                sx={{
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    width: '100%',
                                    maxHeight: '1.5em',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {taxon.name}
                            </Heading3>
                        </Grid>
                        <Grid size="auto" mr={2}>
                            <IconButton
                                sx={{
                                    transition: (theme) =>
                                        theme.transitions.create('transform', {
                                            duration: theme.transitions.duration.shortest,
                                        }),
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',

                                    color: 'inherit',
                                }}
                                size="small"
                                aria-label="expand"
                                onClick={handleExpand}
                                aria-expanded={isExpanded}
                                aria-controls={`taxon-${taxon.id}-content`}
                            >
                                <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '20px' }} />
                            </IconButton>
                        </Grid>
                    </Grid>
                    <Grid size={12}>
                        <Collapse
                            in={isExpanded}
                            timeout="auto"
                            unmountOnExit
                            sx={{ pt: 1 }}
                            id={`taxon-${taxon.id}-content`}
                            aria-labelledby={`taxon-${taxon.id}`}
                            aria-hidden={!isExpanded}
                        >
                            <Grid container alignItems="center" spacing={1} flexWrap="wrap">
                                {/* Description */}
                                <DetailsRow name="Description" icon={faBlockQuote}>
                                    <BodyText pl={1} sx={{ fontStyle: 'italic', wordWrap: 'break-word' }}>
                                        {taxon.description || 'No description provided.'}
                                    </BodyText>
                                </DetailsRow>

                                {/* Validation */}
                                <DetailsRow name="Validation" icon={faShieldCheck}>
                                    <Typography variant="body1" pl={1}>
                                        {taxon.freeform
                                            ? `Any ${taxonType.name.toLowerCase()} value can be added to this field. `
                                            : 'Users must select from the following options:'}
                                    </Typography>
                                    {taxon.freeform && (taxon.preset_values?.length ?? 0) > 0 && (
                                        <Typography variant="body1" pl={1}>
                                            These preset values will be offered as suggestions:
                                        </Typography>
                                    )}
                                    {(taxon.preset_values?.length ?? 0) > 0 && (
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            {taxon.preset_values?.map((chip) => (
                                                <Chip
                                                    key={chip}
                                                    label={chip}
                                                    size="small"
                                                    sx={{ margin: '2px !important' }}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                </DetailsRow>
                                <DetailsRow name="Cardinality" icon={taxon.one_per_engagement ? faTag : faTags}>
                                    {/* Cardinality */}
                                    <Typography variant="body1" pl={1}>
                                        {taxon.one_per_engagement
                                            ? 'One value per engagement.'
                                            : 'Unlimited values per engagement.'}
                                    </Typography>
                                </DetailsRow>

                                {/* Filterability */}
                                {Boolean(taxonType.supportedFilters) && (
                                    <DetailsRow
                                        name="Filterability"
                                        icon={taxon.filter_type ? faFilter : faFilterSlash}
                                    >
                                        <Typography variant="body1" pl={1}>
                                            {taxon.filter_type
                                                ? `${MetadataFilterTypes[taxon.filter_type].name}:`
                                                : 'Filtering by this field is turned off.'}
                                        </Typography>
                                        {taxon.filter_type && (
                                            <Typography variant="body1" pl={1}>
                                                {MetadataFilterTypes[taxon.filter_type].details}
                                            </Typography>
                                        )}
                                    </DetailsRow>
                                )}
                            </Grid>
                        </Collapse>
                    </Grid>
                </Grid>
            )}
        </Draggable>
    );
};

export default TaxonCard;

export const TaxonCardSkeleton: React.FC = () => {
    return (
        <Grid
            mr={2}
            size={12}
            component={Paper}
            style={{
                display: 'flex',
                boxSizing: 'border-box',
                alignItems: 'center', // Center items vertically
                padding: '10px',
                width: '100%',
                height: '62px',
                marginBottom: '1em',
            }}
            elevation={1}
        >
            <Grid
                ml={1}
                container
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ width: '100%', p: 0.1 }}
            >
                <Grid container size={12} alignItems="center" spacing={{ xs: 1, sm: 2 }} direction="row">
                    <Grid size="auto">
                        <IconButton color="inherit" size="small">
                            <FontAwesomeIcon
                                icon={faGripDotsVertical}
                                style={{ fontSize: '24px', margin: '0px 4px' }}
                            />
                        </IconButton>
                    </Grid>
                    <Grid size="auto">
                        <Skeleton variant="rectangular" width={40} height={40} />
                    </Grid>
                    <Grid size="grow">
                        <Skeleton variant="text" width={Math.random() * 50 + 10 + '%'} />
                    </Grid>
                    <Grid size="auto" mr={2} justifySelf="flex-end">
                        <IconButton color="inherit" size="small" aria-label="expand">
                            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '20px' }} />
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};
