import React from 'react';
import { Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { useAppTranslation } from 'hooks';

export const DeletableFilterChip = ({ name, onDelete }: { name: string; onDelete?: () => void }) => {
    const { t: translate } = useAppTranslation();

    const handleMouseEnter = (e: React.MouseEvent<SVGSVGElement>) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
    };

    const handleMouseLeave = (e: React.MouseEvent<SVGSVGElement>) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '0.8';
    };

    return (
        <Chip
            label={name}
            title={name}
            aria-label={translate('landing.filters.aria.deleteFilterChip').replace('{0}', name)}
            color="primary"
            // replicate the delete icon on the left-hand side
            icon={
                <FontAwesomeIcon
                    icon={faXmark}
                    style={{ fontSize: '20px' }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            }
            variant="outlined"
            // enable deleting with backspace but hide the icon
            deleteIcon={<span />}
            onDelete={onDelete}
            // make clicking anywhere on the chip also delete it (larger touch target)
            onClick={onDelete}
            sx={{
                p: 1,
                height: 48,
                fontWeight: 'normal',
                borderRadius: '2em',
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '14px',
            }}
        ></Chip>
    );
};
