import Endpoints from 'apiManager/endpoints';
import http from 'apiManager/httpRequestHandler';
import axios from 'axios';
import { replaceUrl } from 'helper';

export const LOCK_TOKEN_HEADER = 'X-Resource-Lock-Token';
export const RESOURCE_TYPE_ENGAGEMENT_SECTION = 'engagement_section';
export const RESOURCE_TYPE_SURVEY = 'survey';

export const SECTION_AUTHORING_BANNER = 'authoring.banner';
export const SECTION_AUTHORING_SUMMARY = 'authoring.summary';
export const SECTION_AUTHORING_DETAILS = 'authoring.details';
export const SECTION_AUTHORING_FEEDBACK = 'authoring.feedback';
export const SECTION_AUTHORING_RESULTS = 'authoring.results';
export const SECTION_AUTHORING_SUBSCRIBE = 'authoring.subscribe';
export const SECTION_AUTHORING_MORE = 'authoring.more';
export const SECTION_CONFIG_GENERAL = 'config.general';
export const SECTION_SURVEY_BUILDER = 'survey.builder';
export const SECTION_SURVEY_REPORT_SETTINGS = 'survey.report_settings';

const LOCK_SESSION_ID_KEY = 'engagement-lock-session-id';

export interface ResourceLockOwner {
    user_sub: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
}

export interface ResourceLockRecord {
    lock_token: string;
    lock_scope: string;
    resource_type: string;
    resource_id: number;
    section_key?: string;
    language_id?: number;
    owner: ResourceLockOwner;
    owner_session_id: string;
    acquired_at: string;
    heartbeat_at?: string;
    expires_at?: string;
    is_mine: boolean;
}

export interface ResourceLocks {
    resource_type: string;
    resource_id: number;
    locks: ResourceLockRecord[];
}

export type LockConflictPayload = {
    code?: string;
    message?: string;
    lock_scope?: string;
    owner?: {
        user_sub?: string;
        display_name?: string;
        first_name?: string;
        last_name?: string;
    };
    expires_at?: string;
};

type ResourceLockEvent =
    | {
          type: 'upsert';
          lock: ResourceLockRecord;
      }
    | {
          type: 'release';
          lockToken: string;
      };

type ResourceLockListener = (event: ResourceLockEvent) => void;

const resourceLockListeners = new Set<ResourceLockListener>();

const emitResourceLockEvent = (event: ResourceLockEvent) => {
    resourceLockListeners.forEach((listener) => {
        listener(event);
    });
};

export const subscribeToResourceLockEvents = (listener: ResourceLockListener) => {
    resourceLockListeners.add(listener);
    return () => {
        resourceLockListeners.delete(listener);
    };
};

export const applyResourceLockEvent = (currentLocks: ResourceLocks, event: ResourceLockEvent): ResourceLocks => {
    if (event.type === 'release') {
        return {
            ...currentLocks,
            locks: currentLocks.locks.filter((lock) => lock.lock_token !== event.lockToken),
        };
    }

    const nextLocks = currentLocks.locks.filter(
        (lock) => lock.lock_token !== event.lock.lock_token && lock.lock_scope !== event.lock.lock_scope,
    );

    return {
        ...currentLocks,
        resource_type: event.lock.resource_type,
        resource_id: event.lock.resource_id,
        locks: [...nextLocks, event.lock],
    };
};

interface AcquireLockRequest {
    resource_type: string;
    resource_id: number;
    section_key: string;
    owner_session_id: string;
    owner_display_name?: string;
    language_id?: number;
    ttl_seconds?: number;
}

interface RefreshLockRequest {
    lock_token: string;
    owner_session_id: string;
    ttl_seconds?: number;
}

interface ReleaseLockRequest {
    lock_token: string;
    release_reason?: 'explicit' | 'expired_takeover' | 'logout' | 'navigation' | 'force_takeover';
}

/**
 * Gets or creates a unique session ID for the current user session, stored in sessionStorage.
 * This ID is used to differentiate different sessions started by the same user.
 * @returns The unique session ID for the current user session.
 */
export const getOrCreateLockSessionId = (): string => {
    const existing = sessionStorage.getItem(LOCK_SESSION_ID_KEY);
    if (existing) {
        return existing;
    }

    const sessionId = crypto.randomUUID();
    sessionStorage.setItem(LOCK_SESSION_ID_KEY, sessionId);
    return sessionId;
};

/**
 * Acquires a lock for a section of any resource type (engagement, survey, etc).
 * @param resourceType - The resource type (e.g. RESOURCE_TYPE_ENGAGEMENT_SECTION, RESOURCE_TYPE_SURVEY).
 * @param resourceId - The ID of the resource.
 * @param sectionKey - The key of the section to lock.
 * @param languageId - Optional. The language ID for the section.
 * @param ownerDisplayName - Optional. The display name of the lock owner.
 * @param ttlSeconds - Optional. Time-to-live in seconds for the lock.
 * @returns A promise that resolves to the acquired ResourceLockRecord.
 */
