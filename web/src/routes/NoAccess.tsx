import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faRefresh, faShieldKeyhole } from '@fortawesome/pro-regular-svg-icons';
import { Grid2 as Grid } from '@mui/material';
import { ResponsiveContainer } from 'components/common/Layout';
import { BodyText, Heading1 } from 'components/common/Typography';
import React from 'react';
import { Button } from 'components/common/Input';
import UserService from 'services/userService';

const NoAccess = () => {
    return (
        <ResponsiveContainer container sx={{ paddingLeft: { xs: '2em', md: '5vw', lg: '10em' } }}>
            <Grid container size={12} alignItems="center" spacing={1} justifyContent="flex-start">
                <Grid
                    container
                    mt={{ xs: 2, md: 4, lg: 6 }}
                    mb={{ xs: 2, md: 4, lg: 6 }}
                    size={{ xs: 12, sm: 10, md: 8, xl: 6 }}
                    alignContent="flex-start"
                    justifyContent={'flex-start'}
                    direction="column"
                    spacing={2}
                >
                    <Heading1 bold sx={{ mb: 1 }}>
                        <FontAwesomeIcon icon={faShieldKeyhole} /> Authorization Required
                    </Heading1>
                    <BodyText>
                        <b>Your IDIR login was successful,</b> but you have not been granted access to the page you
                        requested. You may be looking for another page, your account may still be pending approval, or
                        your access may have been revoked.
                    </BodyText>
                    <BodyText>
                        If this was your first time accessing the platform, our administrators have been notified of
                        your request and will review it shortly. Once your request is processed, you'll get a
                        notification email to confirm you can now access the platform with your credentials.
                    </BodyText>
                    <BodyText>
                        If you think you are seeing this message mistakenly, try reloading the page or contact your
                        administrator for assistance.
                    </BodyText>
                    <BodyText>Thank you.</BodyText>
                    <Grid container size={12} spacing={2} mt={2}>
                        <Button
                            variant="primary"
                            onClick={() => globalThis.location.reload()}
                            sx={{ width: 'fit-content' }}
                            icon={<FontAwesomeIcon icon={faRefresh} />}
                        >
                            Reload
                        </Button>
                        <Button
                            icon={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
                            onClick={UserService.doLogout}
                            href="#"
                            sx={{ width: 'fit-content' }}
                        >
                            Logout
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </ResponsiveContainer>
    );
};

export default NoAccess;
