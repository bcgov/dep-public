import React from 'react';
import { Grid2 as Grid } from '@mui/material';
import { useNavigate } from 'react-router';
import { BodyText, Heading2 } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonToDoor } from '@fortawesome/pro-regular-svg-icons';

const Unauthorized = () => {
    const navigate = useNavigate();
    return (
        <Grid container>
            <Grid container direction="column" spacing={4}>
                <Grid size={12}>
                    <Heading2 mb={0} decorated>
                        Unauthorized
                    </Heading2>
                </Grid>
                <Grid size={12}>
                    <BodyText>
                        You don't have the necessary authorization to view the page you were trying to access. The
                        button below will return you to the page you were on previously. If you believe that this is an
                        error and you <em>should</em> have access, please contact your administrator.
                    </BodyText>
                </Grid>
                <Grid container size={12}>
                    <Grid>
                        <Button
                            variant="primary"
                            icon={<FontAwesomeIcon flip="horizontal" icon={faPersonToDoor} />}
                            onClick={() => navigate(-1)}
                        >
                            Go to previous page
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Unauthorized;
