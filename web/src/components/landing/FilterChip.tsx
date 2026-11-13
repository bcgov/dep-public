import React from 'react';
import { Link } from 'components/common/Navigation';
import { Chip } from '@mui/material';
import { colors } from 'styles/Theme';

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
                boxShadow:
                    '0 5px 6px 0 rgba(0, 0, 0, 0.20), 0 9px 12px 0 rgba(0, 0, 0, 0.14), 0 3px 16px 0 rgba(0, 0, 0, 0.12)',
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
            boxShadow:
                '0 12px 10px 0 rgba(0, 0, 0, 0.01), 0 7px 9px 0 rgba(0, 0, 0, 0.05), 0 3px 6px 0 rgba(0, 0, 0, 0.09), 0 1px 3px 0 rgba(0, 0, 0, 0.10)',

            '&.Mui-disabled, &.Mui-disabled:hover': {
                opacity: '1',
                background: 'gray.10',
                color: colors.type.regular.disabled,
                cursor: 'not-allowed',
                boxShadow:
                    '0 12px 10px 0 rgba(0, 0, 0, 0.01), 0 7px 9px 0 rgba(0, 0, 0, 0.05), 0 3px 6px 0 rgba(0, 0, 0, 0.09), 0 1px 3px 0 rgba(0, 0, 0, 0.10);',
            },
        }}
    />
);
