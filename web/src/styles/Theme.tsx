import React, { forwardRef } from 'react';
import { createTheme } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import type {} from '@mui/x-date-pickers/themeAugmentation';

const CustomSelectIcon = forwardRef<SVGSVGElement>((props, ref) => (
    <FontAwesomeIcon
        icon={faChevronDown}
        ref={ref}
        style={{
            height: '1rem',
            width: '1rem',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            padding: '0.125rem',
            color: 'currentColor',
        }}
        {...props}
    />
));

export const colors = {
    type: {
        regular: {
            primary: '#292929',
            secondary: '#464341',
            link: '#1A5A96',
            disabled: '#A19F9D',
        },
        inverted: {
            primary: '#FFFFFF',
            secondary: '#EDEBE9',
            link: '#D8EBFF',
            disabled: '#A19F9D',
        },
    },
    button: {
        default: {
            shade: '#12508F',
            icon: '#12508F',
            tint: '#FFF8E8',
        },
        success: {
            shade: '#42814A',
            icon: '#42814A',
            tint: '#F6FFF8',
        },
        warning: {
            shade: '#FCBA19',
            icon: '#C08C07',
            tint: '#FFECBE',
        },
        danger: {
            shade: '#CE3E39',
            icon: '#CE3E39',
            tint: '#F4E1E2',
        },
        error: {
            shade: '#CE3E39',
            icon: '#CE3E39',
            tint: '#F4E1E2',
        },
    },
    focus: {
        regular: {
            outer: '#2E5DD7',
            inner: '#FFFFFF',
        },
    },
    surface: {
        gray: {
            10: '#FAF9F8',
            20: '#F3F2F1',
            30: '#EDEBE9',
            40: '#E1DFDD',
            50: '#D2D0CE',
            60: '#C8C6C4',
            70: '#A19F9D',
            80: '#7A7876',
            90: '#3B3A39',
            100: '#323130',
            110: '#201F1E',
        },
        blue: {
            10: '#F1F8FF',
            20: '#D8EBFF',
            30: '#C0DFFF',
            40: '#A7D2FF',
            50: '#8EC6FF',
            60: '#76BAFF',
            70: '#4E97E0',
            80: '#2B71B8',
            90: '#12508F',
            100: '#053662',
            bc: '#053662',
        },
        gold: {
            10: '#FFF8E8',
            20: '#FFECBE',
            30: '#FFE095',
            40: '#FFD46C',
            50: '#FFC843',
            60: '#FCBA19',
            bc: '#FCBA19',
            70: '#D39706',
            80: '#AA7900',
            90: '#825C00',
            100: '#593F00',
        },
        white: '#FFFFFF',
    },
    notification: {
        info: {
            shade: '#12508F',
            icon: '#12508F',
            tint: '#F1F8FF',
        },
        default: {
            shade: '#12508F',
            icon: '#12508F',
            tint: '#F1F8FF',
        },
        success: {
            shade: '#42814A',
            icon: '#42814A',
            tint: '#F6FFF8',
        },
        warning: {
            shade: '#FCBA19',
            icon: '#C08C07',
            tint: '#FFECBE',
        },
        danger: {
            shade: '#CE3E39',
            icon: '#CE3E39',
            tint: '#F4E1E2',
        },
        error: {
            shade: '#CE3E39',
            icon: '#CE3E39',
            tint: '#F4E1E2',
        },
    },
    acknowledgement: {
        border: '#fcba19',
        background: '#292929',
    },
};

export const elevations = {
    // For use with CSS box-shadow property
    none: '0px 0px transparent',
    pressed:
        '0px 0px 1px 0px rgba(0, 0, 0, 0.14), 0px 0px 1px 0px rgba(0, 0, 0, 0.60) inset, 0px 1px 6px 0px rgba(0, 0, 0, 0.60) inset',
    default:
        '0px 12px 10px 0px rgba(0, 0, 0, 0.01), 0px 7px 9px 0px rgba(0, 0, 0, 0.05), 0px 3px 6px 0px rgba(0, 0, 0, 0.09), 0px 1px 3px 0px rgba(0, 0, 0, 0.10)',
    hover: '0px 5px 6px 0px rgba(0, 0, 0, 0.20), 0px 9px 12px 0px rgba(0, 0, 0, 0.14), 0px 3px 16px 0px rgba(0, 0, 0, 0.12)',
    tertiary: '0 8px 35px -12px rgba(181, 181, 181, 0.30)',
    tertiaryDark: '0 8px 35px -12px rgba(16, 38, 61, 0.40)',
    tertiaryPressed: '0 0 16px 20px #E8EEF3 inset;',
    tertiaryDarkPressed: '0 0 16px 12px rgba(11, 37, 58, 0.10) inset;',
};

