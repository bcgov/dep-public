import React, { useEffect } from 'react';
import { Box, FormControlLabel, Grid2 as Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { textInputStyles } from 'components/common/Input/TextInput';
import { useFetcher } from 'react-router';
import { BodyText } from 'components/common/Typography/Body';
import { When } from 'react-if';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/pro-regular-svg-icons';
import { colors } from 'styles/Theme';
import { useFormContext } from 'react-hook-form';
import { Language } from 'models/language';
import MultiSelect from './MultiSelect';
import { SystemMessage } from 'components/common/Layout/SystemMessage';
import { LanguageLoaderData } from './LanguageLoader';
import { Awaited } from 'utils';
import { ROUTES, getPath } from 'routes/routes';

export const LanguageManager = () => {
    const SINGLE_LANGUAGE = [{ code: 'en', name: 'English' }] as Language[];
    const REQUIRED_LANGUAGES = [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'French' },
    ] as Language[];
    const requiredLanguageCodes = REQUIRED_LANGUAGES.map((l) => l.code);

    const engagementForm = useFormContext();
    const { setValue, watch } = engagementForm;
    const selectedLanguages = watch('languages') as Language[];
    const fetcher = useFetcher({ key: 'language-loader' });
    const fetcherData = fetcher.data as Awaited<LanguageLoaderData>;
    const { languages: availableLanguages } = fetcherData ?? { languages: [] };

    const [searchTerm, setSearchTerm] = React.useState('');

    const determineSingleLanguage = (languages: Language[]) => {
        if (languages.length === 0) return null;
        if (languages.length === 1) return true;
        return false;
    };
    const isSingleLanguage = determineSingleLanguage(selectedLanguages);

    useEffect(() => {
        fetcher.load(`${getPath(ROUTES.LANGUAGES)}/`);
    }, []);

    return (
        <Box width="100%">
            <RadioGroup
                onChange={(e) => {
                    if (e.target.value === 'single') {
                        setValue('languages', SINGLE_LANGUAGE, { shouldDirty: true });
                    }
                    if (e.target.value === 'multi') {
                        const optionalLanguages = selectedLanguages.filter(
                            (l) => !requiredLanguageCodes.includes(l.code),
                        );
                        setValue('languages', [...REQUIRED_LANGUAGES, ...optionalLanguages], {
                            shouldDirty: true,
                            shouldValidate: true,
                        });
                    }
                }}
                aria-label="Select Engagement's Language Type"
                name="languageType"
                value={isSingleLanguage && (isSingleLanguage ? 'single' : 'multi')}
            >
                <FormControlLabel value={'single'} control={<Radio />} label="English Only" />
                <FormControlLabel value={'multi'} control={<Radio />} label="Multi-language" />
            </RadioGroup>
            <When condition={isSingleLanguage === false}>
                <SystemMessage status="warning">
                    Under construction - this setting currently has no effect
                </SystemMessage>
                <MultiSelect<Language>
                    containerProps={{ sx: { mt: 2 } }}
                    onChange={(_, language, reason) => {
                        if (reason === 'removeOption' && language) {
                            setValue(
                                'languages',
                                selectedLanguages.filter((l) => l.code !== language.code, {
                                    shouldDirty: true,
                                }),
                            );
                        }
                        if (reason === 'selectOption' && language) {
                            setValue('languages', [...selectedLanguages, language], {
                                shouldDirty: true,
                            });
                        }
                    }}
                    options={availableLanguages ?? []}
                    getOptionLabel={(option: Language) => `${option.name}`}
                    sx={{ maxWidth: '320px' }}
                    renderOption={(props, option, state) => {
                        return (
                            <li {...props}>
                                <Grid container direction="row" spacing={2} alignItems={'center'}>
                                    <Grid>
                                        <BodyText>{`${option.name}`}</BodyText>
                                    </Grid>
                                    {props['aria-disabled'] && (
                                        <Grid alignSelf="flex-end" marginLeft="auto">
                                            <FontAwesomeIcon icon={faCheck} color={colors.notification.success.shade} />
                                        </Grid>
                                    )}
                                </Grid>
                            </li>
                        );
                    }}
                    renderSelectedOption={(props, option, state) => {
                        return (
                            <Grid container direction="row" spacing={1} alignItems="center">
                                <Grid>
                                    <BodyText bold={requiredLanguageCodes.includes(option.code)}>
                                        {`${option.name}`}
                                        {requiredLanguageCodes.includes(option.code) && ' (Default)'}
                                    </BodyText>
                                </Grid>
                            </Grid>
                        );
                    }}
                    renderInput={(params) => {
                        return (
                            <TextField
                                value={searchTerm}
                                onBlur={() => setSearchTerm('')}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                {...params}
                                InputProps={{
                                    ...params.InputProps,
                                    placeholder: 'Select Language',
                                    sx: textInputStyles,
                                }}
                                inputProps={{
                                    ...params.inputProps,
                                    sx: {
                                        fontSize: '16px',
                                        lineHeight: '24px',
                                        color: colors.type.regular.primary,
                                        '&::placeholder': {
                                            color: colors.type.regular.secondary,
                                        },
                                        '&:disabled': {
                                            cursor: 'not-allowed',
                                        },
                                    },
                                }}
                            />
                        );
                    }}
                    buttonLabel="Add Language"
                    loading={false}
                    selectedOptions={selectedLanguages}
                    selectLabel="Add Languages"
                    selectedLabel={{ singular: 'Language Added', plural: 'Languages Added' }}
                    searchPlaceholder="Select Language"
                    getOptionDisabled={(option) => selectedLanguages.filter((l) => l.code === option.code).length > 0}
                    getOptionRequired={(option) => requiredLanguageCodes.includes(option.code)}
                />
            </When>
        </Box>
    );
};
