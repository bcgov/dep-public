import React from 'react';
import { ChipProps as MuiChipProps, Chip as MuiChip, Skeleton } from '@mui/material';
import { SubmissionStatus } from 'constants/engagementStatus';
import { elevations } from 'styles/Theme';

export interface ChipProps {
    label?: string;
    statusId: SubmissionStatus;
    hovered?: boolean;
}

type StatusText = 'Open' | 'Upcoming' | 'Closed' | 'Closed With Results';

export const getStatusFromStatusId = (statusId: SubmissionStatus): StatusText => {
    switch (statusId) {
        case SubmissionStatus.Open:
            return 'Open';
        case SubmissionStatus.Upcoming:
            return 'Upcoming';
        case SubmissionStatus.Closed:
            return 'Closed';
        case SubmissionStatus.ClosedWithResults:
            return 'Closed With Results';
        default:
            return 'Closed';
    }
};

export const getSubmissionStatusFromPreviewState = (previewStateType?: string | null): SubmissionStatus => {
    switch (previewStateType) {
        case 'Open':
            return SubmissionStatus.Open;
        case 'Closed':
            return SubmissionStatus.Closed;
        case 'ViewResults':
            return SubmissionStatus.ClosedWithResults;
        case 'Upcoming':
        default:
            return SubmissionStatus.Upcoming;
    }
};

/**
 * A Chip component that displays the status of an engagement.
 * It uses the SubmissionStatus enum to determine the status and applies appropriate styles.
 * @param {ChipProps} props - Other properties for the chip component.
 * @param {string} [props.label] - Optional custom label for the chip. If not provided, the status text will be used.
 * @param {SubmissionStatus} props.statusId - The status ID of the engagement, used to determine the chip's appearance.
 * @returns A styled MuiChip component with the status label.
 * @example
 * <EngagementStatusChip statusId={SubmissionStatus.Open} />
 * <EngagementStatusChip statusId={SubmissionStatus.Upcoming} label="Upcoming Engagement" />
 */
export const EngagementStatusChip: React.FC<ChipProps & Partial<MuiChipProps>> = ({
    label: customLabel,
    statusId: status,
    hovered,
    ...props
}) => {
    const statusText = getStatusFromStatusId(status);

    const getChipProps = (): MuiChipProps => {
        switch (statusText) {
            case 'Open':
                return { color: 'success' };
            case 'Upcoming':
                return {
                    color: 'success',
                    sx: { color: 'success.main', backgroundColor: 'success.contrastText', borderStyle: 'dashed' },
                };
            case 'Closed':
            case 'Closed With Results':
                return {
                    color: 'default',
                    sx: { color: 'white', backgroundColor: 'gray.90', borderColor: 'gray.100' },
                };
            default:
                return {};
        }
    };

    const getClassName = (): string => {
        // Force the chip to be in the hovered state if the hovered prop is true.
        if (hovered) {
            return 'hovered';
        }
        // If hovered is *explicitly* set to false, prevent the hover styles from
        // being applied even when the chip *is* hovered.
        if (hovered === false) {
            return 'unhovered';
        }
        // Otherwise, use the default hover behavior.
        return '';
    };

    const chipProps = getChipProps();
    return (
        <MuiChip
            {...chipProps}
            {...props}
            className={getClassName()}
            sx={[
                {
                    borderWidth: '2px',
                    borderColor: 'currentColor',
                    borderStyle: 'solid',
                    fontWeight: 'bold',
                    boxShadow: elevations.tertiary,
                    '&:not(.unhovered)': {
                        '&:hover, &:active, &.hovered': {
                            boxShadow: elevations.tertiaryDark,
                        },
                    },
                },
                ...(Array.isArray(chipProps.sx) ? chipProps.sx : [chipProps.sx]),
                ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
            ]}
            label={customLabel || statusText}
        />
    );
};

/**
 * A skeleton component for the StatusChip.
 * It provides a placeholder for the chip while the actual data is loading.
 * @returns A rectangular skeleton with a fixed width and height, styled to resemble a status chip.
 */
export const StatusChipSkeleton = () => (
    <Skeleton variant="rounded" sx={{ width: '78px', height: '32px', borderRadius: '32px' }} />
);
