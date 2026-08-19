import { ResourceLockRecord } from 'services/resourceLockService';
import { AuthoringSectionName } from 'components/engagement/admin/create/authoring/useAuthoringSectionCompletion';

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
