import React from 'react';
import { Grid2 as Grid, Stack } from '@mui/material';
import { Button } from 'components/common/Input/Button';

interface ModalActionsProps {
    onClose: () => void;
    loading?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
}

export const ModalActions = ({
    onClose,
    loading,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
}: ModalActionsProps) => (
    <Grid container size={12} direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: '1em' }}>
        <Stack direction={{ md: 'column-reverse', lg: 'row' }} spacing={1} width="100%" justifyContent="flex-end">
            <Button onClick={onClose}>{cancelLabel}</Button>
            <Button variant="primary" loading={loading} type="submit">
                {submitLabel}
            </Button>
        </Stack>
    </Grid>
);
