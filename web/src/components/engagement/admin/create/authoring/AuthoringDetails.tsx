import { Box, FormControlLabel, Grid2 as Grid, IconButton, Modal, Radio, RadioGroup, Tab } from '@mui/material';
import { BodyText, ErrorMessage } from 'components/common/Typography';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { AuthoringFormContainer, AuthoringFormSection } from './AuthoringFormLayout';
import { Heading3 } from 'components/common/Typography/Headings';
import { useLoaderData, useOutletContext } from 'react-router';
import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from 'components/common/Input/TextInput';
import { colors } from 'styles/Theme';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { AuthoringTemplateOutletContext, FormDetailsTab } from './types';
import { EditorState } from 'draft-js';
import WidgetPicker from '../widgets';
import { WidgetLocation } from 'models/widget';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-light-svg-icons';
import ConfirmModal from 'components/common/Modals/ConfirmModal';
import { AuthoringLoaderData } from './authoringLoader';
import { defaultValuesObject, EngagementUpdateData } from './AuthoringContext';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';

const AuthoringDetails = () => {
    const { setDefaultValues, engagement, fetcher, pageName }: AuthoringTemplateOutletContext = useOutletContext();
    const {
        setValue,
        getValues,
        reset,
        watch,
        control,
        formState: { errors },
    } = useFormContext<EngagementUpdateData>();
    const { detailsTabs } = useLoaderData() as AuthoringLoaderData; // Get fresh data to avoid DB sync issues
    const engagementId = engagement.id;
    const detailsUiStateKey = useMemo(() => `authoring-details-ui-${engagementId}`, [engagementId]);
    const existingTabs = getValues('details_tabs') ?? [];
    const persistedUiState = useMemo(() => {
        try {
            const raw = globalThis.sessionStorage.getItem(detailsUiStateKey);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw) as { currentTab?: string; tabsEnabled?: boolean };
        } catch {
            return null;
        }
    }, [detailsUiStateKey]);
    const [tabsEnabled, setTabsEnabled] = useState<boolean | undefined>(() => {
        if (typeof persistedUiState?.tabsEnabled === 'boolean') {
            return persistedUiState.tabsEnabled;
        }
        if (existingTabs.length > 0) {
            return existingTabs.length >= 2;
        }
        return undefined;
    });
    const [currentTab, setCurrentTab] = useState<string | undefined>(() => {
        if (persistedUiState?.currentTab) {
            return persistedUiState.currentTab;
        }
        if (existingTabs.length > 0) {
            return '0';
        }
        return undefined;
    });
    const [delTabIndex, setDelTabIndex] = useState(-1);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [noTabsModalOpen, setNoTabsModalOpen] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const [updateFocus, setUpdateFocus] = useState(false);
    const selectedTabRef = useRef<HTMLButtonElement | null>(null);
    const tabErrorsRef = useRef<HTMLDivElement>(null);
    const authoringDetailsTabs = watch('details_tabs');
    const defaultDetailsTabValues = useMemo(
        () => ({
            id: -1,
            engagement_id: engagementId,
            label: 'Tab 1',
            slug: 'tab_1',
            heading: '',
            body: EditorState.createEmpty(),
            sort_index: 1,
        }),
        [engagementId],
    );

    // Return focus to the newly selected element after an update focus request.
    useEffect(() => {
        if (!updateFocus) return;
        selectedTabRef.current?.focus();
        setUpdateFocus(false);
    }, [updateFocus]);

    // Set current values to default state after saving form
    useEffect(() => {
        if (typeof fetcher.data === 'string' && fetcher.data === 'success') {
            const newDefaults = getValues();
            setDefaultValues(newDefaults);
            reset(newDefaults);
        }
    }, [fetcher.data]);

    // Scroll to the tab label errors when there are tab errors, so they are obvious to the user
    useEffect(() => {
        if (Array.isArray(errors?.details_tabs) && errors.details_tabs.length > 0) {
            scrollToTabErrors();
        }
    }, [errors.details_tabs]);

    useEffect(() => {
        try {
            globalThis.sessionStorage.setItem(
                detailsUiStateKey,
                JSON.stringify({
                    currentTab,
                    tabsEnabled,
                }),
            );
        } catch {
            return;
        }
    }, [currentTab, detailsUiStateKey, tabsEnabled]);

    useEffect(() => {
        let isActive = true;
        setIsHydrating(true);

        detailsTabs.then((tabs) => {
            if (!isActive) {
                return;
            }

            let nextTabs = [defaultDetailsTabValues];

            if (Array.isArray(tabs) && tabs.length > 0 && tabs[0].engagement_id === engagementId) {
                const parsedTabs: FormDetailsTab[] = tabs.map((t) => {
                    // t.body may be a string (from API) or object (from form state)
                    let bodyString = '';
                    if (typeof t.body === 'string') {
                        bodyString = t.body;
                    } else if (t.body) {
                        bodyString = JSON.stringify(t.body);
                    }
                    return {
                        id: t.id || -1,
                        engagement_id: t.engagement_id || engagementId,
                        label: t.label || '',
                        slug: t.slug || '',
                        heading: t.heading || '',
                        body: getEditorStateFromRaw(bodyString),
                        sort_index: t.sort_index || -1,
                    };
                });
                nextTabs = [...parsedTabs].sort((a, b) => a.sort_index - b.sort_index);
            }

            const newValues = {
                ...defaultValuesObject,
                form_source: pageName,
                id: engagementId,
                details_tabs: nextTabs,
            };

            reset(newValues);
            setDefaultValues(newValues);
            setTabsEnabled(nextTabs.length >= 2);
            setCurrentTab((previousTab) => {
                if (previousTab && nextTabs[Number(previousTab)]) {
                    return previousTab;
                }
                return '0';
            });
            setIsHydrating(false);
        });

        return () => {
            isActive = false;
        };
    }, [defaultDetailsTabValues, detailsTabs, engagementId, pageName, reset, setDefaultValues]);

    const addTab = () => {
        const newTabs = [...getValues('details_tabs')];
        if (newTabs.length > 9) {
            return; // Maximum 10 tabs
        }
        const renumberedTabs = renumberTabs(newTabs);
        const newTab: FormDetailsTab = {
            id: -1,
            engagement_id: engagementId,
            label: `Tab ${newTabs.length + 1}`,
            slug: `tab_${newTabs.length + 1}`,
            heading: '',
            body: getEditorStateFromRaw(''),
            sort_index: newTabs.length + 1,
        };
        updateTabs([...renumberedTabs, newTab], true);
        setCurrentTab(String(renumberedTabs.length));
    };

    const renumberTabs = (tabs: FormDetailsTab[]): FormDetailsTab[] => {
        return tabs.map((tab, index) => {
            const isDefaultNumericTabLabel = /^Tab\s+\d+$/i.test(tab.label.trim());

            if (isDefaultNumericTabLabel) {
                tab.label = `Tab ${index + 1}`;
                tab.slug = `tab_${index + 1}`;
            }

            tab.sort_index = index + 1;
            return tab;
        });
    };

    const removeTab = (event: React.SyntheticEvent, index: number) => {
        event.stopPropagation();
        const newTabs = getValues('details_tabs');
        if (index !== -1 && newTabs?.[index]) {
            setDelTabIndex(index);
            openModal('delete tab');
        }
    };

    const labelChange = (value: string, index: number) => {
        const newTabs = [...getValues('details_tabs')];
        let newValue = value;

        if (newTabs.some((tab, i) => tab.label === newValue && i !== index)) {
            // Resolve duplicate by finding the lowest available number suffix.
            // Start from 1 when the name already ends in a number (so "Tab 2" can become
            // "Tab 1" if that slot is free), or from 2 for plain names ("My Tab" → "My Tab 2").
            const match = /^(.*\S)\s+(\d+)$/.exec(value);
            const base = match ? match[1] : value;
            let counter = match ? 1 : 2;
            do {
                newValue = `${base} ${counter++}`;
            } while (newTabs.some((tab, i) => tab.label === newValue && i !== index));
        }

        newTabs[index].label = newValue;
        newTabs[index].slug = newValue.toLowerCase().replace(/\s+/g, '_');
        updateTabs(newTabs, true);
    };

    const editorChange = (newEditorState: EditorState, key: number): EditorState => {
        const newTabs = [...getValues('details_tabs')];
        newTabs[key].body = newEditorState;
        updateTabs(newTabs, true);
        return newEditorState;
    };

    const deleteConfirm = () => {
        const newTabs = [...getValues('details_tabs')];
        newTabs.splice(delTabIndex, 1);
        const renumberedTabs = renumberTabs(newTabs);
        if (String(delTabIndex) === currentTab) {
            // If the selected tab was deleted, select the tab before it.
            setCurrentTab(String(Math.max(0, delTabIndex - 1)));
        } else if (!renumberedTabs[Number(currentTab)]) {
            // If the tab no longer exists because of renumbering, choose the new last tab.
            setCurrentTab(String(renumberedTabs.length - 1));
        }
        updateTabs(renumberedTabs, true);
        closeModal('delete tab');
    };

    const updateTabs = (newTabs: FormDetailsTab[], dirtied: boolean) => {
        setValue('details_tabs', newTabs, { shouldDirty: dirtied });
    };

    const enableTabs = () => {
        setTabsEnabled(true);
        addTab();
    };

    const disableTabs = () => {
        if (getValues('details_tabs')?.length > 1) {
            // Don't directly set tabs to disabled if there are multiple tabs - confirm first.
            openModal('disable tabs');
        }
    };

    const noTabsConfirm = () => {
        setTabsEnabled(false);
        const newTabs = getValues('details_tabs');
        // Remove subsequent tabs when switching to no-tab mode. This action dirties the form.
        updateTabs([newTabs[0]], true);
        closeModal('disable tabs');
    };

    const scrollToTabErrors = () => {
        tabErrorsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const openModal = (source: string) => {
        switch (source) {
            case 'delete tab':
                setDeleteModalOpen(true);
                break;
            case 'disable tabs':
                setNoTabsModalOpen(true);
                break;
        }
    };

    const closeModal = (source: string) => {
        switch (source) {
            case 'delete tab':
                setDeleteModalOpen(false);
                setDelTabIndex(-1);
                break;
            case 'disable tabs':
                setNoTabsModalOpen(false);
                setCurrentTab('0');
                break;
        }
        setUpdateFocus(true);
    };

    const tabKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement | HTMLSpanElement>,
        source: string,
        index = -1,
    ) => {
        if (source === 'add' && (event.key === 'Enter' || event.key === 'Spacebar' || event.key === ' ')) {
            event.preventDefault();
            addTab();
        } else if (source === 'tab' && (event.key === 'Delete' || event.key === 'Backspace')) {
            event.preventDefault();
            removeTab(event, index);
        } else if (source === 'tabx' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
            event.preventDefault();
            const newTab = Number(currentTab) + (event.key === 'ArrowRight' ? +1 : -1);
            const newString = String(newTab);
            if (authoringDetailsTabs[newTab]) {
                setCurrentTab(newString);
                setUpdateFocus(true);
            }
        }
    };

    // WYSIWYG text editor toolbar items

    const toolbar = {
        options: ['inline', 'list', 'link', 'blockType', 'history'],
        inline: {
            options: ['bold', 'italic', 'underline', 'superscript', 'subscript'],
        },
        blockType: { options: ['Normal', 'H2', 'H3', 'Blockquote'] },
        list: { options: ['unordered', 'ordered'] },
    };

    const tabRadioContainerStyles = {
        display: 'flex',
        width: '100%',
        flexWrap: 'nowrap',
        mt: '1rem',
        fontWeight: 'bold',
    };

    const radioStyles = {
        flexBasis: '50%',
    };

    const tabListStyles = {
        display: tabsEnabled ? 'flex' : 'none',
        borderBottom: '1px solid',
        borderColor: 'primary.main',
        '& .MuiTabs-flexContainer': {
            rowGap: '0.5rem',
            flexWrap: 'wrap', // For 7-10 tabs, a second line of tabs is required.
            marginBottom: '-12px',
        },
        '&:focus-visible': {
            outline: `2px solid`,
            outlineColor: 'focus.inner',
            border: '4px solid',
            borderColor: 'focus.outer',
            padding: '0px 20px 0px 14px',
        },
    };

    const tabStyles = {
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        height: '48px',
        padding: '4px 18px 2px 18px',
        fontSize: '14px',
        borderRadius: '0px 16px 0px 0px',
        borderBottom: '2px solid',
        borderBottomColor: 'gray.60',
        boxShadow:
            '0px 1px 5px 0px rgba(0, 0, 0, 0.12), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.20)',
        color: 'text.secondary',
        fontWeight: 'normal',
        outlineOffset: '-4px',
        '&:focus-visible': {
            outline: `2px solid`,
            outlineColor: 'focus.inner',
            border: '4px solid',
            borderColor: 'focus.outer',
            padding: '0px 20px 0px 14px',
        },
    };

    const addTabButtonStyles = {
        border: 'none',
        borderRadius: '0px 16px 0px 0px',
        background: 'transparent',
        fontWeight: 'normal',
        fontSize: '0.875rem',
        padding: '0',
        mb: '0.75rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '90px',
        color: colors.button.default.shade,
        cursor: 'pointer',
        minWidth: '120px',
        '&:focus-visible': {
            outline: `2px solid`,
            outlineColor: 'focus.inner',
            border: '2px solid',
            borderColor: 'focus.outer',
            padding: '0px 20px 0px 14px',
        },
    };

    const tabPanelStyles = {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: 0,
    };

    const labelSectionStyles: React.CSSProperties = {
        display: tabsEnabled ? 'flex' : 'none',
    };

    const closeTabXContainer = {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const iconButtonStyles = {
        color: 'inherit',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'noWrap',
        alignContent: 'center',
        justifyItems: 'center',
        marginLeft: '1.125rem',
        width: '1.5rem',
        height: '1.5rem',
        '&.activated-x': {
            outline: `2px solid`,
            outlineColor: 'focus.inner',
            border: '2px solid',
            borderColor: 'focus.outer',
        },
    };

    const fontAwesomeXStyles: React.CSSProperties = {
        fontSize: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        top: '1px',
    };

    const getTabReactKey = (tab: FormDetailsTab, index: number) => {
        if (tab.id && tab.id > 0) {
            return `tab-${tab.id}`;
        }
        return `tab-new-${tab.slug || 'tab'}-${index}`;
    };

    return (
        <>
            {/* prevent user from accidentally deleting a tab */}
            <Modal open={deleteModalOpen} aria-describedby="delete-tab-modal-subtext">
                <ConfirmModal
                    style="danger"
                    header={`Are you sure you want to delete ${authoringDetailsTabs[delTabIndex]?.label || 'this tab'}?`}
                    subHeader="The tab will not be recoverable."
                    subTextId="delete-tab-modal-subtext"
                    subText={[
                        {
                            text: `If you delete ${authoringDetailsTabs[delTabIndex]?.label || 'this tab'}, its content (in all languages if multilingual) will be `,
                            bold: false,
                        },
                        { text: 'deleted permanently.', bold: true },
                    ]}
                    handleConfirm={deleteConfirm}
                    handleClose={() => closeModal('delete tab')}
                    confirmButtonText={`Delete ${authoringDetailsTabs[delTabIndex]?.label || 'This Tab'}`}
                    cancelButtonText={'Cancel & Go Back'}
                />
            </Modal>

            {/* prevent user from accidentally deleting all tabs after 1 when switching to No Tabs mode */}
            <Modal open={noTabsModalOpen} aria-describedby="no-tabs-mode-modal-subtext">
                <ConfirmModal
                    style="danger"
                    header={`Are you sure you want to switch to No Tabs mode?`}
                    subHeader="Your tabbed content will be deleted."
                    subTextId="no-tabs-mode-modal-subtext"
                    subText={[
                        {
                            text: 'This includes all tabs and their translations, except for tab one.',
                            bold: false,
                        },
                    ]}
                    handleConfirm={noTabsConfirm}
                    handleClose={() => closeModal('disable tabs')}
                    confirmButtonText={'Delete Tabs'}
                    cancelButtonText={'Cancel & Go Back'}
                />
            </Modal>

            <AuthoringFormContainer rowGap="1rem" mb="1rem" isHydrating={isHydrating}>
                <BodyText size="small">
                    In the Details Section of your engagement, you have the option to display your content in a normal,
                    static page section view (no tabs) or, for lengthy content, use tabs. You may wish to use tabs if
                    your content is quite lengthy so you can organize it into smaller, more digestible chunks and reduce
                    the length of your engagement page.
                </BodyText>
                {/* Tabs mode radio selector */}
                <RadioGroup
                    row
                    aria-label="Tab Mode Selector"
                    id="tab_mode_selector"
                    sx={tabRadioContainerStyles}
                    value={tabsEnabled ? 'true' : 'false'}
                    onChange={(_, value) => {
                        value === 'true' ? enableTabs() : disableTabs();
                    }}
                >
                    <FormControlLabel
                        value="false"
                        control={<Radio color="info" />}
                        label={<span style={{ fontWeight: 'bold' }}>No Tabs</span>}
                        style={radioStyles}
                    />
                    <FormControlLabel
                        value="true"
                        control={<Radio color="info" />}
                        label={
                            <>
                                <span style={{ fontWeight: 'bold' }}>Tabs </span>
                                <span>(2 Minimum)</span>
                            </>
                        }
                        style={radioStyles}
                    />
                </RadioGroup>
            </AuthoringFormContainer>

            {/* Tab instructions */}
            {currentTab && (
                <TabContext value={currentTab}>
                    <AuthoringFormContainer rowSpacing="2rem" pt="0.5rem" isHydrating={isHydrating}>
                        {tabsEnabled && (
                            <Grid container rowSpacing="0.5rem">
                                <div ref={tabErrorsRef}></div>
                                <Heading3 bold>Tabs Configuration</Heading3>
                                <BodyText size="small">
                                    You must have a minimum of two tabs to use the tabs configuration. To add additional
                                    tabs, select the Add Tab button. To remove a tab you have added, select the “X”
                                    button beside the tab label.
                                </BodyText>
                            </Grid>
                        )}
                        {tabsEnabled && (
                            <ErrorMessage
                                error={
                                    errors?.details_tabs &&
                                    Array.isArray(errors.details_tabs) &&
                                    errors.details_tabs.length > 0
                                        ? 'Your tabs contain errors. Please fix the tabs highlighted in red.'
                                        : ''
                                }
                            />
                        )}
                        {/* Tabs and form */}
                        <TabList
                            id="details-tab-list"
                            sx={tabListStyles}
                            selectionFollowsFocus
                            slotProps={{ indicator: { style: { display: 'none' } } }}
                            onChange={(_, value: string) => {
                                if (value !== 'add') {
                                    setCurrentTab(String(value));
                                }
                            }}
                        >
                            {authoringDetailsTabs.map((value, key) => (
                                <Tab
                                    component="button"
                                    aria-label={`${value.label || 'Tab ' + key} is selected. Press the delete key to remove.`}
                                    key={getTabReactKey(value, key)}
                                    value={String(key)}
                                    onKeyDown={(event) => {
                                        tabKeyDown(event, 'tab', key);
                                    }}
                                    disableFocusRipple
                                    ref={currentTab === String(key) ? selectedTabRef : null}
                                    // Add an X when appropriate: not on first tab, only if there are 3 or more tabs.
                                    label={
                                        <Box sx={closeTabXContainer}>
                                            <span>{value.label}</span>
                                            {key !== 0 && authoringDetailsTabs.length > 2 ? (
                                                <IconButton
                                                    component="span"
                                                    focusVisibleClassName="activated-x"
                                                    sx={iconButtonStyles}
                                                    disableRipple
                                                    tabIndex={currentTab === String(key) ? 0 : -1}
                                                    size="small"
                                                    edge="end"
                                                    aria-label={`Remove tab: ${value.label || key + 1}.`}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        removeTab(event, key);
                                                    }}
                                                    onKeyDown={(event) => {
                                                        tabKeyDown(event, 'tabx', key);
                                                    }}
                                                >
                                                    <FontAwesomeIcon style={{ ...fontAwesomeXStyles }} icon={faXmark} />
                                                </IconButton>
                                            ) : null}
                                        </Box>
                                    }
                                    // Colour the tab labels red if they contain errors so the user sees them from another tab.
                                    sx={{
                                        ...tabStyles,
                                        backgroundColor: errors.details_tabs?.[key]
                                            ? colors.button.error.tint
                                            : 'gray.10',
                                        '&.Mui-selected': {
                                            backgroundColor: errors.details_tabs?.[key]
                                                ? colors.button.error.shade
                                                : 'primary.main',
                                            borderColor: 'primary.main',
                                            color: 'white',
                                            fontWeight: 'bold',
                                        },
                                    }}
                                ></Tab>
                            ))}

                            <Tab
                                value="add"
                                label="+ Add Tab"
                                aria-label="Add a new tab."
                                disabled={authoringDetailsTabs.length > 9}
                                disableRipple
                                sx={{ ...addTabButtonStyles }}
                                onClick={() => addTab()}
                                onKeyDown={(event) => tabKeyDown(event, 'add')}
                            />
                        </TabList>
                    </AuthoringFormContainer>

                    {/* Tab contents */}
                    {authoringDetailsTabs.map((tab, key) => (
                        <TabPanel sx={tabPanelStyles} value={String(key)} key={getTabReactKey(tab, key)}>
                            <AuthoringFormContainer pt="2rem" pb="2.5rem" isHydrating={isHydrating}>
                                <AuthoringFormSection
                                    name={`Tab ${key + 1} Label`}
                                    required={true}
                                    labelFor={`details_tabs.${key}.label`}
                                    style={labelSectionStyles}
                                    details="Your tab label should be one or two words (maximum three)."
                                >
                                    <Controller
                                        name={`details_tabs.${key}.label`}
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                id={`details_tabs.${key}.label`}
                                                aria-label={`Tab ${key + 1} Label`}
                                                onChange={(value) => {
                                                    field.onChange(value);
                                                    labelChange(value, key);
                                                }}
                                                counter
                                                maxLength={20}
                                                placeholder={`${tab.label} Label`}
                                                error={errors.details_tabs?.[key]?.label?.message ?? ''}
                                            />
                                        )}
                                    />
                                </AuthoringFormSection>
                                <Grid container direction="column" gap="0.5rem">
                                    <Heading3 bold>Primary Content (Required)</Heading3>
                                    <BodyText size="small">
                                        {'Primary content will display on the left two thirds of the page on large screens ' +
                                            'and full width on small screens. (If you add optional supporting content in the section ' +
                                            'below, on small screens, your primary content will display first (on top) followed ' +
                                            'by your supporting content (underneath).'}
                                    </BodyText>
                                </Grid>

                                <AuthoringFormSection
                                    name="Heading"
                                    required={true}
                                    labelFor={`details_tabs.${key}.heading`}
                                    details="Your heading should be descriptive, short and succinct."
                                >
                                    <Controller
                                        name={`details_tabs.${key}.heading`}
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                id={`details_tabs.${key}.heading`}
                                                aria-label={`Tab ${key + 1} Heading`}
                                                counter
                                                maxLength={60}
                                                placeholder="Heading"
                                                error={errors?.details_tabs?.[key]?.heading?.message ?? ''}
                                            />
                                        )}
                                    />
                                </AuthoringFormSection>

                                <AuthoringFormSection
                                    name="Body Copy"
                                    required={true}
                                    labelFor={`details_tabs.${key}.body`}
                                    details={
                                        'If the content you add for this tab is quite long, a "read more" expander will be ' +
                                        'added to your content at approximately xx (large screens) and xx (small screens). ' +
                                        'In this case, you will want to ensure that the most important body copy is first so ' +
                                        'that your audience will see it even if they do not interact with the Read More expander.'
                                    }
                                >
                                    <ErrorMessage error={errors?.details_tabs?.[key]?.body?.message ?? ''} />
                                    <Controller
                                        name={`details_tabs.${key}.body`}
                                        control={control}
                                        render={({ field }) => (
                                            <RichTextArea
                                                spellCheck
                                                editorState={field.value}
                                                aria-label={`Tab ${key + 1} Body`}
                                                onEditorStateChange={(value) => {
                                                    field.onChange(editorChange(value, key));
                                                }}
                                                handlePastedText={() => false}
                                                toolbar={toolbar}
                                                placeholder="Body Copy"
                                            />
                                        )}
                                    />
                                </AuthoringFormSection>
                            </AuthoringFormContainer>

                            {/* Supporting content widget picker */}
                            <AuthoringFormContainer>
                                <Grid container direction="column" gap="0.5rem">
                                    <Heading3 bold>Supporting Content (Optional)</Heading3>
                                    <BodyText size="small">
                                        You may use a widget to add supporting content to your primary content. On large
                                        screens this content will be displayed to the right of your primary content. On
                                        small screens this content will be displayed below your primary content.
                                    </BodyText>
                                </Grid>
                                <Grid>
                                    <WidgetPicker
                                        location={WidgetLocation.Details}
                                        detailsTabId={tab.id > 0 ? tab.id : undefined}
                                        tabIndex={key + 1}
                                    />
                                </Grid>
                            </AuthoringFormContainer>
                        </TabPanel>
                    ))}
                </TabContext>
            )}
        </>
    );
};

export default AuthoringDetails;
