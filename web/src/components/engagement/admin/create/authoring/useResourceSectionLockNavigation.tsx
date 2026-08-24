import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { NavigateOptions } from 'react-router';
import { useAppDispatch, useAppSelector } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { releaseLock, ResourceLockRecord } from 'services/resourceLockService';
import AuthoringLockConflictModal from './AuthoringLockConflictModal';
import { USER_ROLES } from 'services/userService/constants';

const AUTHORING_UNSAVED_CHANGES_KEY = 'authoring-unsaved-changes';
export type NavigationRequestResult = 'navigated' | 'pending' | 'blocked';

const getSectionLockState = (lock: ResourceLockRecord | null | undefined, currentUserRoles?: string[]) => {
    const canBreakLock = Boolean(lock?.is_mine || currentUserRoles?.includes(USER_ROLES.EDIT_MEMBERS));
    const isLockedByOther = Boolean(lock && !lock.is_mine);

    return {
        canBreakLock,
        isLockedByOther,
        isDisabled: isLockedByOther && !canBreakLock,
    };
};

export const useSectionLockState = ({ lock }: { lock?: ResourceLockRecord | null }) => {
    const currentUserRoles = useAppSelector((state) => state.user.roles);
    return getSectionLockState(lock, currentUserRoles);
};

type PendingNavigation = {
    href: string;
    // Plain string (not AuthoringSectionName) so non-authoring consumers (e.g. config) can supply their own label.
    sectionName: string;
    lock: ResourceLockRecord;
    onBeforeNavigate?: () => void;
    navigationOptions?: NavigateOptions;
};

type ConflictModalOptions = {
    lock?: ResourceLockRecord | null;
    // Plain string (not AuthoringSectionName) so non-authoring consumers (e.g. config) can supply their own label.
    sectionName?: string;
    onBack: () => void;
    onRetry?: () => Promise<void> | void;
    onAfterBreakLock?: () => Promise<void> | void;
    backButtonText?: string;
    retryButtonText?: string;
    breakButtonText?: string;
};

export const useResourceSectionLockNavigation = ({ conflictModal }: { conflictModal?: ConflictModalOptions } = {}) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
    const [isBreakingLock, setIsBreakingLock] = useState(false);
    const [isConflictActionRunning, setIsConflictActionRunning] = useState(false);
    const currentUserRoles = useAppSelector((state) => state.user.roles);

    const resolveSectionLockState = useCallback(
        (lock?: ResourceLockRecord | null) => {
            return getSectionLockState(lock, currentUserRoles);
        },
        [currentUserRoles],
    );

    const requestNavigation = useCallback(
        ({
            href,
            sectionName,
            lock,
            onBeforeNavigate,
            navigationOptions,
        }: {
            href: string;
            sectionName: string;
            lock?: ResourceLockRecord | null;
            onBeforeNavigate?: () => void;
            navigationOptions?: NavigateOptions;
        }): NavigationRequestResult => {
            const { canBreakLock, isDisabled } = resolveSectionLockState(lock);
            if (!lock || lock.is_mine) {
                onBeforeNavigate?.();
                navigate(href, navigationOptions);
                return 'navigated';
            }

            if (isDisabled) {
                return 'blocked';
            }

            if (canBreakLock) {
                const hasUnsavedChanges = sessionStorage.getItem(AUTHORING_UNSAVED_CHANGES_KEY) === '1';
                if (hasUnsavedChanges) {
                    onBeforeNavigate?.();
                    navigate(href, navigationOptions);
                    return 'navigated';
                }

                setPendingNavigation({
                    href,
                    sectionName,
                    lock,
                    onBeforeNavigate,
                    navigationOptions,
                });
                return 'pending';
            }

            return 'blocked';
        },
        [navigate, resolveSectionLockState],
    );

    const closeBreakLockModal = useCallback(() => {
        if (isBreakingLock) {
            return;
        }

        setPendingNavigation(null);
    }, [isBreakingLock]);

    const confirmBreakAndNavigate = useCallback(async () => {
        if (!pendingNavigation) {
            return;
        }

        setIsBreakingLock(true);
        try {
            const releaseReason =
                currentUserRoles?.includes(USER_ROLES.SUPER_ADMIN) && !pendingNavigation.lock.is_mine
                    ? 'force_takeover'
                    : 'explicit';

            await releaseLock(pendingNavigation.lock.lock_token, releaseReason);
            pendingNavigation.onBeforeNavigate?.();
            navigate(pendingNavigation.href, pendingNavigation.navigationOptions);
            setPendingNavigation(null);
        } catch (error) {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: error instanceof Error ? error.message : 'Unable to break the existing lock.',
                }),
            );
        } finally {
            setIsBreakingLock(false);
        }
    }, [currentUserRoles, dispatch, navigate, pendingNavigation]);

    const breakLockModal = useMemo(() => {
        const pendingLock = pendingNavigation?.lock;
        return (
            <AuthoringLockConflictModal
                open={Boolean(pendingNavigation)}
                lock={pendingLock}
                sectionName={pendingNavigation?.sectionName}
                isBusy={isBreakingLock}
                backButtonText="Stay Here"
                showRetry={false}
                breakButtonText="Break Lock and Continue"
                onBack={closeBreakLockModal}
                onBreakLock={() => {
                    void confirmBreakAndNavigate();
                }}
            />
        );
    }, [closeBreakLockModal, confirmBreakAndNavigate, isBreakingLock, pendingNavigation]);

    const conflictLockModal = useMemo(() => {
        const currentLock = conflictModal?.lock;
        if (!currentLock) {
            return null;
        }

        const canBreakLock = Boolean(currentLock?.is_mine || currentUserRoles?.includes(USER_ROLES.EDIT_MEMBERS));

        const handleRetry = conflictModal.onRetry;

        const handleBreak = canBreakLock
            ? async () => {
                  setIsConflictActionRunning(true);
                  try {
                      await releaseLock(currentLock.lock_token, 'explicit');
                      await conflictModal.onAfterBreakLock?.();
                  } catch (error) {
                      let errorMessage = 'Unable to release lock from the other tab.';
                      if (error instanceof Error) {
                          errorMessage = error.message;
                      }
                      dispatch(
                          openNotification({
                              severity: 'error',
                              text: errorMessage,
                          }),
                      );
                  } finally {
                      setIsConflictActionRunning(false);
                  }
              }
            : undefined;

        return (
            <AuthoringLockConflictModal
                open={Boolean(currentLock)}
                lock={currentLock}
                sectionName={conflictModal.sectionName}
                isBusy={isConflictActionRunning}
                backButtonText={conflictModal.backButtonText}
                retryButtonText={conflictModal.retryButtonText}
                breakButtonText={conflictModal.breakButtonText}
                onBack={conflictModal.onBack}
                onRetry={
                    handleRetry
                        ? () => {
                              void (async () => {
                                  setIsConflictActionRunning(true);
                                  try {
                                      await handleRetry();
                                  } finally {
                                      setIsConflictActionRunning(false);
                                  }
                              })();
                          }
                        : undefined
                }
                onBreakLock={
                    handleBreak
                        ? () => {
                              void handleBreak();
                          }
                        : undefined
                }
            />
        );
    }, [conflictModal, currentUserRoles, dispatch, isConflictActionRunning]);

    return {
        breakLockModal,
        conflictLockModal,
        resolveSectionLockState,
        requestNavigation,
    };
};

export default useResourceSectionLockNavigation;
