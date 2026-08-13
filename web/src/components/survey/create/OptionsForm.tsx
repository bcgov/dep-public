import React, { useContext } from 'react';
import {
    Divider,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid2 as Grid,
    RadioGroup,
    Stack,
    Radio,
} from '@mui/material';
import { Button } from 'components/common/Input/Button';
import { Heading1 } from 'components/common/Typography/Headings';
import CloneOptions from './CloneOptions';
import { CreateOptions } from './CreateOptions';
import { CreateSurveyContext } from './CreateSurveyContext';
import { OptionsFormSkeleton } from './OptionsFormSkeleton';
import { When } from 'react-if';
import { Disclaimer } from './Disclaimer';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { ROUTES, getPath } from 'routes/routes';

const OptionsForm = () => {
    const { loading } = useContext(CreateSurveyContext);

    const [value, setValue] = React.useState('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue((event.target as HTMLInputElement).value);
    };

    if (loading) {
        return <OptionsFormSkeleton />;
    }

    return (
        <Grid container size={12}>
            <Grid size={12}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Heading1>New Survey</Heading1>
                </Stack>
                <Divider />
            </Grid>

            <Grid size={12}>
                <FormControl>
                    <FormLabel id="controlled-radio-buttons-group" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        I want to
                    </FormLabel>
                    <RadioGroup
                        aria-labelledby="controlled-radio-buttons-group"
                        name="controlled-radio-buttons-group"
                        value={value}
                        onChange={handleChange}
                    >
                        <FormControlLabel value="CREATE" control={<Radio />} label="Create a new Survey" />
                        <FormControlLabel value="CLONE" control={<Radio />} label="Clone an existing Survey/Template" />
                    </RadioGroup>
                </FormControl>
            </Grid>

            <When condition={value === 'CREATE'}>
                <CreateOptions />
            </When>

            <When condition={value === 'CLONE'}>
                <Grid size={12}>
                    <CloneOptions />
                </Grid>
            </When>

            <When condition={!value}>
                <Grid size={12}>
                    <Disclaimer />
                </Grid>
            </When>

            <When condition={!value}>
                <Grid size={12}>
                    <Stack direction="row" spacing={2}>
                        <Button variant="primary" disabled={true}>
                            Save &amp; Continue
                        </Button>
                        <Button href={getPath(ROUTES.SURVEYS)} LinkComponent={RouterLinkRenderer}>
                            Cancel
                        </Button>
                    </Stack>
                </Grid>
            </When>
        </Grid>
    );
};

export default OptionsForm;
