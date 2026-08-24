import React, { useEffect, useMemo } from 'react';
import { AuthoringButtonProps, StatusCircleProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong } from '@fortawesome/pro-light-svg-icons';
import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { BodyText, Heading2, Heading3 } from 'components/common/Typography';
import { SystemMessage } from 'components/common/Layout/SystemMessage';
import { Unless, When } from 'react-if';
import { Collapse, Grid2 as Grid, MenuItem, Select, SelectChangeEvent, Skeleton } from '@mui/material';
import { colors } from 'styles/Theme';
import { Link } from 'components/common/Navigation';
import { getDefaultAuthoringTabValues } from './AuthoringTabElements';
import { useAppDispatch, useAppSelector } from 'hooks';
import { useParams, useRouteLoaderData } from 'react-router';
import { EngagementLoaderAdminData } from '../EngagementLoaderAdmin';
import { Language } from 'models/language';
import { faGlobe } from '@fortawesome/pro-regular-svg-icons';
import {
    AUTHORING_SECTION,
    AUTHORING_SECTION_NAMES,
    useAuthoringSectionCompletion,
} from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';
import { findSectionLock } from 'components/engagement/admin/create/authoring/useResourceSectionLocks';
import LockOwnerAvatar from 'components/engagement/admin/create/authoring/LockOwnerAvatar';
import { getPath, ROUTES } from 'routes/routes';
import { saveLanguage } from 'reduxSlices/languageSlice';
import useResourceSectionLockNavigation from 'components/engagement/admin/create/authoring/useResourceSectionLockNavigation';
import { ResourceLockRecord } from 'services/resourceLockService';
import { AppConfig } from 'config';
import { useResourceLocks } from 'services/resourceLockService/useResourceLocks';

export const StatusCircle = (props: StatusCircleProps) => {
    const statusCircleStyles = {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: props.required ? colors.notification.danger.icon : colors.surface.gray[70],
        marginLeft: '0.3rem',
        display: 'inline-block',
        bottom: '0.5rem',
        position: 'relative' as const,
    };
    return <span style={statusCircleStyles}> </span>;
};

const AuthoringButton = (
    props: AuthoringButtonProps & {
        isLoading?: boolean;
        onNavigate: (item: AuthoringButtonProps['item']) => void;
        isDisabled: boolean;
    },
) => {
    // Mix with white instead of altering opacity - ensure child avatar is not dimmed
    const fadeWhenDisabled = (color: string) => {
        if (!props.isDisabled) return color;
        return `color-mix(in srgb, ${color} 60%, white)`;
    };

    const bgColor = props.item.required ? colors.surface.blue[10] : colors.surface.gray[10];

    const buttonStyles = {
        display: 'flex',
        width: '100%',
        height: '3rem',
        backgroundColor: fadeWhenDisabled(bgColor),
        borderRadius: '8px',
        border: 'none',
        padding: '0 1rem 0 2.5rem',
        margin: '0 0 0.5rem',
        alignItems: 'center',
        justifyContent: 'flex-start',
        cursor: props.isDisabled ? 'not-allowed' : 'pointer',
        color: fadeWhenDisabled(colors.type.regular.primary),
        position: 'relative' as const,
    };
    const arrowStyles = {
        color: fadeWhenDisabled(colors.surface.blue[90]),
        fontSize: '1.3rem',
        marginLeft: 'auto',
    };
    const checkStyles = {
        color: 'inherit',
        fontSize: '1rem',
        fontWeight: 'bold',
        paddingRight: '0.4rem',
    };

    if (props.isLoading) {
        return <Skeleton variant="rounded" height={48} width="100%" sx={{ mb: '0.5rem', borderRadius: '8px' }} />;
    }

    const lock = props.item.lock;

    return (
        <Link
            underline="none"
            sx={{ ...buttonStyles }}
            to={props.isDisabled ? '#' : props.item.link}
            aria-disabled={props.isDisabled}
            onClick={
                props.onNavigate
                    ? (event) => {
                          event.preventDefault();
                          props.onNavigate(props.item);
                      }
                    : undefined
            }
        >
            <LockOwnerAvatar sx={{ position: 'absolute', left: '0.5rem', cursor: 'default' }} lock={lock} size={20} />
            <When condition={props.item.completed}>
                <FontAwesomeIcon style={checkStyles} icon={faCheck} />
            </When>
            <BodyText color="inherit">{props.item.title}</BodyText>
            <Unless condition={props.item.completed}>
                <StatusCircle required={props.item.required} />
            </Unless>
            <FontAwesomeIcon style={arrowStyles} icon={faArrowRightLong} />
        </Link>
    );
};

