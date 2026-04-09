import React from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Engagement } from 'models/engagement';
import { useEngagementSearch } from './useEngagementSearch';

export interface EngagementAutocompleteProps {
    value: Engagement | null | undefined;
    onChange: (engagement: Engagement | null) => void;
    error?: boolean;
    helperText?: string;
    hasTeamAccess?: boolean;
}

export const EngagementAutocomplete = ({
    value,
    onChange,
    error,
    helperText,
    hasTeamAccess,
}: EngagementAutocompleteProps) => {
    const { options, loading, onInputChange } = useEngagementSearch({ hasTeamAccess });

    return (
        <Autocomplete
            options={options}
            value={value ?? null}
            onChange={(_, data) => onChange(data)}
            onInputChange={(_, newValue) => onInputChange(newValue)}
            getOptionLabel={(engagement: Engagement) => engagement.name}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            loading={loading}
            slotProps={{
                paper: { sx: { maxHeight: 48 * 4.5 + 8, overflowY: 'auto' } },
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    fullWidth
                    placeholder="Search for an engagement"
                    error={error}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading && <CircularProgress color="primary" size={20} sx={{ marginRight: '2em' }} />}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};
