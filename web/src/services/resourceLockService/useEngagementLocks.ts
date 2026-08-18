import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    applyResourceLockEvent,
    getEngagementLocks,
    ResourceLocksForEngagement,
    subscribeToResourceLockEvents,
} from './index';

const DEFAULT_LOCK_POLL_INTERVAL_MS = 15000;

const EMPTY_LOCKS: ResourceLocksForEngagement = {
    resource_type: 'engagement_section',
    resource_id: 0,
    locks: [],
};

type LockStoreSnapshot = {
    locks: ResourceLocksForEngagement;
    isLoading: boolean;
};

type EngagementLockStore = {
    getSnapshot: () => LockStoreSnapshot;
    subscribe: (listener: () => void) => () => void;
    retain: (initialLocksPromise?: Promise<ResourceLocksForEngagement>) => void;
    release: () => boolean;
    refresh: () => Promise<ResourceLocksForEngagement>;
    seed: (locks: ResourceLocksForEngagement) => void;
    setPollIntervalMs: (pollIntervalMs: number) => void;
};

const engagementLockStores = new Map<number, EngagementLockStore>();

const createEngagementLockStore = ({
    engagementId,
    pollIntervalMs,
}: {
    engagementId: number;
    pollIntervalMs: number;
}): EngagementLockStore => {
    let snapshot: LockStoreSnapshot = {
        locks: EMPTY_LOCKS,
        isLoading: true,
    };
    let referenceCount = 0;
    let hasInitialized = false;
    let currentPollIntervalMs = pollIntervalMs;
    let intervalId: ReturnType<typeof globalThis.setInterval> | null = null;
    let unsubscribeFromEvents: (() => void) | null = null;
    let inFlightRefresh: Promise<ResourceLocksForEngagement> | null = null;
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
        if (!Number.isFinite(engagementId) || engagementId <= 0) {
            updateSnapshot({
                locks: EMPTY_LOCKS,
                isLoading: false,
            });
            return EMPTY_LOCKS;
        }

        const activeRefresh = inFlightRefresh;
        if (activeRefresh !== null) {
            return activeRefresh;
        }

        inFlightRefresh = (async () => {
            try {
                const fetchedLocks = await getEngagementLocks(engagementId);
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

    const initialize = (initialLocksPromise?: Promise<ResourceLocksForEngagement>) => {
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
        if (intervalId || !Number.isFinite(engagementId) || engagementId <= 0) {
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
                if (event.type === 'upsert' && event.lock.resource_id !== engagementId) {
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

const getEngagementLockStore = ({ engagementId, pollIntervalMs }: { engagementId: number; pollIntervalMs: number }) => {
    const existingStore = engagementLockStores.get(engagementId);
    if (existingStore) {
        existingStore.setPollIntervalMs(pollIntervalMs);
        return existingStore;
    }

    const store = createEngagementLockStore({ engagementId, pollIntervalMs });
    engagementLockStores.set(engagementId, store);
    return store;
};

export const useEngagementLocks = ({
    engagementId,
    initialLocksPromise,
    refreshToken,
    pollIntervalMs = DEFAULT_LOCK_POLL_INTERVAL_MS,
}: {
    engagementId: number;
    initialLocksPromise?: Promise<ResourceLocksForEngagement>;
    refreshToken?: unknown;
    pollIntervalMs?: number;
}) => {
    const normalizedEngagementId = Number(engagementId);
    const store = useMemo(
        () => getEngagementLockStore({ engagementId: normalizedEngagementId, pollIntervalMs }),
        [normalizedEngagementId, pollIntervalMs],
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
                engagementLockStores.delete(normalizedEngagementId);
            }
        };
    }, [initialLocksPromise, normalizedEngagementId, store]);

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

export default useEngagementLocks;
