import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    applyResourceLockEvent,
    getEngagementLocks,
    getSurveyLocks,
    RESOURCE_TYPE_ENGAGEMENT_SECTION,
    RESOURCE_TYPE_SURVEY,
    ResourceLocks,
    subscribeToResourceLockEvents,
} from './index';

const DEFAULT_LOCK_POLL_INTERVAL_MS = 15000;

const RESOURCE_LOCK_FETCHERS: Record<string, (resourceId: number) => Promise<ResourceLocks>> = {
    [RESOURCE_TYPE_ENGAGEMENT_SECTION]: getEngagementLocks,
    [RESOURCE_TYPE_SURVEY]: getSurveyLocks,
};

const buildEmptyLocks = (resourceType: string): ResourceLocks => ({
    resource_type: resourceType,
    resource_id: 0,
    locks: [],
});

type LockStoreSnapshot = {
    locks: ResourceLocks;
    isLoading: boolean;
};

type ResourceLockStore = {
    getSnapshot: () => LockStoreSnapshot;
    subscribe: (listener: () => void) => () => void;
    retain: (initialLocksPromise?: Promise<ResourceLocks>) => void;
    release: () => boolean;
    refresh: () => Promise<ResourceLocks>;
    seed: (locks: ResourceLocks) => void;
    setPollIntervalMs: (pollIntervalMs: number) => void;
};

const resourceLockStores = new Map<string, ResourceLockStore>();

const getStoreKey = (resourceType: string, resourceId: number) => `${resourceType}:${resourceId}`;

const createResourceLockStore = ({
    resourceType,
    resourceId,
    pollIntervalMs,
}: {
    resourceType: string;
    resourceId: number;
    pollIntervalMs: number;
}): ResourceLockStore => {
    const emptyLocks = buildEmptyLocks(resourceType);
    const fetchLocks = RESOURCE_LOCK_FETCHERS[resourceType];
    let snapshot: LockStoreSnapshot = {
        locks: emptyLocks,
        isLoading: true,
    };
    let referenceCount = 0;
    let hasInitialized = false;
    let currentPollIntervalMs = pollIntervalMs;
    let intervalId: ReturnType<typeof globalThis.setInterval> | null = null;
    let unsubscribeFromEvents: (() => void) | null = null;
    let inFlightRefresh: Promise<ResourceLocks> | null = null;
    let inFlightInitialize: Promise<void> | null = null;
    const listeners = new Set<() => void>();

    const emit = () => {
        listeners.forEach((listener) => {
            listener();
        });
    };

    const updateSnapshot = (nextSnapshot: LockStoreSnapshot | ((current: LockStoreSnapshot) => LockStoreSnapshot)) => {
        snapshot = typeof nextSnapshot === 'function' ? nextSnapshot(snapshot) : nextSnapshot;
        emit();
    };

    const refresh = async () => {
        if (!fetchLocks || !Number.isFinite(resourceId) || resourceId <= 0) {
            console.warn('Invalid resource type or ID for lock refresh', resourceType, resourceId);
            updateSnapshot({
                locks: emptyLocks,
                isLoading: false,
            });
            return emptyLocks;
        }

        const activeRefresh = inFlightRefresh;
        if (activeRefresh !== null) {
            return activeRefresh;
        }

        inFlightRefresh = (async () => {
            try {
                const fetchedLocks = await fetchLocks(resourceId);
                updateSnapshot({
                    locks: fetchedLocks,
                    isLoading: false,
                });
                return fetchedLocks;
            } finally {
                inFlightRefresh = null;
            }
        })();

        return inFlightRefresh;
    };

    const initialize = (initialLocksPromise?: Promise<ResourceLocks>) => {
        if (hasInitialized) {
            return inFlightInitialize ?? Promise.resolve();
        }

        const activeInitialize = inFlightInitialize;
        if (activeInitialize !== null) {
            return activeInitialize;
        }

        updateSnapshot((current) => ({
            ...current,
            isLoading: true,
        }));

        inFlightInitialize = (async () => {
            const providedInitialLocksPromise = initialLocksPromise;
            if (providedInitialLocksPromise !== undefined) {
                try {
                    const initialLocks = await providedInitialLocksPromise;
                    updateSnapshot((current) => ({
                        ...current,
                        locks: initialLocks,
                    }));
                } catch {
                    // Fall back to direct API refresh below.
                }
            }

            try {
                await refresh();
            } finally {
                hasInitialized = true;
                updateSnapshot((current) => ({
                    ...current,
                    isLoading: false,
                }));
                inFlightInitialize = null;
            }
        })();

        return inFlightInitialize;
    };

    const startPolling = () => {
        if (intervalId || !Number.isFinite(resourceId) || resourceId <= 0) {
            return;
        }

        intervalId = globalThis.setInterval(() => {
            void refresh().catch(() => {
                // Don't let refresh errors bubble up to the store (best-effort refresh)
            });
        }, currentPollIntervalMs);
    };

    const stopPolling = () => {
        if (!intervalId) {
            return;
        }

        globalThis.clearInterval(intervalId);
        intervalId = null;
    };

    const startEventSubscription = () => {
        if (unsubscribeFromEvents) {
            return;
        }

        unsubscribeFromEvents = subscribeToResourceLockEvents((event) => {
            updateSnapshot((current) => {
                if (
                    event.type === 'upsert' &&
                    (event.lock.resource_type !== resourceType || event.lock.resource_id !== resourceId)
                ) {
                    return current;
                }

                return {
                    ...current,
                    locks: applyResourceLockEvent(current.locks, event),
                };
            });
        });
    };

    const stopEventSubscription = () => {
        if (!unsubscribeFromEvents) {
            return;
        }

        unsubscribeFromEvents();
        unsubscribeFromEvents = null;
    };

    return {
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        retain: (initialLocksPromise) => {
            referenceCount += 1;
            startEventSubscription();
            startPolling();
            void initialize(initialLocksPromise);
        },
        release: () => {
            referenceCount = Math.max(0, referenceCount - 1);
            if (referenceCount > 0) {
                return false;
            }

            stopPolling();
            stopEventSubscription();
            return true;
        },
        refresh,
        seed: (locks) => {
            updateSnapshot((current) => ({
                ...current,
                locks,
                isLoading: false,
            }));
        },
        setPollIntervalMs: (nextPollIntervalMs) => {
            if (currentPollIntervalMs === nextPollIntervalMs) {
                return;
            }

            currentPollIntervalMs = nextPollIntervalMs;
            if (referenceCount > 0) {
                stopPolling();
                startPolling();
            }
        },
    };
};

