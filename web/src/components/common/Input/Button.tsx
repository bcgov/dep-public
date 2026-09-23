import React from 'react';
import {
    Button as MuiButton,
    ButtonProps as MuiButtonProps,
    IconButton as MuiIconButton,
    useTheme,
} from '@mui/material';
import { globalFocusShadow, colors, elevations } from '..';
import { isDarkColor } from 'utils';
import { IconParams, IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RouterLinkRenderer } from '../Navigation/Link';

const buttonStyles = {
    padding: '0 1.5rem',
    fontWeight: 500,
    fontSize: '16px',
};

type ButtonProps = {
    children?: React.ReactNode;
    color?: 'default' | 'danger' | 'warning' | 'success' | string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    size?: 'small' | 'medium' | 'large';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    target?: React.HTMLAttributeAnchorTarget;
} & Omit<MuiButtonProps, 'size' | 'color' | 'variant'>; // Exclude conflicting props

const sizeMap = {
    small: '40px',
    medium: '48px',
    large: '56px',
};

const getSecondaryButtonStyles = (color: ButtonProps['color'], isDarkMode: boolean) => {
    const notificationColor = colors.notification[color as keyof typeof colors.notification]?.shade;
    const resolvedColor = notificationColor ?? color;
    const isCustom = color !== 'default';

    const baseBackground = isDarkMode ? 'transparent' : 'white';

    const textColor = isCustom ? resolvedColor : 'text.primary';
    const darkTextColor = isCustom ? `color-mix(in srgb, ${textColor}, black 20%)` : textColor;

    let borderColor = colors.surface.gray[80];
    if (isCustom) {
        borderColor = resolvedColor;
    } else if (isDarkMode) {
        borderColor = 'white';
    }

    let darkBorderColor = colors.surface.gray[100];
    if (isCustom) {
        darkBorderColor = `color-mix(in srgb, ${borderColor}, black 20%)`;
    } else if (isDarkMode) {
        darkBorderColor = 'white';
    }

    let darkBackgroundColor = '#F8F8F8';
    if (!isCustom) {
        const mixAmount = isDarkMode ? '10%' : '3%';
        darkBackgroundColor = `color-mix(in srgb, ${baseBackground}, black ${mixAmount})`;
    }

    return {
        baseBackground,
        textColor,
        darkTextColor,
        borderColor,
        darkBorderColor,
        darkBackgroundColor,
    };
};

