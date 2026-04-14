import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

type HeadingWeight = 'bold' | 'regular' | 'thin';

type HeadingProps = {
    children: React.ReactNode;
    weight?: HeadingWeight;
    bold?: boolean;
    component?: React.ElementType;
} & TypographyProps;

const fontWeight = (weight?: string | number) => {
    switch (weight) {
        case 'bold':
            return 700;
        case 'regular':
            return 400;
        case 'thin':
            return 200;
        default:
            return weight;
    }
};

/**
 * Heading1 component for rendering a primary heading.
 * This component uses the MUI Typography component to render a heading with customizable styles.
 * @param {props.children} - The content of the heading.
 * @param {props.weight} - The font weight of the heading, can be 'bold', 'regular', or 'thin'.
 * @param {props.bold} - Shortcut for setting font weight to bold, takes precedence over the weight prop if both are provided.
 * @param {props.component} - The HTML element to use for the heading, defaults to 'h1'.
 * @param {props} - Additional props to pass to the Typography component.
 * @returns JSX.Element: A styled heading element.
 */
export const Heading1 = ({ children, weight, bold, component, ...props }: HeadingProps) => {
    return (
        <Typography
            component={component || 'h1'}
            variant="h1"
            lineHeight="1.5"
            fontSize="2rem"
            marginBottom="1.5rem"
            marginTop="1.5rem"
            fontWeight={bold ? 'bold' : fontWeight(weight)}
            {...props}
        >
            {children}
        </Typography>
    );
};

/**
 * Heading2 component for rendering a secondary heading.
 * This component uses the MUI Typography component to render a heading with optional decoration and customizable styles.
 * @param {props.children} - The content of the heading.
 * @param {props.decorated} - Whether to add a decorative line above the heading.
 * @param {props.weight} - The font weight of the heading, can be 'bold', 'regular', or 'thin'.
 * @param {props.bold} - Shortcut for setting font weight to bold, takes precedence over the weight prop if both are provided.
 * @param {props.component} - The HTML element to use for the heading, defaults to 'h2'.
 * @param {props} - Additional props to pass to the Typography component.
 * @returns JSX.Element: A styled heading element with optional decoration.
 */
export const Heading2 = ({
    children,
    decorated = false,
    weight,
    bold,
    component,
    ...props
}: HeadingProps & {
    decorated?: boolean;
}) => {
    return (
        <Typography
            variant="h2"
            component={component || 'h2'}
            lineHeight="1.5"
            fontSize="1.5rem"
            mb="1.5rem"
            mt="0.5rem"
            fontWeight={bold ? 'bold' : fontWeight(weight)}
            {...props}
            sx={[
                {
                    '&::before': decorated
                        ? {
                              backgroundColor: 'gold.60',
                              content: '""',
                              display: 'block',
                              width: '40px',
                              height: '4px',
                              position: 'relative',
                              bottom: '4px',
                          }
                        : {},
                },
                ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
            ]}
        >
            {children}
        </Typography>
    );
};

/**
 * Heading3 component for rendering a tertiary heading.
 * This component uses the MUI Typography component to render a heading with customizable styles.
 * @param {props.children} - The content of the heading.
 * @param {props.weight} - The font weight of the heading, can be 'bold', 'regular', or 'thin'.
 * @param {props.bold} - Shortcut for setting font weight to bold, takes precedence over the weight prop if both are provided.
 * @param {props.component} - The HTML element to use for the heading, defaults to 'h3'.
 * @param {props} - Additional props to pass to the Typography component.
 * @returns JSX.Element: A styled heading element.
 */
export const Heading3 = ({
    children,
    weight,
    bold,
    component,
    ...props
}: {
    children: React.ReactNode;
    weight?: HeadingWeight;
    component?: React.ElementType;
} & HeadingProps) => {
    return (
        <Typography
            component={component || 'h3'}
            variant="h3"
            lineHeight={1.5}
            fontSize="1.25rem"
            fontStyle="normal"
            fontWeight={bold ? 'bold' : fontWeight(weight)}
            {...props}
        >
            {children}
        </Typography>
    );
};

/**
 * Heading4 component for rendering a quaternary heading.
 * This component uses the MUI Typography component to render a heading with customizable styles.
 * @param {Object} props - Additional props to pass to the Typography component.
 * @param {React.ReactNode} props.children - The content of the heading.
 * @param {string} props.weight - The font weight of the heading, can be 'bold', 'regular', or 'thin'.
 * @param {boolean} props.bold - Whether to apply bold styling to the heading.
 * @param {React.ElementType} props.component - The HTML element to use for the heading, defaults to 'h4'.
 * @returns JSX.Element: A styled heading element.
 */
export const Heading4 = ({
    children,
    weight = 'bold',
    bold,
    component,
    ...props
}: {
    children: React.ReactNode;
    weight?: HeadingWeight;
    bold?: boolean;
    component?: React.ElementType;
} & TypographyProps) => {
    return (
        <Typography
            component={component || 'h4'}
            variant="h4"
            lineHeight="1.5"
            fontSize="1.125rem"
            fontStyle="normal"
            fontWeight={bold ? 'bold' : fontWeight(weight)}
            {...props}
        >
            {children}
        </Typography>
    );
};

const Headers = {
    Heading1,
    Heading2,
    Heading3,
    Heading4,
};

export default Headers;
