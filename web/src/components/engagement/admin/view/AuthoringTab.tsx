import React, { useState, useEffect, useMemo } from 'react';
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
import { useAppSelector } from 'hooks';
import { useParams, useRouteLoaderData } from 'react-router';
import { EngagementLoaderAdminData } from '../EngagementLoaderAdmin';
import { Language } from 'models/language';
import { faGlobe } from '@fortawesome/pro-regular-svg-icons';
import {
    AuthoringSectionName,
    useAuthoringSectionCompletion,
} from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';

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

const AuthoringButton = (props: AuthoringButtonProps & { isLoading?: boolean }) => {
    const buttonStyles = {
        display: 'flex',
        width: '100%',
        height: '3rem',
        backgroundColor: props.item.required ? colors.surface.blue[10] : colors.surface.gray[10],
        borderRadius: '8px',
        border: 'none',
        padding: '0 1rem 0 2.5rem',
        margin: '0 0 0.5rem',
        alignItems: 'center',
        justifyContent: 'flex-start',
        cursor: 'pointer',
    };
    const textStyles = {
        fontSize: '1rem',
        color: colors.type.regular.primary,
    };
    const arrowStyles = {
        color: colors.surface.blue[90],
        fontSize: '1.3rem',
        marginLeft: 'auto',
    };
    const checkStyles = {
        color: colors.type.regular.primary,
        fontSize: '1rem',
        fontWeight: 'bold',
        paddingRight: '0.4rem',
    };

    if (props.isLoading) {
        return <Skeleton variant="rounded" height={48} width="100%" sx={{ mb: '0.5rem', borderRadius: '8px' }} />;
    }

    return (
        <Link underline="none" style={{ ...buttonStyles }} to={props.item.link}>
            <When condition={props.item.completed}>
                <FontAwesomeIcon style={checkStyles} icon={faCheck} />
            </When>
            <span style={textStyles}>{props.item.title}</span>
            <Unless condition={props.item.completed}>
                <StatusCircle required={props.item.required} />
            </Unless>
            <FontAwesomeIcon style={arrowStyles} icon={faArrowRightLong} />
        </Link>
    );
};

export const AuthoringTab = () => {
    // Set useStates. When data is imported, it will be set with setSectionValues and setFeedbackMethods.
    const { engagementId } = useParams();
    const { engagement, languages } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const currentLanguageCode = useAppSelector((state) => state.language.id) || 'en';
    const [selectedLanguageCode, setSelectedLanguageCode] = useState(currentLanguageCode);
    const [languageOptions, setLanguageOptions] = useState<Language[]>([]);
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

    const sectionValues = useMemo(
        () =>
            getDefaultAuthoringTabValues('sections', engagementId ?? '', selectedLanguageCode).map((section) => ({
                ...section,
                completed: completionBySection[section.title as AuthoringSectionName] ?? false,
            })),
        [completionBySection, engagementId, selectedLanguageCode],
    );
    const feedbackCompleted = completionBySection['Provide Feedback'];
    const feedbackMethods = useMemo(
        () =>
            getDefaultAuthoringTabValues('feedback', engagementId ?? '', selectedLanguageCode).map((method) => ({
                ...method,
                completed: feedbackCompleted,
            })),
        [engagementId, feedbackCompleted, selectedLanguageCode],
    );
    const optionalSectionValues = useMemo(() => sectionValues.filter((section) => !section.required), [sectionValues]);

    const availableLanguageOptions =
        languageOptions.length > 0
            ? languageOptions
            : [{ id: 0, code: 'en', name: 'English', right_to_left: false } as Language];

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
        let isMounted = true;
        void languages.then((resolvedLanguages) => {
            if (!isMounted) {
                return;
            }
            setLanguageOptions(resolvedLanguages);
            const hasCurrentSelection = resolvedLanguages.some((language) => language.code === selectedLanguageCode);
            if (!hasCurrentSelection) {
                setSelectedLanguageCode('en');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [languages, selectedLanguageCode]);

    useEffect(() => {
        setSelectedLanguageCode(currentLanguageCode);
    }, [currentLanguageCode]);

    const handleLanguageSelectionChange = (event: SelectChangeEvent<string>) => {
        setSelectedLanguageCode(event.target.value);
    };

    return (
        <Grid container id="admin-authoring-section" direction="column" maxWidth={'700px'}>
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
                            <AuthoringButton key={section.id} item={section} isLoading={isLoadingSectionCompletion} />
                        ) : null,
                    )}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <BodyText bold sx={sectionLabelStyles}>
                        Optional Sections
                    </BodyText>
                    {optionalSectionValues.map((section) => (
                        <AuthoringButton key={section.id} item={section} isLoading={isLoadingSectionCompletion} />
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
                        <AuthoringButton item={method} key={method.id} isLoading={isLoadingSectionCompletion} />
                    ))}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default AuthoringTab;
