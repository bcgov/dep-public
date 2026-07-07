import React from 'react';
import Grid from '@mui/material/Grid2';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { BodyText } from 'components/common/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AppConfig } from 'config';
import { Layout } from 'styles/Theme';

const EnvironmentBanner = () => {
    const test_environments = ['test', 'testing', 'dev', 'development'];
    const current_env = AppConfig.environment.toLowerCase();
    const isTestEnvironment = test_environments.includes(current_env);
    if (!isTestEnvironment) {
        return <></>;
    }
    return (
        <Grid
            container
            direction="row"
            gap={2}
            padding={`1rem ${Layout.padding.default}`}
            width="100%"
            color={(theme) => theme.palette.warning.contrastText}
            minHeight="50px"
            bgcolor="gold.10"
            borderBottom="4px solid"
            borderColor="warning.main"
            textAlign="left"
            alignItems="center"
            flexWrap="nowrap"
            lineHeight="28px"
        >
            <Grid
                container
                flexWrap="nowrap"
                sx={{ padding: 0, margin: '0 auto', maxWidth: Layout.width.default, width: '100%', gap: '0.5em' }}
            >
                <BodyText component="span" fontSize="22px" color="warning.dark">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                </BodyText>
                <BodyText component="span">You are using a test environment.</BodyText>
            </Grid>
        </Grid>
    );
};

export default EnvironmentBanner;
