import React from 'react';
import Grid from '@mui/material/Grid2';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { BodyText } from 'components/common/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AppConfig } from 'config';

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
            padding={{ xs: '0 1em 0', md: '0 5vw 0', lg: '0 10em 0' }}
            color={(theme) => theme.palette.warning.contrastText}
            height="50px"
            bgcolor="gold.10"
            borderBottom="4px solid"
            borderColor="warning.main"
            textAlign="left"
            alignItems="center"
            lineHeight="28px"
        >
            <BodyText component="span" fontSize="22px" color="warning.dark">
                <FontAwesomeIcon icon={faExclamationTriangle} />
            </BodyText>
            <BodyText component="span">You are using a test environment.</BodyText>
        </Grid>
    );
};

export default EnvironmentBanner;
