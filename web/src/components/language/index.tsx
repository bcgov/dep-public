import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import { getLanguages, getTenantLanguages, postTenantLanguage, deleteTenantLanguage } from 'services/languageService';
import { Language } from 'models/language';
import { Heading1, BodyText } from 'components/common/Typography/';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { ResponsiveContainer } from 'components/common/Layout';
import { AutoBreadcrumbs } from 'components/common/Navigation/Breadcrumb';
import { Grid2 as Grid } from '@mui/material';

export const addOrRemoveLanguage = async (
    tenantId: string,
    newTenantLanguages: Language[],
    selectedLanguages: Language[],
): Promise<string | void> => {
    if (tenantId) {
        if (newTenantLanguages.length > selectedLanguages.length) {
            const addedLanguage = newTenantLanguages.filter((language) => !selectedLanguages.includes(language))[0];
            const savedTenantLanguage = await postTenantLanguage(tenantId, addedLanguage.id);
            if (savedTenantLanguage) {
                return 'Added language to tenant.';
            }
        } else if (newTenantLanguages.length < selectedLanguages.length) {
            const removedLanguage = selectedLanguages.filter((language) => !newTenantLanguages.includes(language))[0];
            const response = await deleteTenantLanguage(tenantId, removedLanguage.id);
            if (response.status === 'success') {
                return 'Deleted language from tenant.';
            }
        }
    }
};

const LanguageAdminPanel = () => {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [existingTenantLanguages, setExistingTenantLanguages] = useState<Language[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tenantId] = useState(sessionStorage.getItem('tenantId'));
    const dispatch = useAppDispatch();
    const isSmallScreen = useMediaQuery('(min-width:700px)');

    const fetchAndSortLanguages = async () => {
        setIsLoading(true);
        const fetchedLanguages = await getLanguages();
        fetchedLanguages.sort((a, b) => a.name.localeCompare(b.name));
        setLanguages(fetchedLanguages);
        setIsLoading(false);
    };

    const fetchTenantLanguages = async (tenantId: string) => {
        const fetchedTenantLanguages = await getTenantLanguages(tenantId);
        setExistingTenantLanguages(fetchedTenantLanguages);
    };

    const handleLanguagesChange = async (newTenantLanguages: Language[]): Promise<void> => {
        setIsLoading(true);
        if (!tenantId) return;
        addOrRemoveLanguage(tenantId, newTenantLanguages, existingTenantLanguages)
            .then((message: string | void) => {
                setExistingTenantLanguages(newTenantLanguages);
                dispatch(
                    openNotification({
                        severity: 'success',
                        text: message ? message : '',
                    }),
                );
            })
            .catch((error) => {
                console.error('Error adding/removing language. ', error);
                dispatch(
                    openNotification({
                        severity: 'error',
                        text: 'Error adding or removing language.',
                    }),
                );
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (!tenantId) return;
        fetchAndSortLanguages();
        fetchTenantLanguages(tenantId);
    }, []);

    return (
        <ResponsiveContainer data-testid="language-admin-panel">
            <AutoBreadcrumbs />
            <Grid size={12}>
                <Heading1>Languages</Heading1>
            </Grid>
            <Grid size={12}>
                <BodyText>Select which languages are available for translations.</BodyText>
            </Grid>
            {languages.length > 0 && (
                <Autocomplete
                    style={{ marginTop: '5%', marginBottom: '5%', width: isSmallScreen ? '50%' : '100%' }}
                    multiple
                    disableClearable={true}
                    options={languages}
                    getOptionLabel={(option) => option.name}
                    loading={isLoading}
                    value={existingTenantLanguages}
                    onChange={(_, value) => handleLanguagesChange(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            aria-label="Press left and right arrow keys to review selected languages. Press delete to deselect a language. Type to narrow the list of available languages options."
                            variant="standard"
                            label="Selected languages"
                        />
                    )}
                />
            )}
        </ResponsiveContainer>
    );
};

export default LanguageAdminPanel;
