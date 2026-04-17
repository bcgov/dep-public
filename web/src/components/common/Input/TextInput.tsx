import React, { useEffect } from 'react';
import { Button as MuiButton, Input, InputProps, Box, TextField as MuiTextField, useTheme } from '@mui/material';
import { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField';
import { colors, globalFocusVisible } from '..';
import { FormField, FormFieldProps } from './FormField';
import { BodyText } from '../Typography';
import { faCircleXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export type TextInputProps = {
    value?: string;
    onChange?: (value: string, name?: string) => void;
    placeholder?: string;
    disabled?: boolean;
} & Omit<InputProps, 'value' | 'onChange' | 'placeholder' | 'disabled'>;

export const textInputStyles = {
    display: 'flex',
    padding: '10px 16px',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    alignSelf: 'stretch',
    borderRadius: '8px',
    caretColor: colors.surface.blue[90],
    '&:hover': {
        boxShadow: `0 0 0 2px ${colors.surface.gray[90]} inset`,
        '&:has(:disabled)': {
            boxShadow: `0 0 0 1px ${colors.surface.gray[80]} inset`,
        },
    },
    '&.Mui-focused': {
        boxShadow: `0 0 0 4px ${colors.focus.regular.outer}`,
        '&:has(:disabled)': {
            // make sure disabled state doesn't override focus state
            boxShadow: `0 0 0 1px ${colors.surface.gray[80]} inset`,
        },
    },
    '&:has(:disabled)': {
        background: colors.surface.gray[10],
        color: colors.type.regular.secondary,
        userSelect: 'none',
        cursor: 'not-allowed',
    },
};

/**
 * A customizable text input component that allows users to enter text.
 * It supports features like placeholder text, disabled state, and custom styles.
 * @param {TextInputProps} props - The properties for the text input component.
 * @param {string} [props.value] - The current value of the input field.
 * @param {function} [props.onChange] - Callback function that is called when the input value changes.
 * @param {string} [props.placeholder] - Placeholder text displayed when the input is empty.
 * @param {boolean} [props.disabled] - If true, the input field is disabled and cannot be interacted with.
 * @param {SxProps<Theme>} [props.sx] - Custom styles for the input component.
 * @param {boolean} [props.error] - If true, the input field will display an error state.
 */
export const TextInput: React.FC<TextInputProps> = ({
    value,
    onChange,
    placeholder,
    disabled,
    sx,
    error,
    inputProps,
    ...textFieldProps
}: TextInputProps) => {
    return (
        <Input
            className="dep-input-text"
            disableUnderline
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value, e.target.name)}
            placeholder={placeholder}
            disabled={disabled}
            sx={{
                color: 'text.primary',
                bgcolor: 'background.default',
                ...textInputStyles,
                boxShadow: error
                    ? `0 0 0 2px ${colors.notification.error.shade} inset`
                    : `0 0 0 1px ${colors.surface.gray[80]} inset`,
                ...sx,
            }}
            error={error || undefined}
            inputProps={{
                fontSize: '16px',
                lineHeight: '24px',
                border: 'none',
                ...inputProps,
                sx: {
                    padding: 0,
                    '&::placeholder': {
                        color: colors.type.regular.secondary,
                    },
                    '&:disabled': {
                        cursor: 'not-allowed',
                    },
                    ...inputProps?.sx,
                },
            }}
            {...textFieldProps}
        />
    );
};

const clearInputButton = (onClick: () => void) => {
    return (
        <MuiButton
            onClick={onClick}
            title="Clear this field"
            sx={{
                minWidth: 'unset',
                minHeight: 'unset',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'none',
                color: colors.surface.gray[70],
                '&:hover, &:focus': {
                    color: colors.surface.gray[90],
                },
                ...globalFocusVisible,
            }}
        >
            <FontAwesomeIcon icon={faCircleXmark} />
        </MuiButton>
    );
};

export type TextFieldProps = {
    error?: string;
    errorPosition?: 'top' | 'bottom';
    counter?: boolean;
    maxLength?: number;
    clearable?: boolean;
    formFieldProps?: Partial<FormFieldProps>;
    onChange?: (value: string, name?: string) => void;
} & Omit<FormFieldProps, 'children' | 'onChange'> &
    Omit<TextInputProps, 'fullWidth' | 'error' | 'onChange'>;