export const acquireResourceLock = async ({
    resourceType,
    resourceId,
    sectionKey,
    languageId,
    ownerDisplayName,
    ttlSeconds,
}: {
    resourceType: string;
    resourceId: number;
    sectionKey: string;
    languageId?: number;
    ownerDisplayName?: string;
    ttlSeconds?: number;
}): Promise<ResourceLockRecord> => {
    const payload: AcquireLockRequest = {
        resource_type: resourceType,
        resource_id: resourceId,
        section_key: sectionKey,
        owner_session_id: getOrCreateLockSessionId(),
        language_id: languageId,
        owner_display_name: ownerDisplayName,
        ttl_seconds: ttlSeconds,
    };

    const response = await http.PostRequest<ResourceLockRecord>(Endpoints.ResourceLocks.ACQUIRE, payload);
    if (!response.data) {
        throw new Error('Failed to acquire lock');
    }
    emitResourceLockEvent({ type: 'upsert', lock: response.data });
    return response.data;
};

/**
 * Acquires a lock for a specific engagement section.
 * @param engagementId - The ID of the engagement.
 * @param sectionKey - The key of the section to lock.
 * @param languageId - Optional. The language ID for the section.
 * @param ownerDisplayName - Optional. The display name of the lock owner.
 * @param ttlSeconds - Optional. Time-to-live in seconds for the lock.
 * @returns A promise that resolves to the acquired ResourceLockRecord.
 */
export const acquireEngagementSectionLock = ({
    engagementId,
    sectionKey,
    languageId,
    ownerDisplayName,
    ttlSeconds,
}: {
    engagementId: number;
    sectionKey: string;
    languageId?: number;
    ownerDisplayName?: string;
    ttlSeconds?: number;
}): Promise<ResourceLockRecord> =>
    acquireResourceLock({
        resourceType: RESOURCE_TYPE_ENGAGEMENT_SECTION,
        resourceId: engagementId,
        sectionKey,
        languageId,
        ownerDisplayName,
        ttlSeconds,
    });

/**
 * Acquires a lock for a survey section (the form builder or report settings).
 * Survey sections are never language-scoped.
 * @param surveyId - The ID of the survey.
 * @param sectionKey - The key of the section to lock (SECTION_SURVEY_BUILDER or SECTION_SURVEY_REPORT_SETTINGS).
 * @param ownerDisplayName - Optional. The display name of the lock owner.
 * @param ttlSeconds - Optional. Time-to-live in seconds for the lock.
 * @returns A promise that resolves to the acquired ResourceLockRecord.
 */
export const acquireSurveySectionLock = ({
    surveyId,
    sectionKey,
    ownerDisplayName,
    ttlSeconds,
}: {
    surveyId: number;
    sectionKey: string;
    ownerDisplayName?: string;
    ttlSeconds?: number;
}): Promise<ResourceLockRecord> =>
    acquireResourceLock({
        resourceType: RESOURCE_TYPE_SURVEY,
        resourceId: surveyId,
        sectionKey,
        ownerDisplayName,
        ttlSeconds,
    });

/**
 * Refreshes an existing lock.
 * @param lockToken - The token of the lock to refresh.
 * @param ttlSeconds - Optional. Time-to-live in seconds for the lock.
 * @returns A promise that resolves to the refreshed ResourceLockRecord.
 */
export const refreshLock = async (lockToken: string, ttlSeconds?: number): Promise<ResourceLockRecord> => {
    const payload: RefreshLockRequest = {
        lock_token: lockToken,
        owner_session_id: getOrCreateLockSessionId(),
        ttl_seconds: ttlSeconds,
    };

    const response = await http.PostRequest<ResourceLockRecord>(Endpoints.ResourceLocks.REFRESH, payload);
    if (!response.data) {
        throw new Error('Failed to refresh lock');
    }
    emitResourceLockEvent({ type: 'upsert', lock: response.data });
    return response.data;
};

/**
 * Releases an existing lock.
 * @param lockToken - The token of the lock to release.
 * @param releaseReason - Optional. The reason for releasing the lock.
 * @returns A promise that resolves to an object indicating whether the lock was released and the release timestamp.
 */
