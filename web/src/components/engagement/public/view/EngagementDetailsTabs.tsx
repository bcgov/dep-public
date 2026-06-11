import React, { useEffect, useState } from 'react';
import { Tab, Grid2 as Grid, useMediaQuery, Theme } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { getEditorStateFromRaw } from 'components/common/RichTextEditor/utils';
import { BodyText, Heading2 } from 'components/common/Typography';
import { colors } from 'components/common';
import { RichTextArea } from 'components/common/Input/RichTextArea';
import { EngagementViewSections } from '.';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { EngagementPreviewTag } from './EngagementPreviewTag';
import { useEngagementLoaderData } from 'components/engagement/preview/PreviewLoaderDataContext';
import { EngagementWidgetDisplay } from './EngagementWidgetDisplay';
import { WidgetLocation } from 'models/widget';
import TextPlaceholder from 'engagements/preview/placeholders/TextPlaceholder';
import { previewValue, PreviewSwitch } from 'engagements/preview/PreviewSwitch';
import { usePreview } from 'components/engagement/preview/PreviewContext';
import { resolveDetailsTabs } from './engagementTranslationResolution';
import { EditorState } from 'draft-js';

interface PublicDetailsTab {
    id: number;
    engagement_id: number;
    label: string;
    slug: string;
    heading: string;
    body: EditorState;
    sort_index: number;
}

interface FormDetailsTabWithWidget extends PublicDetailsTab {
    widget: boolean;
}

const parseAndSortTabs = (tabs: EngagementDetailsTab[]): FormDetailsTabWithWidget[] => {
    const parsedTabs: FormDetailsTabWithWidget[] = tabs.map((t) => ({
        id: Number(t.id) || -1,
        engagement_id: t.engagement_id || 0,
        label: t.label || '',
        slug: t.slug || '',
        heading: t.heading || '',
        body: getEditorStateFromRaw(typeof t.body === 'string' ? t.body : JSON.stringify(t.body || '')),
        sort_index: t.sort_index || -1,
        widget: true,
    }));
    return [...parsedTabs].sort((a, b) => a.sort_index - b.sort_index);
};

export const EngagementDetailsTabs = () => {
    const { details, translationBundle } = useEngagementLoaderData(); // Get fresh data to avoid DB sync issues
    const [selectedTab, setSelectedTab] = useState('0');
    const [tabs, setTabs] = useState<FormDetailsTabWithWidget[]>([]);
    const { isPreviewMode } = usePreview();
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });

    useEffect(() => {
        Promise.all([details, translationBundle]).then(([baseTabs, resolvedTranslationBundle]) => {
            const resolvedTabs = resolveDetailsTabs({
                tabs: baseTabs,
                translationBundle: resolvedTranslationBundle,
            });
            setTabs(parseAndSortTabs(resolvedTabs));
        });
    }, [details, translationBundle]);

    const hasBodyContent = (tab: FormDetailsTabWithWidget) => tab.body?.getCurrentContent()?.hasText?.() ?? false;
    const previewDisplay: FormDetailsTabWithWidget[] = [
        {
            id: -1,
            engagement_id: 0,
            label: '',
            slug: '',
            heading: '',
            body: getEditorStateFromRaw(''),
            sort_index: 0,
            widget: true,
        },
    ];
    // If there are no tabs, show a placeholder tab in preview mode to encourage users to add tabs
    // and show them how it will look. Otherwise, show real tabs (or no tabs if there are none and
    // we're not in preview).
    const displayTabs =
        previewValue<FormDetailsTabWithWidget[]>({
            isPreviewMode,
            hasValue: tabs.length > 0,
            value: tabs,
            previewFallback: previewDisplay,
            fallback: [],
        }) ?? [];

    return (
        <section
            id={EngagementViewSections.DETAILS_TABS}
            aria-label="Engagement details tabs"
            style={{ position: 'relative' }}
        >
            <EngagementPreviewTag required>Details Section</EngagementPreviewTag>
            <Grid
                container
                p={{ xs: '0 16px 24px 16px', md: '0 5vw 40px 5vw', lg: '0 10em 40px 10em' }}
                position="relative"
                zIndex={10}
            >
                {displayTabs.length > 0 && (
                    <TabContext value={selectedTab}>
                        <TabList
                            onChange={(_, value) => setSelectedTab(value)}
                            orientation="horizontal"
                            variant="scrollable"
                            scrollButtons="auto"
                            selectionFollowsFocus
                            sx={{
                                mt: '-1.875rem',
                                mb: '1rem',
                                bgcolor: 'white',
                                '& .MuiTabs-indicator': { height: '0.375rem' },
                                borderRadius: '0 1.5rem 0 0',
                            }}
                        >
                            {displayTabs.map((tab, key) => (
                                <Tab
                                    sx={{
                                        minWidth: '8.5rem',
                                        margin: '0.25rem 2rem',
                                        color: colors.type.regular.primary,
                                        background: 'transparent',
                                        fontSize: '14px',
                                        fontWeight: 'normal',
                                        '&.Mui-selected': {
                                            fontWeight: 'bold',
                                            '& .tab-label': {
                                                visibility: 'hidden',
                                            },
                                            '::before': {
                                                content: `"${tab.label}"`,
                                                position: 'absolute',
                                            },
                                        },
                                    }}
                                    key={tab.id}
                                    label={
                                        <BodyText size="small" className="tab-label">
                                            {tab.label || `Tab ${key + 1} Label`}
                                        </BodyText>
                                    }
                                    aria-label={tab.label || `Tab ${key + 1} Label`}
                                    value={String(key)}
                                    disableRipple
                                />
                            ))}
                        </TabList>
                        {displayTabs.map((tab, key) => (
                            <TabPanel
                                key={tab.id}
                                keepMounted
                                value={String(key)}
                                sx={{ padding: '1.5rem 0', width: '100%' }}
                            >
                                <Grid container size={12} gap="3rem">
                                    <Grid size={{ xs: 12, md: 6, lg: 8 }}>
                                        <Heading2
                                            decorated
                                            weight="thin"
                                            aria-label={tab.heading || `Tab ${key + 1} Heading`}
                                        >
                                            <PreviewSwitch
                                                hasValue={Boolean(tab.heading?.trim())}
                                                value={tab.heading}
                                                previewFallback={<TextPlaceholder text={`Tab ${key + 1} Heading`} />}
                                            />
                                        </Heading2>
                                        <PreviewSwitch
                                            hasValue={hasBodyContent(tab)}
                                            value={
                                                <RichTextArea
                                                    maxLines={isMobile ? 15 : 9} // Lines are short on mobile, show a few more.
                                                    editorState={tab.body}
                                                    readOnly={true}
                                                    toolbarHidden
                                                />
                                            }
                                            previewFallback={<TextPlaceholder type="long" />}
                                        />
                                    </Grid>
                                    <Grid container size="grow">
                                        <EngagementWidgetDisplay
                                            location={WidgetLocation.Details}
                                            detailsTabId={tab.id > 0 ? tab.id : undefined}
                                            tabIndex={key + 1}
                                        />
                                    </Grid>
                                </Grid>
                            </TabPanel>
                        ))}
                    </TabContext>
                )}
            </Grid>
        </section>
    );
};
