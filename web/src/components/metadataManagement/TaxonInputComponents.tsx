import { GenericInputProps as TaxonInputProps } from './types';
import { DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import React, { ReactElement, useState } from 'react';
import {
    FormControlLabel,
    Switch,
    Typography,
    TextField,
    Autocomplete,
    Chip,
    Stack,
    AutocompleteRenderGetTagProps,
} from '@mui/material';
import { FieldError } from 'react-hook-form';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const DefaultAutocomplete = ({ taxon, taxonType, field, setValue, errors, trigger }: TaxonInputProps) => {
    const [inputValue, setInputValue] = useState('');

    const valueErrors = (errors[taxon.id.toString()] as unknown as Array<FieldError> | FieldError) ?? [];
    const errorIndices = new Set<number>();
    let errorMessage: string | ReactElement[] | undefined;
    if (taxon.one_per_engagement) {
        if (Array.isArray(valueErrors)) {
            errorMessage = valueErrors[0]?.message;
        } else {
            errorMessage = (valueErrors as FieldError)?.message;
        }
    } else {
        errorMessage = (valueErrors as Array<FieldError>)?.map((error: FieldError, index: number) => {
            errorIndices.add(index);
            return (
                <span key={index.toString() + (error.message ?? '')}>
                    Entry #{index + 1}: {error.message}
                    <br />
                </span>
            );
        });
    }

    const handleChipClick = (option: string) => () => {
        if (taxonType.externalResource) {
            globalThis.open(taxonType.externalResource(option), '_blank');
        }
    };
    const renderTags = (value: string[], getTagProps: AutocompleteRenderGetTagProps) => {
        // Define the handleChipClick function
        return (
            <Stack width="100%" direction="row" spacing={1} flexWrap="wrap">
                {value.map((option, index) => (
                    <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        color={errorIndices.has(index) ? 'error' : 'default'}
                        disabled={errorIndices.has(index) && !!taxonType.externalResource}
                        onClick={taxonType.externalResource ? handleChipClick(option) : undefined}
                        icon={taxonType.externalResource ? <FontAwesomeIcon icon={taxonType.icon} /> : undefined}
                    />
                ))}
            </Stack>
        );
    };
    return (
        <Autocomplete
            {...field}
            fullWidth
            multiple={!taxon.one_per_engagement}
            freeSolo={taxon.freeform}
            includeInputInList
            options={taxon.preset_values ?? []}
            inputValue={inputValue}
            onChange={(_event, newValue) => {
                if (taxon.one_per_engagement) {
                    setValue(taxon.id.toString(), newValue);
                    field.onChange(newValue);
                } else {
                    if (!Array.isArray(newValue)) newValue = [];
                    newValue = newValue ?? [...field.value, inputValue];
                    newValue = newValue.map((v: string) => v.trim()).filter(Boolean);
                    field.onChange(newValue);
                    setInputValue(''); // Clear the input value after change
                }
                trigger(taxon.id.toString());
            }}
            onInputChange={(_event, newInputValue) => {
                setInputValue(newInputValue);
                if (taxon.one_per_engagement) {
                    field.onChange(newInputValue);
                }
            }}
            onBlur={() => {
                trigger(taxon.id.toString());
            }}
            getOptionLabel={(option) => option.toString()}
            // always show the dropdown handle when there are options
            forcePopupIcon={(taxon.preset_values?.length ?? 0) > 0}
            renderTags={renderTags}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={taxon.name}
                    variant="outlined"
                    fullWidth
                    error={!!errors[taxon.id.toString()]}
                    helperText={errorMessage}
                />
            )}
        />
    );
};

export const taxonSwitch = ({ taxon, field, setValue, errors }: TaxonInputProps) => (
    <FormControlLabel
        control={
            <Switch
                {...field}
                checked={field?.value?.toString() === 'true'}
                onChange={(e) => {
                    setValue(taxon.id.toString(), e.target.checked);
                }}
                inputProps={{ 'aria-label': 'controlled' }}
            />
        }
        label={
            <>
                {taxon.name}
                {errors[taxon.id.toString()] && (
                    <Typography variant="caption" color="error">
                        {errors[taxon.id.toString()]?.message?.toString() ?? ''}
                    </Typography>
                )}
            </>
        }
        color={errors[taxon.id.toString()] ? 'error' : 'primary'}
    />
);

// Unified component for different types of pickers
export const PickerTypes = {
    DATE: 'DATE',
    TIME: 'TIME',
    DATETIME: 'DATETIME',
};

export const inputFormats = {
    [PickerTypes.DATE]: 'yyyy-MM-dd',
    [PickerTypes.TIME]: 'hh:mm a',
    [PickerTypes.DATETIME]: 'yyyy-MM-dd hh:mm a',
};

export const TaxonPicker = ({ taxon, field, errors, pickerType }: TaxonInputProps & { pickerType: string }) => {
    const PickerComponent = {
        [PickerTypes.DATE]: DatePicker,
        [PickerTypes.TIME]: TimePicker,
        [PickerTypes.DATETIME]: DateTimePicker,
    }[pickerType];

    return (
        <PickerComponent
            {...field}
            value={field.value && dayjs(field.value)}
            onChange={(date) => {
                field.onChange(date);
            }}
            label={taxon.name}
            slotProps={{
                desktopPaper: {
                    sx: { background: '#eee' },
                },
                textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    error: !!errors[taxon.id.toString()],
                    helperText: errors[taxon.id.toString()]?.message?.toString() ?? '',
                },
            }}
        />
    );
};