export const Palette = {
    ...colors.surface,
    notification: colors.notification,
    primary: {
        main: colors.surface.blue[90],
        light: colors.surface.blue[80],
        dark: colors.surface.blue[100],
    },
    secondary: {
        main: colors.surface.gold.bc,
        light: colors.surface.gold[50],
        dark: colors.surface.gold[70],
    },
    error: {
        main: colors.notification.error.shade,
        light: colors.notification.error.tint,
        dark: colors.notification.error.icon,
        contrastText: colors.type.inverted.primary,
    },
    success: {
        main: colors.notification.success.shade,
        light: colors.notification.success.tint,
        dark: colors.notification.success.icon,
        contrastText: colors.type.inverted.primary,
    },
    warning: {
        main: colors.notification.warning.shade,
        light: colors.notification.warning.tint,
        dark: colors.notification.warning.icon,
        contrastText: colors.type.regular.primary,
    },
    info: {
        main: colors.notification.info.shade,
        light: colors.notification.info.tint,
        dark: colors.notification.info.icon,
        contrastText: colors.type.inverted.primary,
    },
    background: {
        default: colors.surface.white,
        paper: colors.surface.white,
        chip: colors.surface.gray[10],
    },
    hover: {
        light: colors.surface.blue[10],
    },
    text: {
        primary: colors.type.regular.primary,
        secondary: colors.type.regular.secondary,
    },
    action: {
        active: colors.type.regular.link,
    },
    focus: {
        outer: colors.focus.regular.outer,
        inner: colors.focus.regular.inner,
    },
    internalHeader: {
        backgroundColor: colors.surface.white,
        color: colors.type.regular.primary,
    },
    publicHeader: {
        backgroundColor: colors.surface.white,
        color: colors.type.regular.primary,
    },
    dashboard: {
        upcoming: {
            bg: colors.notification.warning.tint,
            border: colors.notification.warning.shade,
        },
        open: {
            bg: colors.notification.success.tint,
            border: colors.notification.success.shade,
        },
        closed: {
            bg: colors.notification.danger.tint,
            border: colors.notification.danger.shade,
        },
    },
    icons: {
        surveyReady: colors.notification.success.shade,
    },
    acknowledgement: {
        font: colors.surface.gray[10],
        background: colors.acknowledgement.background,
        border: colors.acknowledgement.border,
    },
    label: {
        background: colors.surface.gray[30],
        text: colors.type.regular.primary,
    },
};

export const BaseTheme = createTheme({
    palette: Palette,
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: Palette.background.paper,
                    borderRadius: '8px',
                    backgroundImage: 'none',
                },
            },
        },
        MuiSelect: {
            variants: [
                {
                    props: { variant: 'outlined' },
                    style: {
                        backgroundColor: 'white',
                        borderRadius: '8px',
                    },
                },
                {
                    props: { variant: 'standard' },
                    style: {
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        transition: 'box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                        '&:hover, &:has(:focus), &:has(:focus-visible)': {
                            backgroundColor: 'color-mix(in srgb, white, black 20%)',
                            boxShadow: elevations.hover,
                        },
                        '&:has(:focus-visible)': {
                            backgroundColor: 'color-mix(in srgb, white, black 20%)',
                            outline: `2px solid ${Palette.focus.outer}`,
                            boxShadow: `0 0 0 2px ${Palette.focus.inner} inset,${elevations.hover}`,
                        },
                        '&:has(:active)': {
                            backgroundColor: 'color-mix(in srgb, white, black 20%)',
                            boxShadow: elevations.pressed,
                        },
                        '&.Mui-disabled, &:has(:disabled)': {
                            backgroundColor: colors.surface.gray[10],
                            color: colors.type.regular.disabled,
                        },
                    },
                },
            ],
            defaultProps: {
                disableUnderline: true,
                IconComponent: CustomSelectIcon,
                MenuProps: {
                    sx: {
                        '& .MuiMenu-list .MuiMenuItem-root:hover, .MuiMenu-list .MuiMenuItem-root.Mui-focusVisible': {
                            backgroundColor: Palette.hover.light,
                        },
                        '& .MuiMenu-list .MuiMenuItem-root.Mui-selected': {
                            backgroundColor: colors.surface.blue[30],
                            '&:hover, &.Mui-focusVisible': {
                                backgroundColor: colors.surface.blue[40],
                            },
                        },
                        '& .MuiMenu-list .MuiMenuItem-root.Mui-disabled': {
                            backgroundColor: colors.surface.gray[10],
                            color: colors.type.regular.disabled,
                        },
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
            defaultProps: {
                disableRipple: true,
            },
        },
        MuiTextField: {
            defaultProps: {
                size: 'small',
            },
        },
        MuiLink: {
            defaultProps: {
                color: Palette.action.active,
            },
        },
        MuiFormLabel: {
            defaultProps: {
                focused: false,
            },
        },
        MuiStepLabel: {
            styleOverrides: {
                label: {
                    color: '#494949 !important',
                    opacity: '100% !important',
                },
                labelContainer: {
                    color: '#494949 !important',
                    opacity: '100% !important',
                },
            },
        },
        MuiSkeleton: {
            defaultProps: {
                animation: 'wave',
            },
        },
        MuiStaticDatePicker: {
            defaultProps: {
                showDaysOutsideCurrentMonth: true,
                displayStaticWrapperAs: 'desktop',
                slots: { actionBar: () => null },
                sx: {
                    paddingBottom: '1em',
                    '& .MuiDateCalendar-root': { maxHeight: '24em', height: 'max-content' },
                    '& .MuiPickersSlideTransition-root': { minHeight: '16em' },
                },
            },
        },
        MuiRadio: {
            defaultProps: {
                sx: {
                    '& .MuiSvgIcon-root': {
                        fontSize: '1.75rem',
                        '&[data-testid=RadioButtonCheckedIcon]': {
                            fontSize: '1.375rem',
                            marginTop: '0.1875rem',
                            marginLeft: '0.1875rem',
                        },
                    },
                    '&.Mui-checked': {
                        fontWeight: 'bold',
                    },
                },
            },
        },
    },
    typography: {
        fontFamily: "'BCSans', 'Noto Sans', Verdana, Arial, sans-serif",
        fontSize: 16,
        allVariants: {
            color: Palette.text.primary,
        },
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 500,
        },
        h4: {
            fontWeight: 500,
        },
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
        subtitle2: {
            fontWeight: 500,
            fontSize: '1.15rem',
        },
        body1: {
            fontWeight: 500,
            fontSize: '16px',
        },
        button: {
            fontWeight: 700,
            fontSize: '1.125rem',
            textTransform: 'none',
        },
    },
});