export const AuthoringTab = () => {
    const { engagementId } = useParams();
    const { engagement, languages, locks } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const resolvedEngagement = React.use(engagement);
    const resolvedLanguages = React.use(languages);
    const defaultLanguage = useMemo(
        () => ({
            id: 0,
            code: AppConfig.language.defaultLanguageId,
            name: AppConfig.language.defaultLanguageName,
            right_to_left: AppConfig.language.defaultRightToLeft,
        }),
        [],
    );
    const selectedLanguage = useAppSelector((state) => state.language);
    const selectedLanguageCode = selectedLanguage?.id ?? defaultLanguage.code;
    const dispatch = useAppDispatch();
    const setSelectedLanguage = (language: Language) => {
        if (!language?.id) return;
        dispatch(saveLanguage({ id: language.code, name: language.name }));
    };
    const languageOptions = resolvedLanguages;
    const linkedSurveyId = useMemo(() => {
        const selectedSurveyId = Number(resolvedEngagement.selected_survey_id);
        if (Number.isFinite(selectedSurveyId) && selectedSurveyId > 0) {
            return selectedSurveyId;
        }

        const firstSurveyId = Number(resolvedEngagement.surveys?.[0]?.id);
        return Number.isFinite(firstSurveyId) && firstSurveyId > 0 ? firstSurveyId : null;
    }, [resolvedEngagement]);
    const selectedLanguageCodes = useMemo(() => {
        if (languageOptions.length > 0) {
            return languageOptions.map((language) => language.code);
        }

        return ['en'];
    }, [languageOptions]);
    const numericEngagementId = Number(engagementId);
    const {
        completionBySection,
        requiredSectionsComplete,
        isLoading: isLoadingSectionCompletion,
    } = useAuthoringSectionCompletion({
        engagementId: numericEngagementId,
        languageCode: selectedLanguageCode,
        selectedLanguageCodes,
        engagementPromise: engagement,
    });
    const { locks: liveLocks } = useResourceLocks({
        resourceId: numericEngagementId,
        initialLocksPromise: locks,
    });
    const selectedLanguageId = languageOptions.find((language) => language.code === selectedLanguageCode)?.id;
    const locksBySection = useMemo(() => {
        const entries = AUTHORING_SECTION_NAMES.map((sectionName) => {
            if (sectionName === AUTHORING_SECTION.SURVEY && linkedSurveyId) {
                return [sectionName, null] as const;
            }

            return [
                sectionName,
                findSectionLock({
                    locks: liveLocks,
                    sectionName,
                    languageId: selectedLanguageId,
                }),
            ] as const;
        });

        return Object.fromEntries(entries) as Record<
            (typeof AUTHORING_SECTION_NAMES)[number],
            ResourceLockRecord | null
        >;
    }, [linkedSurveyId, liveLocks, selectedLanguageId]);
    const { breakLockModal, resolveSectionLockState, requestNavigation } = useResourceSectionLockNavigation();

    const sectionValues = useMemo(
        () =>
            getDefaultAuthoringTabValues('sections', engagementId ?? '', selectedLanguageCode).map((section) => ({
                ...section,
                completed: completionBySection[section.title] ?? false,
                lock: locksBySection[section.title] ?? undefined,
            })),
        [completionBySection, engagementId, locksBySection, selectedLanguage],
    );

    const feedbackMethods = useMemo(
        () =>
            getDefaultAuthoringTabValues('feedback', engagementId ?? '', selectedLanguageCode).map((method) => ({
                ...method,
                link:
                    method.title === AUTHORING_SECTION.SURVEY && linkedSurveyId
                        ? getPath(ROUTES.SURVEY_PREVIEW, { surveyId: linkedSurveyId })
                        : method.link,
                completed: completionBySection[method.title] ?? false,
                lock:
                    method.title === AUTHORING_SECTION.SURVEY && linkedSurveyId
                        ? undefined
                        : (locksBySection[method.title] ?? undefined),
            })),
        [engagementId, completionBySection, linkedSurveyId, locksBySection, selectedLanguage],
    );
    const feedbackCompleted = feedbackMethods.some((method) => method.completed);
    const optionalSectionValues = useMemo(() => sectionValues.filter((section) => !section.required), [sectionValues]);

    const availableLanguageOptions = languageOptions.length > 0 ? languageOptions : [defaultLanguage as Language];

    const languageSelectWidthCh = useMemo(() => {
        const longestOptionLength = availableLanguageOptions.reduce((maxLength, language) => {
            const labelLength = `${language.name}${language.code === 'en' ? ' (Default)' : ''}`.length;
            return Math.max(maxLength, labelLength);
        }, 0);

        // Add extra space for select padding and dropdown icon.
        return longestOptionLength + 5;
    }, [availableLanguageOptions]);

    // Define styles
    const systemMessageStyles = {
        marginBottom: '1.5rem',
    };
    const sectionLabelStyles = {
        textTransform: 'uppercase',
        marginBottom: '1.1rem',
        fontSize: '0.875rem',
    };
    const anchorContainerStyles = {
        margin: '0 0 2.5rem 0',
        padding: '0',
    };

    useEffect(() => {
        const hasCurrentSelection = resolvedLanguages.some((language) => language.code === selectedLanguageCode);
        if (!hasCurrentSelection) {
            setSelectedLanguage(defaultLanguage);
        }
    }, [defaultLanguage, resolvedLanguages, selectedLanguageCode]);

    const handleLanguageSelectionChange = (event: SelectChangeEvent<string>) => {
        setSelectedLanguage(
            availableLanguageOptions.find((language) => language.code === event.target.value) ?? defaultLanguage,
        );
    };

    return (
        <Grid container id="admin-authoring-section" direction="column" maxWidth={'700px'}>
            {breakLockModal}
            <Grid container direction="row" justifyContent="space-between" mb="1.5rem" rowGap={1}>
                <Grid>
                    <Heading2 decorated>Authoring</Heading2>
                    <Heading3 bold>Page Section Authoring</Heading3>
                </Grid>
                <Grid pt={1}>
                    <Grid container alignItems="center" columnSpacing={1}>
                        <Grid>
                            <FontAwesomeIcon
                                icon={faGlobe}
                                aria-hidden="true"
                                style={{ color: colors.type.regular.secondary }}
                            />
                        </Grid>
                        <Grid>
                            <Select
                                sx={{ height: '2.5rem', width: `${languageSelectWidthCh}ch` }}
                                id="authoring-overview-language-select"
                                value={selectedLanguageCode}
                                onChange={handleLanguageSelectionChange}
                                inputProps={{
                                    'aria-label': 'Select language for authoring overview',
                                    'aria-describedby': 'authoring-overview-language-select-description',
                                }}
                            >
                                {availableLanguageOptions.map((language) => (
                                    <MenuItem key={language.code} value={language.code}>
                                        {language.name}
                                        {language.code === 'en' ? ' (Default)' : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <span
                            id="authoring-overview-language-select-description"
                            style={{
                                border: 0,
                                clip: 'rect(0 0 0 0)',
                                height: '1px',
                                margin: '-1px',
                                overflow: 'hidden',
                                padding: 0,
                                position: 'absolute',
                                width: '1px',
                            }}
                        >
                            Selecting a language changes which language version of each authoring section link is
                            opened.
                        </span>
                    </Grid>
                </Grid>
            </Grid>
            <Collapse
                in={!isLoadingSectionCompletion && !requiredSectionsComplete}
                appear
                timeout={150}
                easing="ease-in"
            >
                <SystemMessage sx={systemMessageStyles} status="danger">
                    There are incomplete or missing sections of required content in your engagement. Please complete all
                    required content in all of the languages included in your engagement.
                </SystemMessage>
            </Collapse>
            <Grid
                container
                direction="row"
                id="sections-container"
                sx={{
                    ...anchorContainerStyles,
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                    columnGap: '5rem',
                    rowGap: '1.25rem',
                }}
            >
                <Grid size={{ xs: 12, md: 6 }}>
                    <BodyText bold sx={sectionLabelStyles}>
                        Required Sections
                    </BodyText>
                    {sectionValues.map((section) =>
                        section.required ? (
                            <AuthoringButton
                                key={section.id}
                                item={section}
                                isLoading={isLoadingSectionCompletion}
                                isDisabled={resolveSectionLockState(section.lock).isDisabled}
                                onNavigate={(item) => {
                                    requestNavigation({
                                        href: item.link,
                                        sectionName: item.title,
                                        lock: item.lock,
                                    });
                                }}
                            />
                        ) : null,
                    )}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <BodyText bold sx={sectionLabelStyles}>
                        Optional Sections
                    </BodyText>
                    {optionalSectionValues.map((section) => (
                        <AuthoringButton
                            key={section.id}
                            item={section}
                            isLoading={isLoadingSectionCompletion}
                            isDisabled={resolveSectionLockState(section.lock).isDisabled}
                            onNavigate={(item) => {
                                requestNavigation({
                                    href: item.link,
                                    sectionName: item.title,
                                    lock: item.lock,
                                });
                            }}
                        />
                    ))}
                </Grid>
            </Grid>
            <Grid container direction="column" id="feedback-container" sx={{ ...anchorContainerStyles }}>
                <Heading3 bold mb="1.5rem">
                    Feedback Configuration
                </Heading3>
                <Collapse in={!isLoadingSectionCompletion && !feedbackCompleted} appear timeout={150} easing="ease-in">
                    <SystemMessage sx={systemMessageStyles} status="danger">
                        There are feedback methods included in your engagement that are incomplete. Please complete
                        configuration for all of the feedback methods included in your engagement.
                    </SystemMessage>
                </Collapse>
                <BodyText bold sx={sectionLabelStyles}>
                    Feedback Methods
                </BodyText>
                <Grid size={12} sx={{ width: '100%' }}>
                    {feedbackMethods.map((method) => (
                        <AuthoringButton
                            item={method}
                            key={method.id}
                            isLoading={isLoadingSectionCompletion}
                            isDisabled={resolveSectionLockState(method.lock).isDisabled}
                            onNavigate={(item) => {
                                requestNavigation({
                                    href: item.link,
                                    sectionName: item.title,
                                    lock: item.lock,
                                });
                            }}
                        />
                    ))}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default AuthoringTab;
