import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { useNavigate, useRevalidator, useParams } from 'react-router';
import { ClickAwayListener, Grid2 as Grid, Stack, InputAdornment, Tooltip, Skeleton } from '@mui/material';
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
import { ROUTES, getPath } from 'routes/routes';
import { RouterLinkRenderer } from 'components/common/Navigation/Link';
import { AppConfig } from 'config';
import { useSurveyLoaderData } from '../useSurveyLoaderData';
import { Awaited } from 'utils';
import {
    getLockConflictPayload,
    LOCK_TOKEN_HEADER,
    RESOURCE_TYPE_SURVEY,
    SECTION_SURVEY_REPORT_SETTINGS,
    findScopedSectionLock,
} from 'services/resourceLockService';
import { useResourceLocks } from 'services/resourceLockService/useResourceLocks';
import { useEngagementSectionEditLock } from 'services/resourceLockService/useEngagementSectionEditLock';
import useResourceSectionLockNavigation from 'components/engagement/admin/create/authoring/useResourceSectionLockNavigation';

const SettingsFormPage = () => {
    return (
        <Grid container size={12}>
            <Heading3 style={{ fontWeight: 'bold', marginBottom: '3rem' }}>Report Settings</Heading3>
            <Suspense fallback={<Skeleton variant="rectangular" height="10em" width="100%" />}>
                <SettingsForm />
            </Suspense>
        </Grid>
    );
};

const SettingsForm = () => {
    const surveyId = useParams<{ surveyId: string }>().surveyId ?? 0;
    const loaderData = useSurveyLoaderData();
    const survey = React.use(loaderData.survey) as Awaited<SurveyLoaderData>['survey'];
    const engagement = React.use(loaderData.engagement) as Awaited<SurveyLoaderData>['engagement'];
    const reportSettings = React.use(loaderData.reportSettings) as Awaited<SurveyLoaderData>['reportSettings'];
    const [searchTerm, setSearchTerm] = useState<string>('');
    const engagementSlug = engagement?.slug;
    const [displayedSettings, setDisplayedSettings] = useState<{ [key: number]: boolean }>({});
    const [copyTooltip, setCopyTooltip] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { revalidate } = useRevalidator();
    const language = sessionStorage.getItem('languageId') ?? AppConfig.language.defaultLanguageId;

    const { locks: liveLocks, refreshLocks } = useResourceLocks({
        resourceId: survey?.id ?? 0,
        resourceType: RESOURCE_TYPE_SURVEY,
        initialLocksPromise: loaderData.locks,
    });
    const conflictingSettingsLock = useMemo(() => {
        const lock = findScopedSectionLock({
            locks: liveLocks,
            sectionKey: SECTION_SURVEY_REPORT_SETTINGS,
            languageScoped: false,
        });
        if (!lock || lock.is_mine) {
            return null;
        }
        return lock;
    }, [liveLocks]);
    const refreshConflictState = useCallback(async () => {
        await refreshLocks();
    }, [refreshLocks]);
    const handleBackFromLockConflict = useCallback(() => {
        navigate(getPath(ROUTES.SURVEY_BUILD, { surveyId: survey?.id ?? surveyId }));
    }, [navigate, survey?.id]);
    const { conflictLockModal } = useResourceSectionLockNavigation({
        conflictModal: {
            lock: conflictingSettingsLock,
            sectionName: 'Report Settings',
            onBack: handleBackFromLockConflict,
            onRetry: refreshConflictState,
            onAfterBreakLock: refreshConflictState,
        },
    });
    const { activeLockToken } = useEngagementSectionEditLock({
        resourceId: survey?.id ?? 0,
        resourceType: RESOURCE_TYPE_SURVEY,
        scope: { sectionKey: SECTION_SURVEY_REPORT_SETTINGS },
        enabled: Boolean(survey?.id),
        isDirty: true,
        isSubmitting: isSaving,
        blockedByLock: conflictingSettingsLock,
        onConflict: async (error) => {
            const conflictPayload = getLockConflictPayload(error);
            if (conflictPayload) {
                await refreshConflictState();
                return;
            }

            const message = error instanceof Error ? error.message : 'Unable to acquire edit lock for report settings.';
            dispatch(
                openNotification({
                    severity: 'error',
                    text: message,
                }),
            );
        },
    });

    if (!reportSettings) navigate(-1);

    const handleNavigateOnSave = () => {
        if (survey?.engagement_id) {
            navigate(-1);
            return;
        }
        navigate(getPath(ROUTES.SURVEYS));
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
            setIsSaving(true);
            await updateSurveyReportSettings(
                String(survey?.id),
                updatedSettings,
                activeLockToken ? { [LOCK_TOKEN_HEADER]: activeLockToken } : undefined,
            );
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
        } finally {
            setIsSaving(false);
        }
    };

    const baseUrl = getBaseUrl();
    const engagementUrl = !engagementSlug
        ? 'Link will appear when the survey is linked to an engagement'
        : `${baseUrl}${getPath(ROUTES.PUBLIC_DASHBOARD_BY_SLUG, { slug: engagementSlug, dashboardType: 'report', language })}`;

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
            {conflictLockModal}
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
                    <SettingsTable
                        displayedMap={displayedSettings}
                        setDisplayedMap={setDisplayedSettings}
                        searchTerm={searchTerm}
                        surveyReportSettings={reportSettings ?? []}
                    />
                </Suspense>
            </Grid>
            <Grid>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="primary"
                        onClick={handleSaveSettings}
                        disabled={isSaving || Boolean(conflictingSettingsLock)}
                        data-testid="survey/report/save-button"
                    >
                        Save
                    </Button>
                    <Button LinkComponent={RouterLinkRenderer} href={getPath(ROUTES.SURVEY_BUILD, { surveyId })}>
                        Back
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    );
};

export default SettingsFormPage;
