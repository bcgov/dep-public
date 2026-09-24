import React, { ReactElement, useEffect, useState } from 'react';
import { BodyText, Heading2 } from 'components/common/Typography';
import { Box, Grid2 as Grid, MenuItem, Modal, Select, Switch as MUISwitch, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { createSearchParams, Form, useFetcher, useParams, useRouteLoaderData } from 'react-router';
import { Button } from 'components/common/Input/Button';
import { EngagementLoaderAdminData } from '../EngagementLoaderAdmin';
import { MetadataTaxon } from 'models/engagement';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { AlertColor } from 'services/notificationService/types';
import { ROUTES, getPath } from 'routes/routes';
import { Palette } from 'styles/Theme';
import SingleLineInputModal from 'components/common/Modals/SingleLineInputModal';
import { Case, Switch } from 'react-if';
import { DatePicker, DateTimePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { formatToPacific, formatToUTC } from 'components/common/dateHelper';
import { EngagementMetadataSubmission, MetadataSelectProps } from './types';
import { dateTimeTypes, filterValues, metadataTypes, selectDataTypes } from './constants';

export const MetadataTab = () => {
    const fetcher = useFetcher();
    const dispatch = useAppDispatch();
    const {
        engagement: eng,
        metadata: meta,
        taxa: tx,
    } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const { engagementId } = useParams();
    const [firstRender, setFirstRender] = useState<boolean>(true);
    const [customValues, setCustomValues] = useState<string[][]>([]);
    const [taxa, setTaxa] = useState<MetadataTaxon[]>([]);

    const defaultValues: EngagementMetadataSubmission = {
        id: 0,
        engagement_id: Number(engagementId),
        metadata: [],
    };

    const engMetaForm = useForm<EngagementMetadataSubmission>({
        defaultValues: defaultValues,
        mode: 'onSubmit',
    });

    useEffect(() => {
        if ('success' === fetcher.data || 'failure' === fetcher.data) {
            const responseText =
                'success' === fetcher.data
                    ? 'Engagement metadata updated successfully.'
                    : 'Unable to update engagement metadata.';
            const responseSeverity = 'success' === fetcher.data ? 'success' : 'error';
            notify(responseSeverity, responseText);
            fetcher.data = undefined;
        }
        if ('success' === fetcher.data) {
            const newDefaults = engMetaForm.getValues();
            engMetaForm.reset(newDefaults);
        }
    }, [fetcher.data]);

    useEffect(() => {
        buildAndPopulateForm();
    }, [meta, eng]);

    const buildAndPopulateForm = async () => {
        const t = await tx;
        if (!t || !firstRender) return;
        setTaxa(t);
        buildForm(t);
        populateForm(t);
        setFirstRender(false);
    };

    // Get the form fields from the available taxons
    const buildForm = (taxons: MetadataTaxon[]) => {
        const defaults: (string | string[])[] = [];
        taxons.forEach((taxon) => {
            if ((!taxon.position && taxon.position !== 0) || (!taxon.id && taxon.id !== 0)) return; // Protect 0 values
            defaults[taxon.position] = metadataTypes.find((mdt) => mdt.db_name === taxon.data_type)?.default ?? [
                'none',
            ]; // Default selection
        });
        engMetaForm.setValue('metadata', defaults);
    };

    // Populate the form with existing engagement metadata values and reset default state
    const populateForm = async (taxa: MetadataTaxon[]) => {
        engMetaForm.setValue('engagement_id', Number(engagementId));
        engMetaForm.setValue('id', defaultValues.id);

        const metadata = await meta;
        if (!metadata) return;

        // Create an updated copy of taxa with any missing custom values added
        const updatedTaxa = taxa.map((taxon) => {
            if (!selectDataTypes.includes(taxon.data_type as string)) {
                return taxon;
            }

            const missingValues = metadata
                .filter((m) => m.taxon_id === taxon.id)
                .map((m) => m.value)
                .filter((value) => !(taxon.preset_values ?? []).includes(value));

            return missingValues.length > 0
                ? {
                      ...taxon,
                      preset_values: [...(taxon.preset_values ?? []), ...missingValues],
                  }
                : taxon;
        });

        setTaxa(updatedTaxa);

        // Handle metadata values
        const newMeta = [...engMetaForm.getValues('metadata')];

        metadata.forEach((m) => {
            const matching = updatedTaxa.find((t) => t.id === m.taxon_id);
            if (!matching) return;
            const key = matching.position as number;
            if (!key && key !== 0) return;
            // Convert date, time, and datetime to Pacific timezone for display on the form
            const newValue = dateTimeTypes.includes(matching.data_type as string) ? formatToPacific(m.value) : m.value;

            newMeta[key] = Array.isArray(newMeta[key])
                ? [...(newMeta[key] as string[]).filter((v) => v !== 'None'), newValue]
                : newValue;
        });

        engMetaForm.setValue('metadata', newMeta);
        // Make the new values the default form state
        engMetaForm.reset(engMetaForm.getValues());
    };

    const submitForm = async () => {
        if (engMetaForm.formState.isDirty) {
            const data = engMetaForm.getValues();
            const parsedMetadata = data?.metadata
                ?.map((m, i) => {
                    const taxon = taxa.find((t) => t.position === i);
                    if ((!taxon?.id && taxon?.id !== 0) || (!taxon.position && taxon.position !== 0)) return;
                    // Omit values that haven't changed
                    const { isDirty } = engMetaForm.getFieldState(`metadata.${i}`, engMetaForm.formState);
                    if (!isDirty) return;
                    // Convert dates and times to string and UTC timezone
                    let values = dateTimeTypes.includes(taxon.data_type as string)
                        ? formatToUTC(m as string | Dayjs)
                        : m;
                    // Filter out default values and normalize values to strings
                    if (Array.isArray(values) && values.length > 0) {
                        values = values.filter((md) => !filterValues.includes(String(md))).map((v) => String(v));
                        if (values.length === 0) return; // Protect against empty array
                    } else {
                        values = [String(values)]; // Normalize to string type within array
                    }
                    if (!values) return;
                    return {
                        taxon_id: taxon.id,
                        values: values,
                    };
                })
                ?.filter(Boolean); // Remove blank results

            const customOptions: { value: unknown[]; taxon_id: number }[] = [];
            customValues.forEach((cv, i) => {
                const matching = taxa.find((t) => t.position === i);
                // Only save the custom option to the database if include_freeform is true for the taxon
                if (matching?.include_freeform) {
                    const oldValues = [...(matching.preset_values || [])];
                    const iteratedValues = [...(customOptions[i]?.value || [])]; // Other custom values on same taxon
                    const newValues = [...new Set([...oldValues, ...iteratedValues, ...cv])]; // No duplicates
                    customOptions[i] = { value: newValues, taxon_id: matching.id };
                }
            });
            fetcher.submit(
                createSearchParams({
                    engagement_id: String(engagementId),
                    custom_values: JSON.stringify(customOptions),
                    metadata: JSON.stringify(parsedMetadata),
                }),
                {
                    method: 'post',
                    action: getPath(ROUTES.ENGAGEMENT_DETAILS_METADATA, { engagementId: Number(engagementId) }),
                },
            );
        } else {
            notify('error', 'The metadata has not been changed yet.');
        }
    };

    const notify = (severity: AlertColor, text: string) => {
        dispatch(
            openNotification({
                severity: severity,
                text: text,
            }),
        );
    };

    // Styles
    const metaContainerStyles = {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
    };

    const labelStyles = {
        fontWeight: 'bold',
        mb: '1rem',
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
    };

    const dateAndTimeStyles = {
        '& .MuiPickersOutlinedInput-root': {
            borderRadius: '8px',
        },
    };

    return (
        <Grid id="admin-authoring-section" direction="column" maxWidth={'700px'}>
            <Heading2 decorated>Metadata</Heading2>
            <BodyText size="small" sx={{ mb: '1rem' }}>
                Adding metadata to your engagement gives users new ways to filter and identify engagement content.
            </BodyText>
            <Form onSubmit={engMetaForm.handleSubmit(submitForm)} id="publishing-form">
                <Grid container gap="0" sx={metaContainerStyles}>
                    {taxa.length > 0 &&
                        taxa?.map((taxon: MetadataTaxon) => (
                            <Grid container direction="column" py={2} key={taxon.id}>
                                <Box component="label" htmlFor="publish_date" sx={labelStyles}>
                                    <BodyText bold>{taxon.name}</BodyText>
                                    <BodyText size="small">
                                        {metadataTypes.find((mdt) => mdt.db_name === taxon.data_type)?.readable_name}{' '}
                                        data type
                                        {selectDataTypes.includes(String(taxon.data_type))
                                            ? `, ${taxon.one_per_engagement ? 'single' : 'multiple'} 
                                        selection, pre-defined ${taxon.freeform ? ' and custom' : ' '} options`
                                            : ''}
                                    </BodyText>
                                </Box>
                                <Controller
                                    control={engMetaForm.control}
                                    name={`metadata.${taxon.position}`}
                                    render={({ field }) => (
                                        <Switch>
                                            <Case condition={selectDataTypes.includes(taxon.data_type as string)}>
                                                <MetadataSelect
                                                    taxa={taxa}
                                                    taxon={taxon}
                                                    value={field.value as string[]}
                                                    onChange={field.onChange}
                                                    customValues={customValues}
                                                    setCustomValues={setCustomValues}
                                                />
                                            </Case>
                                            <Case condition={taxon.data_type === 'long_text'}>
                                                <TextField
                                                    multiline={true}
                                                    minRows={4}
                                                    value={String(field.value)}
                                                    onChange={field.onChange}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '8px',
                                                        },
                                                    }}
                                                />
                                            </Case>
                                            <Case condition={taxon.data_type === 'date'}>
                                                <DatePicker
                                                    value={dayjs(String(field.value))}
                                                    onChange={field.onChange}
                                                    sx={dateAndTimeStyles}
                                                    slotProps={{
                                                        textField: {
                                                            error: false,
                                                            helperText: null,
                                                        },
                                                    }}
                                                />
                                            </Case>
                                            <Case condition={taxon.data_type === 'time'}>
                                                <TimePicker
                                                    value={dayjs(String(field.value))}
                                                    onChange={field.onChange}
                                                    sx={dateAndTimeStyles}
                                                    slotProps={{
                                                        textField: {
                                                            error: false,
                                                            helperText: null,
                                                        },
                                                    }}
                                                />
                                            </Case>
                                            <Case condition={taxon.data_type === 'datetime'}>
                                                <DateTimePicker
                                                    value={dayjs(String(field.value))}
                                                    onChange={field.onChange}
                                                    sx={dateAndTimeStyles}
                                                    slotProps={{
                                                        textField: {
                                                            error: false,
                                                            helperText: null,
                                                        },
                                                    }}
                                                />
                                            </Case>
                                            <Case condition={taxon.data_type === 'boolean'}>
                                                <span>
                                                    False{' '}
                                                    <MUISwitch
                                                        checked={String(field.value) === 'true'}
                                                        onChange={(e) => field.onChange(String(e.target.checked))}
                                                    />{' '}
                                                    True
                                                </span>
                                            </Case>
                                        </Switch>
                                    )}
                                />
                            </Grid>
                        ))}
                </Grid>
                <Grid container gap="1rem">
                    <Button
                        disabled={!engMetaForm.formState.isDirty}
                        sx={{ mt: '1rem' }}
                        variant="primary"
                        type="button"
                        onClick={() => submitForm()}
                    >
                        Update Metadata
                    </Button>
                </Grid>
            </Form>
        </Grid>
    );
};

