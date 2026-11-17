import React from 'react';
import { Link } from 'components/common/Navigation';
import { Chip } from '@mui/material';
import { colors, elevations } from 'styles/Theme';

export const FilterChip = ({
    label,
    linkTo,
    pressed,
    onClick,
    disabled,
}: {
    label: string;
    linkTo?: string;
    pressed?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}) => (
    <Chip
        component={Link}
        to={disabled ? undefined : linkTo}
        disabled={disabled}
        variant="outlined"
        className={pressed ? 'Mui-active' : undefined}
        onClick={onClick}
        label={label}
        sx={{
            userSelect: 'none',
            cursor: 'pointer',
            borderRadius: '24px',
            '&:focus-visible': {
                background: 'gray.20',
                color: 'blue.90',
                outline: '2px solid #2E5DD7',
                outlineOffset: '5px',
            },
            '&:hover:not(.Mui-disabled)': {
                boxShadow: elevations.hover,
            },
            '&:active:not(.Mui-disabled), &.Mui-active:not(.Mui-disabled)': {
                boxShadow: '0 0 8px 12px rgba(0, 0, 0, 0.10) inset',
            },
            background: 'white',
            color: 'blue.90',
            border: '1px solid',
            borderColor: 'blue.90',
            height: '44px',
            padding: '0 5px',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '16px',
            boxShadow: elevations.default,

            '&.Mui-disabled, &.Mui-disabled:hover': {
                opacity: '1',
                background: 'gray.10',
                color: colors.type.regular.disabled,
                cursor: 'not-allowed',
                boxShadow: elevations.default,
            },
        }}
    />
);
