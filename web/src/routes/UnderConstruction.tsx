import { Box, Grid2 as Grid } from '@mui/material';
import React from 'react';
import { IProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScrewdriverWrench } from '@fortawesome/pro-regular-svg-icons/faScrewdriverWrench';
import { Heading2 } from 'components/common/Typography/Headings';
import { ResponsiveContainer } from 'components/common/Layout';
import { useMatches } from 'react-router';
import { BreadcrumbTrail } from 'components/common/Navigation/Breadcrumb';
import { getPath, ROUTES } from './routes';

const UnderConstruction = React.memo(({ errorMessage = 'This page is under construction' }: IProps) => {
    const matches = useMatches();
    const isChildRoute = matches.length > 2;
    const alignment = isChildRoute ? 'center' : 'flex-start';
    return (
        <Box component={isChildRoute ? 'div' : ResponsiveContainer}>
            <Grid container justifyContent={alignment}>
                <Grid size={12} hidden={isChildRoute} mb={4}>
                    <BreadcrumbTrail
                        crumbs={[
                            {
                                name: 'Home',
                                link: getPath(ROUTES.HOME),
                            },
                            {
                                name: '[Page Under Construction]',
                            },
                        ]}
                    />
                </Grid>
                <Grid size={12} justifyContent={alignment} alignItems={alignment} container>
                    <Heading2 decorated width="max-content">
                        {errorMessage}
                    </Heading2>
                </Grid>
                <Grid size="auto" m={4}>
                    <FontAwesomeIcon
                        icon={faScrewdriverWrench}
                        style={{ padding: '20px', height: '5em', width: '5em' }}
                    />
                </Grid>
            </Grid>
        </Box>
    );
});

export default UnderConstruction;
