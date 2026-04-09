import React, { Suspense, useState } from 'react';
import { Await, useNavigate, useRouteLoaderData, useRevalidator } from 'react-router';
import { ClickAwayListener, Grid2 as Grid, Stack, InputAdornment, Tooltip, Skeleton, Paper } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/pro-regular-svg-icons/faCopy';
import SettingsTable from './SettingsTable';
import SearchBar from './SearchBar';
import { getBaseUrl } from 'helper';
import { Button, FormField, TextInput } from 'components/common/Input';
import { updateSurveyReportSettings } from 'services/surveyService/reportSettingsService';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { updatedDiff } from 'deep-object-diff';
import { SurveyLoaderData } from '../building/SurveyLoader';
import { BodyText, Heading3 } from 'components/common/Typography';

const SettingsFormPage = () => {
    return (
        <Grid
            container
            spacing={2}
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1000px', mt: '3rem' }}
        >
            <Paper elevation={0} sx={{ padding: '3rem', mr: '1rem' }}>
                <Heading3 style={{ fontWeight: 'bold', marginBottom: '3rem' }}>Report Settings</Heading3>
                <SettingsForm />
            </Paper>
        </Grid>
    );
};

const SettingsForm = () => {
    const { survey, slug, reportSettings } = useRouteLoaderData('survey') as SurveyLoaderData;
    const [searchTerm, setSearchTerm] = useState<string>('');
    const engagementSlug = slug?.slug;
    const [displayedSettings, setDisplayedSettings] = useState<{ [key: number]: boolean }>({});
    const [copyTooltip, setCopyTooltip] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { revalidate } = useRevalidator();

    if (!reportSettings) navigate(-1);

    const handleNavigateOnSave = () => {
        if (survey?.engagement_id) {
            navigate(-1);
            return;
        }
        navigate(`/surveys`);
    };

    const handleSaveSettings = async () => {
        if (!reportSettings || !Array.isArray(reportSettings) || reportSettings.length === 0) return;
        const currentSettings = reportSettings.map((setting) => {
            return {
                ...setting,
                display: displayedSettings[setting.id],
            };
        });
        const diff = updatedDiff(reportSettings, currentSettings);
        const diffKeys = Object.keys(diff);
        const updatedSettings = diffKeys.map((key) => currentSettings[Number(key)]);
        if (Array.isArray(reportSettings) && reportSettings?.length <= 0) {
            handleNavigateOnSave();
            return;
        }

        try {
            await updateSurveyReportSettings(String(survey?.id), updatedSettings);
            revalidate();
            dispatch(
                openNotification({
                    severity: 'success',
                    text: 'Settings saved successfully.',
                }),
            );
            handleNavigateOnSave();
        } catch {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'Error occurred while saving settings. Please try again.',
                }),
            );
        }
    };

    const baseUrl = getBaseUrl();
    const engagementUrl = !engagementSlug
        ? 'Link will appear when the survey is linked to an engagement'
        : `${baseUrl}/${engagementSlug}/dashboard/public`;

    const handleTooltipClose = () => {
        setCopyTooltip(false);
    };

    const handleCopyUrl = () => {
        if (!engagementSlug) return;
        setCopyTooltip(true);
        navigator.clipboard.writeText(engagementUrl);
    };

    return (
        <Grid container spacing={2}>
            <Grid size={6}>
                <FormField title="Link to Public Dashboard Report">
                    <Tooltip
                        title="Link copied!"
                        slotProps={{
                            tooltip: { sx: { backgroundColor: 'primary.main' } },
                            popper: { disablePortal: true, sx: { pointerEvents: 'none' } },
                        }}
                        sx={{ height: '40px', pr: 0 }}
                        onClose={handleTooltipClose}
                        open={copyTooltip}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        placement="top-end"
                    >
                        <div style={{ width: '100%' }}>
                            <TextInput
                                fullWidth
                                id="engagement-name"
                                disabled
                                value={engagementUrl}
                                sx={{
                                    pt: 0,
                                    pb: 0,
                                    '.MuiInputBase-input': {
                                        marginRight: 0,
                                    },
                                    '.MuiInputBase-root': {
                                        padding: 0,
                                    },
                                }}
                                size="small"
                                endAdornment={
                                    engagementSlug && (
                                        <ClickAwayListener onClickAway={handleTooltipClose}>
                                            <InputAdornment position="end" sx={{ height: '100%', maxHeight: '100%' }}>
                                                <Button
                                                    sx={{ borderRadius: '0 8px 8px 0px', marginRight: '-1rem' }}
                                                    disableElevation
                                                    onClick={handleCopyUrl}
                                                >
                                                    <FontAwesomeIcon icon={faCopy} style={{ fontSize: '20px' }} />
                                                </Button>
                                            </InputAdornment>
                                        </ClickAwayListener>
                                    )
                                }
                            />
                        </div>
                    </Tooltip>
                </FormField>
            </Grid>
            <Grid size={6}>
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </Grid>
            <Grid size={12}>
                <BodyText bold>Select the questions you would like to display on the public report</BodyText>
            </Grid>
            <Grid size={12}>
                <Suspense fallback={<Skeleton variant="rectangular" height="10em" width="100%" />}>
                    <Await resolve={reportSettings}>
                        <SettingsTable
                            displayedMap={displayedSettings}
                            setDisplayedMap={setDisplayedSettings}
                            searchTerm={searchTerm}
                        />
                    </Await>
                </Suspense>
            </Grid>
            <Grid>
                <Stack direction="row" spacing={2}>
                    <Button variant="primary" onClick={handleSaveSettings} data-testid="survey/report/save-button">
                        Save
                    </Button>
                    <Button onClick={() => navigate(`/surveys/${survey?.id}/build`)}>Back</Button>
                </Stack>
            </Grid>
        </Grid>
    );
};

export default SettingsFormPage;
