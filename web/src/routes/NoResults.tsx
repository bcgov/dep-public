import { Grid2 as Grid, Box } from '@mui/material';

import React from 'react';
import { useAppTranslation } from 'hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePhone } from '@fortawesome/pro-solid-svg-icons/faCirclePhone';
import { faCircleEnvelope } from '@fortawesome/pro-solid-svg-icons/faCircleEnvelope';
import { BodyText, Heading1, Heading2 } from 'components/common/Typography';
import { Link } from 'components/common/Navigation';

const SuggestionsList = ({ translate }: { translate: (key: string) => string }) => (
    <Box>
        <Heading2>{translate('NoResults.paragraph')}</Heading2>
        <ul>
            <BodyText component="li" size="small">
                {translate('NoResults.list.0')}
            </BodyText>
            <BodyText component="li" size="small">
                {translate('NoResults.list.1')}
            </BodyText>
            <BodyText component="li" size="small">
                {translate('NoResults.list.2')}
            </BodyText>
        </ul>
    </Box>
);

const NoResults = () => {
    const { t: translate } = useAppTranslation();

    return (
        <Grid container direction={'column'} spacing={1} padding={'2em 2em 1em 1em'}>
            <Grid sx={{ mr: 2, marginBottom: 3 }}>
                <Heading1 data-testid="NoResultsHeader">{translate('NoResults.header')}</Heading1>
            </Grid>
            <Grid size={6} sx={{ mr: 2, marginBottom: 3 }}>
                <SuggestionsList translate={translate} />
            </Grid>
            <Grid
                container
                direction="column"
                padding={0}
                size={12}
                maxWidth="1120px"
                height="auto"
                border="1px solid"
                borderColor="gray.10"
                overflow="clip"
                boxShadow="0px 0.6px 1.8px rgba(0, 0, 0, 0.1), 0px 3.2px 7.2px rgba(0, 0, 0, 0.13)"
                borderRadius="8px"
                display={'none'} // TODO: remove this once contact information is decided
            >
                <Grid size={12} container padding="12px 24px" bgcolor="primary.main">
                    <Grid>
                        <BodyText bold color="primary.contrastText" fontSize="20px">
                            {translate('NoResults.contact.header')}
                        </BodyText>
                    </Grid>
                </Grid>
                <Grid container padding="12px 24px" gap={24}>
                    <Grid>
                        <BodyText>{translate('NoResults.contact.paragraph')}</BodyText>
                    </Grid>
                </Grid>
                <Grid container justifyContent="space-between" padding="12px 24px">
                    {/* Telephone section */}
                    <Grid container spacing={2} size="auto" padding="12px 0px">
                        <Grid display="flex" alignItems="center">
                            <FontAwesomeIcon icon={faCirclePhone} style={{ fontSize: '32px', color: '#12508F' }} />
                            <div style={{ marginLeft: '12px' }}>
                                <BodyText bold>{translate('NoResults.contact.telephone')}</BodyText>
                                <Link>(250) 555-5555</Link>
                            </div>
                        </Grid>
                    </Grid>

                    {/* Email section */}
                    <Grid container spacing={2} size={{ xs: 12, sm: 12, md: 6 }} padding="12px 0px">
                        <Grid size={{ xs: 12, sm: 12, md: 12 }} display="flex" alignItems="center">
                            <FontAwesomeIcon icon={faCircleEnvelope} style={{ fontSize: '32px', color: '#12508F' }} />
                            <div style={{ marginLeft: '12px' }}>
                                <BodyText bold>{translate('NoResults.contact.email')}</BodyText>
                                <Link>emailaddress@gov.bc.ca</Link>
                            </div>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default NoResults;