const getEngagementLockStore = ({
    resourceType,
    resourceId,
    pollIntervalMs,
}: {
    resourceType: string;
    resourceId: number;
    pollIntervalMs: number;
}) => {
    const key = getStoreKey(resourceType, resourceId);
    const existingStore = resourceLockStores.get(key);
    if (existingStore) {
        existingStore.setPollIntervalMs(pollIntervalMs);
        return existingStore;
    }

    const store = createResourceLockStore({ resourceType, resourceId, pollIntervalMs });
    resourceLockStores.set(key, store);
    return store;
};

export const useResourceLocks = ({
    resourceId,
    resourceType = RESOURCE_TYPE_ENGAGEMENT_SECTION,
    initialLocksPromise,
    refreshToken,
    pollIntervalMs = DEFAULT_LOCK_POLL_INTERVAL_MS,
}: {
    resourceId: number;
    resourceType?: string;
    initialLocksPromise?: Promise<ResourceLocks>;
    refreshToken?: unknown;
    pollIntervalMs?: number;
}) => {
    const normalizedResourceId = Number(resourceId);
    const store = useMemo(
        () => getEngagementLockStore({ resourceType, resourceId: normalizedResourceId, pollIntervalMs }),
        [resourceType, normalizedResourceId, pollIntervalMs],
    );
    const [storeSnapshot, setStoreSnapshot] = useState<LockStoreSnapshot>(() => store.getSnapshot());

    const refreshLocks = useCallback(async () => {
        return store.refresh();
    }, [store]);

    useEffect(() => {
        setStoreSnapshot(store.getSnapshot());
        return store.subscribe(() => {
            setStoreSnapshot(store.getSnapshot());
        });
    }, [store]);

    useEffect(() => {
        store.retain(initialLocksPromise);

        return () => {
            if (store.release()) {
                resourceLockStores.delete(getStoreKey(resourceType, normalizedResourceId));
            }
        };
    }, [initialLocksPromise, resourceType, normalizedResourceId, store]);

    useEffect(() => {
        let cancelled = false;
        if (initialLocksPromise === undefined) {
            return;
        }

        void initialLocksPromise
            .then((resolvedLocks) => {
                if (!cancelled) {
                    store.seed(resolvedLocks);
                }
            })
            .catch(() => {
                // Ignore lock fetch errors here, as the store will attempt to refresh locks on its own.
            });

        return () => {
            cancelled = true;
        };
    }, [initialLocksPromise, store]);

    useEffect(() => {
        if (refreshToken === undefined) {
            return;
        }

        void refreshLocks().catch(() => {
            // Don't let refresh errors bubble up to the component (best-effort refresh)
        });
    }, [refreshLocks, refreshToken]);

    return {
        locks: storeSnapshot.locks,
        isLoading: storeSnapshot.isLoading,
        refreshLocks,
    };
};

export default useResourceLocks;