export const releaseLock = async (
    lockToken: string,
    releaseReason: ReleaseLockRequest['release_reason'] = 'explicit',
): Promise<{ released: boolean; released_at?: string | null }> => {
    const payload: ReleaseLockRequest = {
        lock_token: lockToken,
        release_reason: releaseReason,
    };

    const response = await http.PostRequest<{ released: boolean; released_at?: string | null }>(
        Endpoints.ResourceLocks.RELEASE,
        payload,
    );
    if (!response.data) {
        throw new Error('Failed to release lock');
    }
    if (response.data.released) {
        emitResourceLockEvent({ type: 'release', lockToken });
    }
    return response.data;
};

/**
 * Gets all locks for a resource, given a URL that already has its id path segment filled in.
 */
const fetchResourceLocks = async (url: string): Promise<ResourceLocks> => {
    const response = await http.GetRequest<ResourceLocks>(url, {
        owner_session_id: getOrCreateLockSessionId(),
    });
    if (!response.data) {
        throw new Error('Failed to fetch resource locks');
    }
    return response.data;
};

/**
 * Gets all locks for a specific engagement.
 * @param engagementId - The ID of the engagement.
 * @returns A promise that resolves to the resource locks for the engagement.
 */
export const getEngagementLocks = async (engagementId: number): Promise<ResourceLocks> => {
    const url = replaceUrl(Endpoints.Engagement.GET_LOCKS, 'engagement_id', String(engagementId));
    return fetchResourceLocks(url);
};

/**
 * Gets all locks for a specific survey.
 * @param surveyId - The ID of the survey.
 * @returns A promise that resolves to the resource locks for the survey.
 */
export const getSurveyLocks = async (surveyId: number): Promise<ResourceLocks> => {
    const url = replaceUrl(Endpoints.Survey.GET_LOCKS, 'survey_id', String(surveyId));
    return fetchResourceLocks(url);
};

/**
 * Checks if a section is locked.
 * @param locks - The resource locks for the engagement.
 * @param sectionKey - The key of the section to check.
 * @param by - Optional. Specify 'others' to exclude locks owned by the current user,
 * or 'me' to check *only* locks owned by the current user.
 * @returns True if the section is locked based on the criteria, false otherwise.
 */
export const isSectionLocked = ({
    locks,
    sectionKey,
    by,
}: {
    locks: ResourceLocks;
    sectionKey: string;
    by?: 'me' | 'other';
}): boolean => {
    if (by === 'me') {
        return locks.locks.some((lock) => lock.section_key === sectionKey && lock.is_mine);
    }
    if (by === 'other') {
        return locks.locks.some((lock) => lock.section_key === sectionKey && !lock.is_mine);
    }
    return locks.locks.some((lock) => lock.section_key === sectionKey);
};

export const getLockConflictPayload = (error: unknown): LockConflictPayload | null => {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    const payload = error.response?.data as LockConflictPayload | undefined;
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    if (payload.code !== 'lock_conflict' && payload.code !== 'lock_not_owner') {
        return null;
    }

    return payload;
};

export const getLockOwnerDisplayName = (owner?: ResourceLockOwner): string => {
    if (!owner) {
        return 'another editor';
    }

    const fullName = [owner.first_name, owner.last_name].filter(Boolean).join(' ').trim();
    if (fullName) {
        return fullName;
    }

    if (owner.display_name?.trim()) {
        return owner.display_name.trim();
    }

    return 'another editor';
};

export const findScopedSectionLock = ({
    locks,
    sectionKey,
    languageId,
    languageScoped = true,
}: {
    locks?: ResourceLocks | null;
    sectionKey: string;
    languageId?: number;
    languageScoped?: boolean;
}): ResourceLockRecord | null => {
    if (!locks?.locks?.length) {
        return null;
    }

    const matchingLocks = [...locks.locks]
        .filter((lock) => {
            if (lock.section_key !== sectionKey) {
                return false;
            }

            if (!languageScoped) {
                return lock.language_id === null || lock.language_id === undefined;
            }

            if (lock.language_id === null || lock.language_id === undefined) {
                return true;
            }

            if (languageId === undefined) {
                return true;
            }

            return lock.language_id === languageId;
        })
        .sort((left, right) => {
            if (left.is_mine !== right.is_mine) {
                return left.is_mine ? 1 : -1;
            }

            // Prefer showing the less-specific (unscoped, whole-section) lock over a language-scoped one.
            const leftUnscoped = left.language_id === null || left.language_id === undefined;
            const rightUnscoped = right.language_id === null || right.language_id === undefined;
            if (leftUnscoped !== rightUnscoped) {
                return leftUnscoped ? -1 : 1;
            }

            const leftHeartbeat = left.heartbeat_at ? Date.parse(left.heartbeat_at) : 0;
            const rightHeartbeat = right.heartbeat_at ? Date.parse(right.heartbeat_at) : 0;
            return rightHeartbeat - leftHeartbeat;
        });

    return matchingLocks[0] ?? null;
};
