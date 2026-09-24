import React, { useState } from 'react';
import { Grid2 as Grid, Stack } from '@mui/material';
import { colors, modalStyle } from 'components/common';
import { Button } from '../Input/Button';
import { Heading2, BodyText } from '../Typography';
import { SingleLineInputModalProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExclamationCircle,
    faExclamationTriangle,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TextField } from '../Input/TextInput';

/**
 * A reusable modal component that lets the user input text.
 * It allows users to input text, and includes validation error display if desired. The user's text is returned in the handleConfirm callback.
 * @param {Object} props - The properties for the confirmation modal.
 * @param {string} [props.style="default"] - The style of the modal, which determines its color scheme and icon.
 * @param {string} props.header - The main title of the modal.
 * @param {string} [props.subHeader] - An optional secondary title for additional context.
 * @param {ReactElement} props.subText - A react element (and its children) that will be rendered in the subtext area.
 * @param {string} props.subTextId - An optional string that matches the aria-describedby label from the parent <Modal> component to this child component.
 * @param {() => void} props.handleConfirm - A function to call when the user confirms the action.
 * @param {() => void} props.handleClose - A function to call when the user cancels the action or closes the modal.
 * @param {string} [props.confirmButtonText="Confirm"] - The text for the confirm button.
 * @param {string} [props.cancelButtonText="Cancel"] - The text for the cancel button.
 * @param {validatation} props.validate - Whether validation is enabled for the text input
 * @param {string} props.error - The error text that should be displayed in the modal. State should be managed externally for updates.
 * @returns A JSX element representing the confirmation modal.
 * @example
 * <SingleLineInputModal
 *     style="warning"
 *     header="Delete Item"
 *     subHeader="Are you sure?"
 *     subText={<BodyText>This action cannot be undone.</BodyText>}
 *     subTextId="delete-files-modal-subtext"
 *     handleConfirm={() => console.log('Confirmed')}
 *     handleClose={() => console.log('Cancelled')}
 *     confirmButtonText="Yes, Delete"
 *     cancelButtonText="No, Keep It"
 *     validation
 *     error={error}
 *  />
 */
const SingleLineInputModal = ({
    style = 'default',
    icon,
    header,
    subHeader,
    subText,
    subTextId,
    placeholder, // for input
    handleConfirm,
    handleClose,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    validation,
    error,
}: SingleLineInputModalProps) => {
    const palette = colors.notification[style];
    const [value, setValue] = useState('');
    const iconMap = {
        default: faInfoCircle,
        danger: faExclamationCircle,
        warning: faExclamationTriangle,
        success: faCheckCircle,
    };
    return (
        <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            sx={{ ...modalStyle, borderColor: palette.shade }}
            aria-label={`${header} ${subHeader}`}
            spacing={2}
        >
            <Grid size="auto" sx={{ pt: 1.25, fontSize: '16px' }}>
                <FontAwesomeIcon icon={icon ?? iconMap[style]} color={palette.icon} size="2x" />
            </Grid>
            <Grid
                size="grow"
                container
                direction="row"
                justifyContent="flex-start"
                alignItems="space-between"
                rowSpacing={1}
            >
                <Grid container direction="row" size={12}>
                    <Grid size={12}>
                        <Heading2 sx={{ mb: 0 }}>{header}</Heading2>
                    </Grid>
                </Grid>
                {subHeader && (
                    <Grid container direction="row" size={12}>
                        <BodyText bold>{subHeader}</BodyText>
                    </Grid>
                )}
                <Grid container id={subTextId ?? undefined} direction="row" size={12} sx={{ mt: '1em' }}>
                    {subText}
                    {validation && error && (
                        <BodyText size="small" color="error">
                            {error}
                        </BodyText>
                    )}
                    <TextField
                        id="custom-value-modal-input"
                        value={value}
                        onChange={(e) => setValue(e)}
                        counter
                        maxLength={60}
                        placeholder={placeholder || 'Enter a value here'}
                    />
                    <Grid
                        container
                        direction={{ xs: 'column', sm: 'row' }}
                        size={12}
                        justifyContent="flex-end"
                        spacing={1}
                        sx={{ mt: '1em' }}
                    >
                        <Stack direction="row" spacing={1} width="100%" justifyContent="flex-end">
                            <Button type="button" onClick={handleClose} autoFocus>
                                {cancelButtonText}
                            </Button>
                            <Button
                                variant="primary"
                                color={style}
                                onClick={() => handleConfirm?.(value)}
                                type="submit"
                            >
                                {confirmButtonText}
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default SingleLineInputModal;
