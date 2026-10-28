import React, { SyntheticEvent, useState } from 'react';
import { Autocomplete, TextField, Chip, IconButton, Stack } from '@mui/material';
import { Control, Controller, FieldError } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons/faCircleXmark';
import { faPlusCircle } from '@fortawesome/pro-regular-svg-icons';
import { MetadataFormValue } from 'models/engagement';

const PresetValuesEditor = ({
    control, // The control object (from react-hook-form)
    name, // The name of the field in the form
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<any>;
    name: string;
}) => {
    // State to manage the input value of the Autocomplete component
    const [inputValue, setInputValue] = useState('');

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => {
                const valueErrors = (errors.preset_values as unknown as Array<FieldError>) ?? [];
                const errorIndices = new Set<number>();
                const errorMessage = valueErrors?.map((error: FieldError, index: number) => {
                    errorIndices.add(index);
                    return (
                        <span key={index.toString() + (error.message ?? '')}>
                            Entry #{index + 1}: {error.message}
                            <br />
                        </span>
                    );
                });

                const onArrayChange = (
                    _event: SyntheticEvent<Element, Event> | null,
                    newValue: Array<string | MetadataFormValue> | null,
                ) => {
                    const updatedValues = (newValue ?? [])
                        .map((item, index) => {
                            // Normalize values to MetadataFormValue objects
                            if (typeof item === 'string') {
                                const existingValue = value.find((v: MetadataFormValue) => v.value === item);

                                return {
                                    id: existingValue?.id,
                                    value: item.trim(),
                                    position: index + 1,
                                };
                            }
                            return {
                                id: item.id,
                                value: item.value?.trim() ?? '',
                                position: index + 1,
                            };
                        })
                        .filter((v) => v.value); // Remove blank entries

                    onChange(updatedValues);
                    setInputValue('');
                };

                return (
                    <Autocomplete
                        multiple
                        freeSolo
                        options={[]}
                        value={value.map((v: MetadataFormValue) => v.value) || []}
                        inputValue={inputValue}
                        onInputChange={(_event, newInputValue) => {
                            setInputValue(newInputValue);
                        }}
                        onChange={onArrayChange}
                        renderTags={(value, getTagProps) => (
                            <Stack width="100%" direction="row" spacing={1} flexWrap="wrap">
                                {value.map((option, index) => (
                                    <Chip
                                        variant="outlined"
                                        label={option}
                                        {...getTagProps({ index })}
                                        key={option}
                                        color={errorIndices.has(index) ? 'error' : 'default'}
                                    />
                                ))}
                            </Stack>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                placeholder="Type a new option..."
                                error={!!errors.preset_values}
                                helperText={errorMessage}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {inputValue && (
                                                <IconButton
                                                    title="Add value to the list"
                                                    onClick={() => {
                                                        onArrayChange(null, [
                                                            ...value,
                                                            { value: inputValue, position: value.length + 1 },
                                                        ]);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPlusCircle} style={{ fontSize: '22px' }} />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                color="error"
                                                title="Clear all values"
                                                onClick={() => onChange([])}
                                            >
                                                <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '22px' }} />
                                            </IconButton>
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />
                );
            }}
        />
    );
};

export default PresetValuesEditor;