const MetadataSelect = ({
    taxa,
    taxon,
    value,
    onChange,
    customValues,
    setCustomValues,
}: MetadataSelectProps): ReactElement => {
    const [customValueModalOpen, setCustomValueModalOpen] = useState<boolean>(false);
    const [selectedTaxonPosition, setSelectedTaxonPosition] = useState<number | undefined>();
    const [selectedTaxonDataType, setSelectedTaxonDataType] = useState<string | undefined>();
    const [error, setError] = useState<string | undefined>();
    const taxonIsMulti = !taxon.one_per_engagement;
    const customValueLinkStyles = {
        fontSize: '14px',
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        width: 'fit-content',
        p: 0,
        color: `${Palette.action.active} !important`,
        '&:hover, &:active, &:focus': {
            background: 'transparent',
            boxShadow: 'none !important',
            border: 'none !important',
            textDecoration: 'underline !important',
        },
    };

    const createMetaOption = (inputText: string) => {
        setCustomValueModalOpen(false);
        if (selectedTaxonPosition === undefined || !inputText) return;
        const newValues = [...customValues];
        newValues[selectedTaxonPosition] = [...(newValues[selectedTaxonPosition] || []), inputText]; // Form value is array
        setCustomValues(newValues);
    };

    const getTypeString = (): string => {
        const matching = metadataTypes.find((mdt) => mdt.db_name === selectedTaxonDataType);
        if (!matching || !selectedTaxonDataType) return '';
        return `Your custom value must be ${matching.isSubstance ? '' : 'a '}${matching.readable_name}.`;
    };

    const customOptionIsValid = (value: string): boolean => {
        const errorPrefix = 'Your custom option is invalid. ';
        const matching = metadataTypes.find((mtd) => mtd.db_name === selectedTaxonDataType);
        // Sanity validation
        if (!matching || !selectedTaxonDataType || selectedTaxonPosition === undefined || !value) {
            setError(errorPrefix + 'Internal error.');
            return false;
        }
        // Duplicate validation
        const valuesToCheck = [
            ...(taxa.find((t) => t.position === Number(selectedTaxonPosition))?.preset_values || []),
            ...(customValues[selectedTaxonPosition as number] || []),
        ];
        if (valuesToCheck.includes(value)) {
            setError(errorPrefix + 'The option already exists.');
            return false;
        }
        // Length validation
        if (value.length > 60) {
            setError(errorPrefix + 'It must be less than 60 characters long.');
            return false;
        }
        // Number validation
        if (matching?.db_name === 'number' && isNaN(Number(value))) {
            setError(errorPrefix + 'The type of your option must be a number.');
            return false;
        }
        // Phone number validation
        const usesAllowedCharacters = /^[0-9+\-()\s]+$/;
        if (matching?.db_name === 'phone' && !usesAllowedCharacters.test(value)) {
            setError(errorPrefix + 'Phone numbers can only container numbers, spaces, (, ), +, and -.');
            return false;
        }
        // Data type validation
        if (matching?.data_type !== typeof value) {
            setError(errorPrefix + 'The type of your option does not match the required data type.');
            return false;
        }
        // Website validation
        if (matching?.db_name === 'url') {
            try {
                new URL(value);
            } catch {
                setError(errorPrefix + `Website entries must be valid URLs.`);
                return false;
            }
        }
        return true;
    };

    if (Array.isArray(taxon.preset_values) && taxon.preset_values.length > 0) {
        return (
            <>
                {/* Modal that allows the user to input a custom option for the select */}
                <Modal open={customValueModalOpen} aria-describedby="custom-value-modal-subtext">
                    <SingleLineInputModal
                        style="default"
                        validation
                        error={error}
                        header={`Custom Option`}
                        subHeader={`${selectedTaxonPosition !== undefined ? 'The ' + taxa.find((t) => t.position === selectedTaxonPosition)?.name : 'This'} taxon allows you to create custom options. ${selectedTaxonDataType ? getTypeString() : ''}`}
                        subTextId="custom-value-modal-subtext"
                        subText={[
                            {
                                text: `Enter your new option here to add it to the list of options, then select it from ${selectedTaxonPosition !== undefined ? 'the ' + taxa.find((t) => t.position === selectedTaxonPosition)?.name : 'the'} select box to use it with this engagement.`,
                                bold: false,
                            },
                        ]}
                        placeholder="New value text"
                        handleConfirm={(value) => {
                            setError(undefined); // Reset errors every time user presses confirmation button in modal
                            if (customOptionIsValid(value)) {
                                createMetaOption(value);
                                setSelectedTaxonPosition(undefined);
                                setSelectedTaxonDataType(undefined);
                            }
                        }}
                        handleClose={() => {
                            setCustomValueModalOpen(false);
                            setError(undefined);
                            setSelectedTaxonPosition(undefined);
                            setSelectedTaxonDataType(undefined);
                        }}
                        confirmButtonText={'Create Custom Value'}
                        cancelButtonText={'Cancel & Go Back'}
                    />
                </Modal>

                {/* Main Component Content */}
                <Select
                    id={`metadata-${taxon.id}-${taxon.name}-select`}
                    sx={{ maxWidth: '100%' }}
                    multiple={taxonIsMulti}
                    name={`metadata-${taxon.id}-${taxon.name}`}
                    value={value}
                    onChange={(e) => {
                        let newValue = e.target.value;
                        const eventValueIsArray = Array.isArray(newValue) && newValue.length > 1;
                        // Deal with special cases for multi-select with 'None' selection
                        if (taxonIsMulti && newValue.includes('None')) {
                            newValue = !value.includes('None')
                                ? ['None']
                                : (newValue as string[]).filter((v) => v !== 'None');
                        }
                        onChange(eventValueIsArray && taxonIsMulti ? [...newValue] : [newValue]);
                    }}
                    inputProps={{
                        'aria-label': `Select a value for the ${taxon.name}.`,
                    }}
                >
                    <MenuItem key={`${taxon.id}-${taxon.name}-none-option`} value="None">
                        None
                    </MenuItem>
                    {[...taxon.preset_values, ...(customValues[taxon.position] || [])]?.map((pv) => (
                        <MenuItem key={`${taxon.id}-${taxon.name}-${pv}-option`} value={pv}>
                            {pv}
                        </MenuItem>
                    ))}
                </Select>
                {taxon.freeform && (
                    <Button
                        onClick={() => {
                            setSelectedTaxonPosition(taxon.position);
                            setSelectedTaxonDataType(taxon.data_type);
                            setCustomValueModalOpen(true);
                        }}
                        sx={customValueLinkStyles}
                    >
                        {`+ Add a custom option (${taxon.include_freeform ? 'permanent' : 'one-time'} label${taxon.include_freeform ? ' and filter' : ''})`}
                    </Button>
                )}
            </>
        );
    }
    return <></>;
};

export default MetadataTab;
