import { ResourceLockRecord } from 'services/resourceLockService';
import { AuthoringSectionName } from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';
import { MetadataTaxon } from 'models/engagement';

export interface AuthoringTabValue {
    id: number;
    title: AuthoringSectionName;
    link: string;
    required: boolean;
    completed: boolean;
    lock?: ResourceLockRecord;
}

export interface StatusCircleProps {
    required: boolean;
}

export interface AuthoringButtonProps {
    item: AuthoringTabValue;
}

export interface EngagementMetadataSubmission {
    id: number;
    engagement_id: number;
    metadata: (string | string[])[];
}

export interface MetadataFormValue {
    name: string;
    id: number;
    value: string[];
}

export interface MetadataSelectProps {
    taxa: MetadataTaxon[];
    taxon: MetadataTaxon;
    value: string[];
    onChange: (...event: unknown[]) => void;
    customValues: string[][];
    setCustomValues: React.Dispatch<React.SetStateAction<string[][]>>;
}