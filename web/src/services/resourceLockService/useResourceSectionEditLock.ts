import { useCallback, useEffect, useRef, useState } from 'react';
import {
    acquireResourceLock,
    refreshLock,
    releaseLock,
    RESOURCE_TYPE_ENGAGEMENT_SECTION,
    ResourceLockRecord,
} from 'services/resourceLockService';

const DEFAULT_LOCK_HEARTBEAT_INTERVAL_MS = 30000;

type LockScope = {
    sectionKey: string;
    languageId?: number;
};

export const useResourceSectionEditLock = ({
    resourceId,
    resourceType = RESOURCE_TYPE_ENGAGEMENT_SECTION,
    scope,
    enabled = true,
    isDirty,
    isSubmitting,
    blockedByLock,
    heartbeatIntervalMs = DEFAULT_LOCK_HEARTBEAT_INTERVAL_MS,
    onConflict,
}: {
    resourceId: number;
    resourceType?: string;
    scope: LockScope | null;
    enabled?: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
    blockedByLock?: ResourceLockRecord | null;
    heartbeatIntervalMs?: number;
    onConflict?: (error: unknown) => Promise<void> | void;
}) => {
    const [lockToken, setLockToken] = useState<string | null>(null);
    const [activeScope, setActiveScope] = useState<LockScope | null>(null);
    const lockTokenRef = useRef<string | null>(null);
    const activeScopeRef = useRef<LockScope | null>(null);
    const isReleasingLockRef = useRef(false);

    useEffect(() => {
        lockTokenRef.current = lockToken;
        activeScopeRef.current = activeScope;
    }, [activeScope, lockToken]);

    const clearLockState = useCallback(() => {
        lockTokenRef.current = null;
        activeScopeRef.current = null;
        setLockToken(null);
        setActiveScope(null);
    }, []);

    const releaseActiveLock = useCallback(
        async (releaseReason: 'explicit' | 'navigation' = 'navigation') => {
            const token = lockTokenRef.current;
            if (!token || isReleasingLockRef.current) {
                return;
            }

            isReleasingLockRef.current = true;
            try {
                await releaseLock(token, releaseReason);
            } catch (error) {
                console.warn('Failed to release edit lock', error);
            } finally {
                isReleasingLockRef.current = false;
                clearLockState();
            }
        },
        [clearLockState],
    );

    useEffect(() => {
        if (!enabled || !isDirty || isSubmitting || !scope || blockedByLock) {
            return;
        }

        let isCancelled = false;

        const acquireLock = async () => {
            try {
                const currentToken = lockTokenRef.current;
                const currentScope = activeScopeRef.current;
                const hasMatchingLock =
                    currentToken &&
                    currentScope?.sectionKey === scope.sectionKey &&
                    currentScope?.languageId === scope.languageId;

                if (hasMatchingLock) {
                    return;
                }

                if (currentToken) {
                    try {
                        await releaseLock(currentToken, 'navigation');
                    } catch (error) {
                        console.warn('Failed to rotate edit lock', error);
                    }
                }

                const lock = await acquireResourceLock({
                    resourceType,
                    resourceId,
                    sectionKey: scope.sectionKey,
                    languageId: scope.languageId,
                });

                if (isCancelled) {
                    try {
                        await releaseLock(lock.lock_token, 'navigation');
                    } catch (error) {
                        console.warn('Failed to release cancelled edit lock', error);
                    }
                    return;
                }

                setLockToken(lock.lock_token);
                setActiveScope(scope);
            } catch (error) {
                await onConflict?.(error);
            }
        };

        void acquireLock();

        return () => {
            isCancelled = true;
        };
    }, [blockedByLock, enabled, resourceId, resourceType, isDirty, isSubmitting, onConflict, scope]);

    useEffect(() => {
        if (!lockToken || isSubmitting) {
            return;
        }

        const intervalId = globalThis.setInterval(() => {
            void refreshLock(lockToken).catch((error) => {
                console.warn('Failed to refresh edit lock', error);
                clearLockState();
            });
        }, heartbeatIntervalMs);

        return () => {
            globalThis.clearInterval(intervalId);
        };
    }, [clearLockState, heartbeatIntervalMs, isSubmitting, lockToken]);

    useEffect(() => {
        if (!lockToken && !activeScope) {
            return;
        }

        if (!enabled || !scope) {
            void releaseActiveLock('navigation');
            return;
        }

        if (scope.sectionKey !== activeScope?.sectionKey) {
            void releaseActiveLock('navigation');
            return;
        }

        if (scope.languageId === undefined || activeScope?.languageId === scope.languageId) {
            return;
        }

        void releaseActiveLock('navigation');
    }, [activeScope, enabled, lockToken, releaseActiveLock, scope]);

    useEffect(() => {
        if (lockToken && !isDirty && !isSubmitting) {
            void releaseActiveLock('explicit');
        }
    }, [isDirty, isSubmitting, lockToken, releaseActiveLock]);

    useEffect(() => {
        const bestEffortRelease = () => {
            const token = lockTokenRef.current;
            if (!token) {
                return;
            }

            void releaseLock(token, 'navigation').catch((error) => {
                console.warn('Failed best-effort release on page exit', error);
            });
        };

        globalThis.addEventListener('beforeunload', bestEffortRelease);
        globalThis.addEventListener('pagehide', bestEffortRelease);

        return () => {
            globalThis.removeEventListener('beforeunload', bestEffortRelease);
            globalThis.removeEventListener('pagehide', bestEffortRelease);
            void releaseActiveLock('navigation');
        };
    }, [releaseActiveLock]);

    return {
        activeLockToken: lockToken,
        activeLockScope: activeScope,
        releaseActiveLock,
    };
};

export default useResourceSectionEditLock;