export const PrimaryButton: React.FC<ButtonProps> = ({
    children,
    color = 'default',
    onClick,
    size = 'medium',
    icon,
    iconPosition = 'left',
    disabled,
    sx,
    ...buttonProps
}) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const height: string = sizeMap[size];
    if (color === 'default' && isDarkMode) {
        color = '#ffffff';
    }
    const customColor = colors.button[color as keyof typeof colors.button]?.shade ?? color;
    const bgColor = customColor;
    const darkBgColor = `color-mix(in srgb, ${bgColor}, black 20%)`;
    // Use inverted text color for dark backgrounds
    const textColor = () => {
        if (isDarkMode && color === '#ffffff') {
            return colors.surface.blue[90];
        }
        if (isDarkColor(bgColor, 0.5)) {
            return colors.type.inverted.primary;
        }
        return colors.type.regular.primary;
    };

    return (
        <MuiButton
            variant="contained"
            onClick={onClick}
            disabled={disabled}
            startIcon={icon && iconPosition === 'left' ? icon : undefined}
            endIcon={icon && iconPosition === 'right' ? icon : undefined}
            sx={[
                {
                    background: bgColor,
                    color: textColor(),
                    height: height,
                    '&:focus': {
                        backgroundColor: darkBgColor,
                        boxShadow: elevations.hover,
                    },
                    '&:focus-visible': {
                        backgroundColor: darkBgColor,
                        outline: `2px solid ${colors.focus.regular.outer}`,
                        boxShadow: [globalFocusShadow, elevations.hover].join(','),
                    },
                    '&:hover': {
                        backgroundColor: darkBgColor,
                        boxShadow: elevations.hover,
                        '&:focus-visible': {
                            boxShadow: [globalFocusShadow, elevations.hover].join(','),
                        },
                    },
                    '&:active': {
                        backgroundColor: darkBgColor,
                        boxShadow: elevations.pressed,
                        '&:focus-visible': {
                            boxShadow: [globalFocusShadow, elevations.pressed].join(','),
                        },
                    },
                    '&:disabled': {
                        backgroundColor: '#EDEBE9',
                        boxShadow: 'none',
                        color: colors.type.regular.disabled,
                    },
                },
                buttonStyles,
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...buttonProps}
        >
            {children}
        </MuiButton>
    );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
    children,
    color = 'default',
    onClick,
    size = 'medium',
    icon,
    iconPosition,
    disabled,
    sx,
    ...buttonProps
}) => {
    const height: string = sizeMap[size];
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const hasOtherChildren = React.Children.count(children) > 0;
    const { baseBackground, textColor, darkTextColor, borderColor, darkBorderColor, darkBackgroundColor } =
        getSecondaryButtonStyles(color, isDarkMode);

    return (
        <MuiButton
            variant="outlined"
            onClick={onClick}
            disabled={disabled}
            startIcon={
                icon && (iconPosition === 'left' || (hasOtherChildren && iconPosition === undefined)) ? icon : undefined
            }
            endIcon={icon && iconPosition === 'right' ? icon : undefined}
            sx={[
                {
                    ...buttonStyles,
                    height: height,
                    background: baseBackground,
                    color: textColor,
                    boxShadow: elevations.default,
                    border: `1px solid ${borderColor}`,
                    '&:focus': {
                        backgroundColor: darkBackgroundColor,
                        boxShadow: elevations.hover,
                        color: darkTextColor,
                        border: `1px solid ${darkBorderColor}`,
                    },
                    '&:hover': {
                        backgroundColor: darkBackgroundColor,
                        boxShadow: elevations.hover,
                        color: darkTextColor,
                        border: `1px solid ${darkBorderColor}`,
                        '&:focus-visible': {
                            boxShadow: elevations.hover,
                        },
                    },
                    '&:active': {
                        backgroundColor: darkBackgroundColor,
                        boxShadow: elevations.pressed,
                        color: darkTextColor,
                        border: `1px solid ${darkBorderColor}`,
                        '&:focus-visible': {
                            boxShadow: elevations.pressed,
                        },
                    },
                    '&:focus-visible': {
                        backgroundColor: darkBackgroundColor,
                        outline: `2px solid ${colors.focus.regular.outer}`,
                        outlineOffset: '0px',
                        boxShadow: elevations.hover,
                        color: darkTextColor,
                    },
                    '&:disabled': {
                        backgroundColor: 'white',
                        boxShadow: 'none',
                        color: colors.type.regular.disabled,
                        border: `1px solid ${colors.type.regular.disabled}`,
                    },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...buttonProps}
        >
            {children}
            {icon && !hasOtherChildren && iconPosition === undefined && icon}
        </MuiButton>
    );
};

const TertiaryButton = ({
    children,
    color = 'default',
    onClick,
    size = 'medium',
    icon,
    iconPosition = 'left',
    disabled,
    sx,
    ...buttonProps
}: ButtonProps) => {
    const height: string = sizeMap[size];
    const colorobject = {
        tint: color === 'default' ? 'white' : color,
        shade: color === 'default' ? 'gray.110' : color,
    };
    const customColor =
        (color !== 'default' && colors.notification[color as keyof typeof colors.notification]) || colorobject;

    return (
        <MuiButton
            variant="text"
            onClick={onClick}
            disabled={disabled}
            startIcon={icon && iconPosition === 'left' ? icon : undefined}
            endIcon={icon && iconPosition === 'right' ? icon : undefined}
            sx={[
                {
                    ...buttonStyles,
                    height: height,
                    bgcolor: 'transparent',
                    color: (theme) => (theme.palette.mode === 'dark' ? customColor.tint : customColor.shade),
                    boxShadow: (theme) =>
                        theme.palette.mode === 'dark' ? elevations.tertiaryDark : elevations.tertiary,
                    '&:focus, &:focus-visible, &:hover, &:active': {
                        bgcolor: (theme) =>
                            theme.palette.mode === 'dark'
                                ? `color-mix(in srgb, transparent, #000000 5%)`
                                : `color-mix(in srgb, transparent, #F1F8FF 50%)`,
                    },
                    '&:active': {
                        boxShadow: (theme) =>
                            theme.palette.mode === 'dark' ? elevations.tertiaryDarkPressed : elevations.tertiaryPressed,
                    },
                    '&:focus-visible': {
                        outline: `2px solid ${colors.focus.regular.outer}`,
                        boxShadow: globalFocusShadow,
                    },
                    '&:disabled': {
                        color: colors.type.regular.disabled,
                        bgColor: 'transparent',
                        boxShadow: 'none',
                    },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...buttonProps}
        >
            {children}
        </MuiButton>
    );
};

/**
 * The main DEP-styled button component. Matches the DEP design system styling
 * and provides a consistent interface for different button variants.
 * @param {ButtonProps} props - Button properties including variant, children, onClick, etc.
 * @param {('primary' | 'secondary' | 'tertiary')} props.variant - The variant of the button, can be 'primary', 'secondary', or 'tertiary'. Default is 'secondary'.
 * @param {React.ReactNode} props.children - The content of the button, typically text or icons.
 * @param {() => void} props.onClick - The function to call when the button is clicked.
 * @param {'small' | 'medium' | 'large'} props.size - The size of the button, can be 'small' (40px), 'medium' (48px), or 'large' (56px). Default is 'medium'.
 * @param {'default' | 'danger' | 'warning' | 'success' | string} props.color - The color of the button, can be 'default', 'danger', 'warning', 'success', or a custom color.
 * @param {React.ReactNode} props.icon - An optional icon to display in the button.
 * @param {'left' | 'right'} props.iconPosition - The position of the icon, can be 'left' or 'right'. Default is 'left'.
 *
 * @returns A button component that renders different styles based on the variant.
 */
export const Button = ({
    variant = 'secondary',
    ...props
}: ButtonProps & {
    variant?: 'primary' | 'secondary' | 'tertiary';
}) => {
    props.LinkComponent = props.LinkComponent || RouterLinkRenderer;
    switch (variant) {
        case 'primary':
            return <PrimaryButton {...props} />;
        case 'secondary':
            return <SecondaryButton {...props} />;
        case 'tertiary':
            return <TertiaryButton {...props} />;
        default:
            return <SecondaryButton {...props} />;
    }
};

type IconButtonProps = {
    icon: IconProp;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    title?: string;
    sx?: React.CSSProperties;
    size?: string;
    iconSize?: string;
    color?: string;
    backgroundColor?: string;
    hoverBackgroundColor?: string;
    disabled?: boolean;
    iconProps?: IconParams;
};

/**
 * IconButton component that renders a circular button with an icon.
 * Provides full customization of size, colors, and positioning while maintaining
 * consistent focus and hover behavior.
 *
 * @param {IconButtonProps} props - The properties for the icon button.
 * @param {IconProp} props.icon - The icon to display in the button.
 * @param {() => void} props.onClick - The function to call when the button is clicked.
 * @param {string} props.title - The title for the button, used for accessibility.
 * @param {React.CSSProperties} props.sx - Additional styles to apply to the button.
 * @param {string} props.size - Button diameter (e.g., '40px', '3rem'). Default is '40px'.
 * @param {string} props.iconSize - Icon font size (e.g., '20px', '1.5rem'). Default is '20px'.
 * @param {string} props.color - Icon color. Default is '#494949'.
 * @param {string} props.backgroundColor - Button background color. Default is colors.focus.regular.inner.
 * @param {string} props.hoverBackgroundColor - Background color on hover/focus. Default is '#F2F2F2'.
 * @param {boolean} props.disabled - Whether the button is disabled.
 * @param {IconParams} props.iconProps - Additional properties for the FontAwesomeIcon.
 * @returns A styled icon button component.
 */
export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onClick,
    title,
    sx,
    size = '40px',
    iconSize = '20px',
    color = '#494949',
    backgroundColor = colors.focus.regular.inner,
    hoverBackgroundColor = '#F2F2F2',
    disabled = false,
    iconProps,
}) => {
    return (
        <MuiIconButton
            onClick={onClick}
            title={title}
            aria-label={title}
            disabled={disabled}
            sx={{
                width: size,
                height: size,
                borderRadius: '9999px', // Always fully rounded even if content isn't perfectly square
                backgroundColor: backgroundColor,
                color: color,
                '&:hover': {
                    backgroundColor: hoverBackgroundColor,
                },
                '&:focus-visible': {
                    backgroundColor: hoverBackgroundColor,
                    outline: `2px solid ${colors.focus.regular.outer}`,
                    outlineOffset: '2px',
                    boxShadow: globalFocusShadow,
                },
                '&:disabled': {
                    backgroundColor: colors.surface.gray[40],
                    color: colors.type.regular.disabled,
                },
                ...sx,
            }}
        >
            <FontAwesomeIcon icon={icon} style={{ fontSize: iconSize }} {...iconProps} />
        </MuiIconButton>
    );
};
