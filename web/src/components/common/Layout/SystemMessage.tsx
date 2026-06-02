import React from 'react';
import { Grid2 as Grid, Grid2Props as GridProps } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatusIcon } from '../Communication/StatusIcon';
import { colors } from 'styles/Theme';
import { faClose, IconDefinition } from '@fortawesome/pro-regular-svg-icons';
import { Button } from 'components/common/Input/Button';

/**
 * Displays an inline system message with an icon, text, and optional dismiss button.
 * The message can be styled based on the status (success, warning, danger, info).
 * Differs from a modal by being inline in the layout, allowing for more helpful placement in the UI.
 * @param {Object} props - The properties for the SystemMessage component.
 * @param {string} props.status - The status of the message, which determines its styling (success, warning, danger, info).
 * @param {Function} [props.onDismiss] - Optional function to call when the dismiss button is clicked.
 * @param {string} [props.color] - Optional color for the icon.
 * @param {boolean} [props.coloredBackground] - If true, the background will be colored based on the status.
 * @param {string} [props.icon] - Optional icon to display instead of the default status icon.
 * @param {React.ReactNode} props.children - The content of the message.
 * @param {GridProps} [props.sx] - Additional styles to apply to the grid container.
 * @returns {JSX.Element} A styled grid component representing the system message.
 * @example
 * <SystemMessage
 *     status="success"
 *     onDismiss={() => console.log('Message dismissed')}
 *     color="green"
 *     coloredBackground={true}
 *     icon="check-circle"
 * >
 *     Your operation was successful!
 * </SystemMessage>
 * @example
 * <SystemMessage
 *     status="warning"
 *     color="orange"
 *     coloredBackground={true}
 *    icon="exclamation-triangle"
 * >
 *    Please be cautious with this action.
 * </SystemMessage>
 */
export const SystemMessage = ({
    status,
    onDismiss,
    color,
    coloredBackground,
    icon,
    children,
    ...props
}: {
    status: 'success' | 'warning' | 'danger' | 'info';
    onDismiss?: () => void;
    color?: string;
    coloredBackground?: boolean;
    icon?: IconDefinition;
} & GridProps) => {
    return (
        <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            sx={{
                maxWidth: { xs: '100%', md: '700px' },
                borderRadius: '8px',
                backgroundColor: coloredBackground ? colors.notification[status].tint : 'transparent',
                color: 'text.primary',
                padding: '0.8rem 1rem',
                paddingLeft: { xs: '0.5rem', md: '1rem' },
                border: `1px solid ${colors.notification[status].shade}`,
                flexWrap: 'nowrap',
                ...props.sx,
            }}
        >
            <Grid sx={{ pr: 1, fontSize: '18px' }}>
                {icon ? (
                    <FontAwesomeIcon icon={icon} color={color || colors.notification[status].icon} />
                ) : (
                    <StatusIcon status={status} color={color} />
                )}
            </Grid>
            <Grid sx={{ width: '100%', maxWidth: { xs: '100%', md: '600px', fontSize: '14px' } }}>{children}</Grid>
            <Grid justifySelf="flex-end" sx={{ mt: -0.75, opacity: onDismiss ? 1 : 0 }}>
                <Button
                    disabled={!onDismiss}
                    onClick={onDismiss}
                    sx={{
                        padding: 0,
                        height: '100%',
                        width: '32px',
                        minWidth: '24px',
                        marginTop: '8px',
                        backgroundColor: 'transparent',
                        color: colors.notification[status].icon,
                        '&:hover': {
                            backgroundColor: 'transparent',
                        },
                    }}
                    icon={<FontAwesomeIcon icon={faClose} />}
                />
            </Grid>
        </Grid>
    );
};