export const DarkPalette = {
    mode: 'dark' as const,
    ...colors.surface,
    notification: colors.notification,
    primary: {
        main: colors.surface.white,
        light: colors.surface.white,
        dark: colors.surface.blue[100],
        contrastText: colors.surface.blue[90],
    },
    secondary: {
        main: colors.surface.gold.bc,
        light: colors.surface.gold[50],
        dark: colors.surface.gold[70],
    },
    background: {
        default: colors.surface.blue[90],
        paper: colors.surface.blue[90],
    },
    hover: {
        light: colors.surface.blue[70],
        dark: colors.surface.blue[100],
    },
    text: {
        primary: colors.type.inverted.primary,
        secondary: colors.type.inverted.secondary,
    },
    action: {
        active: colors.type.inverted.link,
    },
    info: {
        main: colors.surface.gray[20],
    },
};

export const DarkTheme = createTheme({
    ...BaseTheme,
    palette: DarkPalette,
    components: {
        ...BaseTheme.components,
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: DarkPalette.background.paper,
                    borderRadius: '1rem',
                    backgroundImage: 'none',
                },
            },
        },
        MuiLink: {
            defaultProps: {
                color: DarkPalette.action.active,
            },
        },
        MuiSkeleton: {
            defaultProps: {
                animation: 'wave' as const,
            },
            styleOverrides: {
                root: {
                    backgroundColor: colors.surface.blue[90],
                },
                wave: {
                    backgroundColor: colors.surface.blue[80],
                },
            },
        },
    },
    typography: {
        fontFamily: "'BCSans', 'Noto Sans', Verdana, Arial, sans-serif",
        fontSize: 16,
        allVariants: {
            color: colors.type.inverted.primary,
        },
        h2: {
            fontWeight: 300,
        },
        h3: {
            fontWeight: 300,
            fontSize: '1.5rem',
        },
        subtitle2: {
            fontWeight: 500,
            fontSize: '1.15rem',
        },
        body1: {
            fontSize: '16px',
        },
        button: {
            fontWeight: 400,
            fontSize: '1.125rem',
            textTransform: 'none',
        },
    },
});

export const AdminTheme = createTheme({
    ...BaseTheme,
    palette: {
        ...BaseTheme.palette,
    },
    components: {
        ...BaseTheme.components,
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
            defaultProps: {
                disableRipple: true,
            },
        },
        MuiRadio: {
            defaultProps: {
                sx: {
                    '& .MuiSvgIcon-root': {
                        fontSize: '1.25rem',
                        '&[data-testid=RadioButtonCheckedIcon]': {
                            fontSize: '1rem',
                            marginTop: '0.125rem',
                            marginLeft: '0.125rem',
                        },
                    },
                    '&.Mui-checked': {
                        fontWeight: 'bold',
                    },
                },
            },
        },
    },
});

export const AdminDarkTheme = createTheme({
    ...DarkTheme,
    palette: {
        ...DarkTheme.palette,
    },
    components: {
        ...DarkTheme.components,
        ...AdminTheme.components,
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
            defaultProps: {
                disableRipple: true,
            },
        },
    },
});

export const ZIndex = {
    drawer: '1100',
    feedback: '1002',
    sideNav: '1001',
    footer: '1000',
};
