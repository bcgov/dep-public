import React from 'react';
import { Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/pro-regular-svg-icons';

export const ContentTag = ({
    label,
    ariaLabel,
    onDelete,
}: {
    label: React.ReactNode;
    ariaLabel: string;
    onDelete: () => void;
}) => (
    <Chip
        label={label}
        aria-label={ariaLabel}
        onDelete={onDelete}
        onClick={onDelete}
        variant="outlined"
        color="primary"
        deleteIcon={
            <FontAwesomeIcon
                icon={faTimes}
                style={{ fontSize: '19.17px', marginInlineEnd: '14px', marginInlineStart: '-4px' }}
            />
        }
        sx={{ borderRadius: '2em', maxWidth: '100%', height: '28px', borderColor: 'currentcolor', color: 'blue.90' }}
    />
);
