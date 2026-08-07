import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/pro-regular-svg-icons/faCheck';
import { useAppTranslation } from 'hooks';

export const MetadataFilterChip = ({
    name,
    selected,
    onClick,
}: {
    name: string;
    selected?: boolean;
    onClick?: () => void;
}) => {
    const theme = useTheme();
    const { t: translate } = useAppTranslation();
    const selectionHint = translate(selected ? 'landing.filters.aria.selected' : 'landing.filters.aria.notSelected');
    const textColor = selected ? theme.palette.primary.contrastText : theme.palette.text.primary;
    return (
        <Chip
            size="medium"
            label={name}
            aria-label={translate('landing.filters.aria.metadataFilterChip')
                .replace('{0}', name)
                .replace('{1}', selectionHint)}
            color="default"
            avatar={
                selected ? (
                    <FontAwesomeIcon icon={faCheck} style={{ height: '16px', width: '16px', color: textColor }} />
                ) : undefined
            }
            variant={selected ? 'filled' : 'outlined'}
            onClick={onClick}
            sx={{
                mr: selected ? 1 : 2,
                mb: 2,
                p: 1,
                height: '48px',
                fontWeight: selected ? 'bold' : 'normal',
                borderColor: selected ? 'primary.contrastText' : 'blue.20',
                borderRadius: '2em',
                backgroundColor: selected ? 'blue.20' : 'transparent',
                color: textColor,
                fontSize: '16px',
                '&.MuiChip-clickable:hover': {
                    backgroundColor: selected ? 'blue.10' : 'blue.100',
                },
                '&:focus': {
                    backgroundColor: selected ? 'blue.10' : 'blue.100',
                },
                '&:focus-visible': {
                    outline: 'white 2px dashed', // Remove default outline
                    outlineOffset: '2px',
                },
            }}
        />
    );
};