/**
 * A text field component that combines a label, instructions, and an input field.
 * It supports features like error messages, required fields, and clearable input.
 * @param {TextFieldProps} props - The properties for the text field.
 * @param {string} [props.title] - The title of the text field.
 * @param {string} [props.instructions] - Instructions or additional information for the text field.
 * @param {string} [props.error] - An error message to display for the text field.
 * @param {'top' | 'bottom'} [props.errorPosition='top'] - The position of the error message, either 'top' or 'bottom'.
 * @param {string} [props.name] - The name of the input field, used for form submission.
 * @param {boolean} [props.required=false] - If true, indicates that the field is required.
 * @param {boolean} [props.optional=false] - If true, indicates that the field is optional.
 * @param {boolean} [props.clearable=false] - If true, adds a button to clear the input field.
 * @param {boolean} [props.counter=false] - If true, displays a character count below the input field.
 * @param {number} [props.maxLength] - The maximum number of characters allowed in the input field.
 * @param {function} [props.onChange] - Callback function that is called when the input value changes.
 * @param {boolean} [props.disabled=false] - If true, the input field is disabled and cannot be interacted with.
 * @param {Partial<FormFieldProps>} [props.formFieldProps] - Additional properties for the form field.
 * @returns {JSX.Element} A styled text field component with a label, instructions, and an input field.
 * @example
 * <TextField
 *     title="Username"
 *     instructions="Please enter your username."
 *     error="Username is required."
 *     name="username"
 *     required
 *     clearable
 *     onChange={(value) => console.log(value)}
 *     disabled={false}
 *     placeholder="Enter your username"
 *     maxLength={20}
 *     counter
 * />
 */
export const TextField = ({
    title,
    instructions,
    error,
    errorPosition = 'top',
    name,
    required,
    optional,
    clearable,
    onChange,
    disabled,
    formFieldProps,
    counter,
    value,
    ...textInputProps
}: TextFieldProps) => {
    const [fieldValue, setFieldValue] = React.useState(value || '');

    useEffect(() => {
        setFieldValue(value || '');
    }, [value]);

    const handleSetValue = (newValue: string) => {
        if (onChange === undefined) return setFieldValue(newValue);
        onChange?.(newValue, name);
        return setFieldValue(newValue);
    };

    const isError = !!error;
    const length = fieldValue.length;
    return (
        <FormField
            className="dep-input-text-field dep-input-form-field"
            title={title}
            disabled={disabled}
            instructions={instructions}
            required={required}
            optional={optional}
            error={error}
            errorPosition={errorPosition}
            {...formFieldProps}
        >
            <TextInput
                fullWidth
                error={isError}
                value={fieldValue}
                name={name}
                required={required}
                disabled={disabled}
                endAdornment={clearable && fieldValue ? clearInputButton(() => handleSetValue('')) : undefined}
                {...textInputProps}
                inputProps={{ ...textInputProps.inputProps, maxLength: textInputProps.maxLength }}
                onChange={handleSetValue}
            />
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '8px', pt: '0.25em' }}>
                {counter && textInputProps.maxLength && (
                    <BodyText size="small" sx={{ color: colors.type.regular.secondary }}>
                        {length}/{textInputProps.maxLength}
                    </BodyText>
                )}
            </Box>
        </FormField>
    );
};

export const TextAreaField = ({ ...textFieldProps }: Omit<TextFieldProps, 'multiline' | 'minRows' | 'maxRows'>) => {
    return <TextField sx={{ height: 'unset' }} multiline minRows={3} maxRows={6} {...textFieldProps} />;
};

interface CustomTextFieldProps extends Omit<MuiTextFieldProps, 'variant'> {
    customLabel?: string;
}

export const CustomTextField: React.FC<CustomTextFieldProps> = ({ sx, ...props }) => {
    const theme = useTheme();
    return (
        <MuiTextField
            {...props}
            sx={[
                {
                    '& .MuiOutlinedInput-root': {
                        display: 'flex',
                        minHeight: '48px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        alignSelf: 'stretch',
                        borderRadius: '8px',
                        boxShadow: `0 0 0 1px ${colors.surface.gray[80]} inset`,
                        caretColor: colors.surface.blue[90],
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '1px', // Default outline
                            borderColor: colors.surface.gray[80],
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '2px', // 2px black outline on hover
                            borderColor: theme.palette.text.primary,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '0px', // No outline when focused
                            borderColor: 'transparent',
                        },
                        '&.Mui-focused': {
                            boxShadow: `0 0 0 4px ${colors.focus.regular.outer}`,
                        },
                        '&:has(:disabled) .MuiOutlinedInput-notchedOutline': {
                            borderWidth: '1px', // Ensure outline for disabled state
                            borderColor: colors.surface.gray[80],
                        },
                    },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        />
    );
};
