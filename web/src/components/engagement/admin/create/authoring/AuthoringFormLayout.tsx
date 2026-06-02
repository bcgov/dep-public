import React from 'react';
import { Grid2 as Grid, Grid2Props as GridProps } from '@mui/material';
import { BodyText } from 'components/common/Typography/Body';

export const AuthoringFormContainer = ({
    children,
    isHydrating = false,
    sx,
    ...formContainerProps
}: { children: React.ReactNode; isHydrating?: boolean } & GridProps) => {
    return (
        <Grid
            className="dep-layout-authoring-form-container"
            container
            display="flex"
            flexDirection="column"
            columnGap="0.5rem"
            rowGap="1.5rem"
            maxWidth="700px"
            sx={[
                {
                    transition: 'opacity 0.15s',
                    opacity: isHydrating ? 0.5 : 1,
                    pointerEvents: isHydrating ? 'none' : undefined,
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...formContainerProps}
        >
            {children}
        </Grid>
    );
};

export const UnnamedAuthoringFormSection = ({ children, required, ...props }: { required?: boolean } & GridProps) => {
    return (
        <Grid
            container
            direction="column"
            className="dep-layout-authoring-form-grid-item dep-layout-authoring-form-section"
            borderRadius="16px"
            padding="2rem 1.5rem"
            columnGap="0.5rem"
            rowGap="1.5rem"
            bgcolor={required ? 'blue.10' : 'gray.10'}
            {...props}
        >
            {children}
        </Grid>
    );
};

export const AuthoringFormSection = ({
    children,
    required,
    name,
    details,
    labelFor,
    ...formSectionProps
}: {
    children: React.ReactNode;
    required?: boolean;
    name?: string;
    details?: string;
    labelFor?: string;
} & GridProps) => {
    return (
        <UnnamedAuthoringFormSection required={required} {...formSectionProps}>
            <Grid
                container
                className="dep-layout-authoring-form-section-title"
                direction="column"
                component={labelFor ? 'label' : 'div'}
                htmlFor={labelFor}
            >
                <Grid container direction="column" lineHeight="24px" gap="0.5rem">
                    {name && (
                        <Grid lineHeight="1.5" color="text.primary" fontWeight="700">
                            {name}
                            <BodyText display="inline">{required ? ' (Required)' : ' (Optional)'}</BodyText>
                        </Grid>
                    )}
                    {details && (
                        <Grid fontSize="0.875rem" lineHeight={12 / 7} letterSpacing="-0.013rem">
                            {details}
                        </Grid>
                    )}
                </Grid>
            </Grid>
            {children}
        </UnnamedAuthoringFormSection>
    );
};
