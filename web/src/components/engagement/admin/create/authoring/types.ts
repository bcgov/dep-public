import { SubmitHandler } from 'react-hook-form';
import type { EngagementUpdateData } from './AuthoringContext';
import { Dispatch, SetStateAction } from 'react';
import { Language } from 'models/language';
import { Engagement } from 'models/engagement';
import { EditorState } from 'draft-js';
import { FetcherWithComponents } from 'react-router';
import { EngagementDetailsTab } from 'models/engagementDetailsTab';
import { EngagementStatus } from 'constants/engagementStatus';
import { ResourceLockRecord, ResourceLocks } from 'services/resourceLockService';

export interface AuthoringNavProps {
    open: boolean;
    isMediumScreen: boolean;
    setOpen: (open: boolean) => void;
    engagementId: string;
}

export interface DrawerBoxProps {
    isMediumScreenOrLarger: boolean;
    setOpen: (open: boolean) => void;
    engagementId: string;
}

export interface AuthoringContextType {
    onSubmit: SubmitHandler<EngagementUpdateData>;
    defaultValues: EngagementUpdateData;
    setDefaultValues: Dispatch<SetStateAction<EngagementUpdateData>>;
    fetcher: FetcherWithComponents<object>;
    activeLockToken: string | null;
    setActiveLockToken: Dispatch<SetStateAction<string | null>>;
    activeLockSectionKey: string | null;
    setActiveLockSectionKey: Dispatch<SetStateAction<string | null>>;
    activeLockLanguageId?: number;
    setActiveLockLanguageId: Dispatch<SetStateAction<number | undefined>>;
    // Set by a section (e.g. Details tabs) when the user adds/removes a structural, cross-language
    // resource, so the current section's edit lock escalates to an unscoped (whole-section) lock.
    lockScopeWideningRequested: boolean;
    setLockScopeWideningRequested: Dispatch<SetStateAction<boolean>>;
    activeLanguageCode: string;
    isLoadingLanguageOptions: boolean;
    languageOptions: Language[];
    locks: ResourceLocks;
    isLoading: boolean;
    languageId?: number;
    locksBySection: Record<
        | 'Hero Banner'
        | 'Summary'
        | 'Details'
        | 'Provide Feedback'
        | 'View Results'
        | 'Subscribe'
        | 'More Engagements'
        | 'Survey'
        | '3rd Party Feedback Method Link',
        ResourceLockRecord | null
    >;
    refreshLocks: () => Promise<ResourceLocks>;
}

export interface LanguageSelectorProps {
    isDirty: boolean;
    isSubmitting: boolean;
    currentSectionIncompleteLanguageCodes: string[];
    isSectionCompletionLoading: boolean;
    setUnsavedWorkPromptSuppressed: Dispatch<SetStateAction<boolean>>;
}

export interface AuthoringMorePreformProps {
    languages: Promise<Language[]>;
}

export interface AuthoringBottomNavProps {
    pageTitle: string;
    pageName: string;
    currentSectionIncompleteLanguageCodes: string[];
    isSectionCompletionLoading: boolean;
    setUnsavedWorkPromptSuppressed: Dispatch<SetStateAction<boolean>>;
}

export interface LabelProps {
    text?: string;
    completed?: boolean;
    status?: never;
    isLoading?: boolean;
}

export interface LabelWithStatusProps {
    text?: string;
    completed?: never;
    status: EngagementStatus;
    isLoading?: boolean;
}

export type StatusLabelProps = LabelProps | LabelWithStatusProps;

export interface AuthoringTemplateOutletContext {
    engagement: Engagement;
    defaultValues: EngagementUpdateData;
    setDefaultValues: Dispatch<SetStateAction<EngagementUpdateData>>;
    fetcher: FetcherWithComponents<object>;
    pageName: string;
}

export type FormDetailsTab = Omit<EngagementDetailsTab, 'body'> & {
    body: EditorState;
};
