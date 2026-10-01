import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { colors } from 'styles/Theme';

/**
 * A component that displays body text with customizable styles.
 * It supports different font weights (bold, thin) and sizes (small, regular, large).
 * @param {Object} props - The component props.
 * @param {boolean} [props.bold] - If true, the text will be bold.
 * @param {boolean} [props.thin] - If true, the text will be thin.
 * @param {string} [props.size='regular'] - The size of the text, can be 'small', 'regular', or 'large'.
 * @param {React.ReactNode} props.children - The content to display within the body text.
 * @returns {JSX.Element} A styled Typography component with the specified text styles.
 * @example
 * <BodyText thin size="large">This is large thin text.</BodyText>
 * <BodyText bold size="small">This is small bold text.</BodyText>
 * <BodyText>This is regular text.</BodyText>
 */
export const BodyText = ({
    bold,
    thin,
    size = 'regular',
    children,
    ...props
}: {
    bold?: boolean;
    thin?: boolean;
    size?: 'tiny' | 'small' | 'regular' | 'large' | 'huge';
    children: React.ReactNode;
} & TypographyProps) => {
    const fontSize = {
        tiny: '12px',
        small: '14px',
        regular: '16px',
        large: '18px',
        huge: '20px',
    }[size];
    const lineHeight = {
        tiny: '18px',
        small: '22px',
        regular: '24px',
        large: '24px',
        huge: '28px',
    }[size];
    const fontWeight = () => {
        if (bold) {
            return 700;
        }
        if (thin) {
            return 300;
        }
        return 400;
    };
    return (
        <Typography fontWeight={fontWeight()} fontSize={fontSize} lineHeight={lineHeight} {...props}>
            {children}
        </Typography>
    );
};

/**
 * Displays an error message with an icon.
 * If no error message is provided, it returns null.
 * @param {Object} props - The component props.
 * @param {string} [props.error] - The error message to display.
 * @returns {JSX.Element|null} A styled error message or null if no error is provided.
 * @example
 * <ErrorMessage error="Maximum length exceeded." />
 * <ErrorMessage error="Invalid input." />
 */
export const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
        <BodyText bold size="small" sx={{ color: colors.notification.error.shade, lineHeight: '24px' }}>
            <FontAwesomeIcon
                icon={faExclamationCircle}
                style={{ marginRight: '8px', fontSize: '18px', position: 'relative', top: '2px' }}
            />
            {error}
        </BodyText>
    );
};

/**
 * A component that displays eyebrow text, typically used for headings or introductory text.
 * It uses a larger font size and a lighter font weight for emphasis.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The content to display within the eyebrow text.
 * @returns {JSX.Element} A styled Typography component with eyebrow text styles.
 * @example
 * <EyebrowText>This is eyebrow text.</EyebrowText>
 */
export const EyebrowText = ({
    children,
    ...props
}: {
    children: React.ReactNode;
} & TypographyProps) => {
    return (
        <Typography variant="body1" fontSize="24px" lineHeight="normal" fontWeight={300} {...props}>
            {children}
        </Typography>
    );
};
