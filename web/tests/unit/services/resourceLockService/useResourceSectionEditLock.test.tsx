import { act, renderHook } from '@testing-library/react';
import { acquireResourceLock, releaseLock, ResourceLockRecord } from 'services/resourceLockService';
import useResourceSectionEditLock from 'services/resourceLockService/useResourceSectionEditLock';

jest.mock('services/resourceLockService', () => ({
    RESOURCE_TYPE_ENGAGEMENT_SECTION: 'engagement_section',
    acquireResourceLock: jest.fn(),
    refreshLock: jest.fn(),
    releaseLock: jest.fn(),
}));

const mockedAcquireResourceLock = jest.mocked(acquireResourceLock);
const mockedReleaseLock = jest.mocked(releaseLock);

describe('useResourceSectionEditLock', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedReleaseLock.mockResolvedValue({ released: true });
    });

    it('does not restart a pending acquisition when callback and scope identities change', async () => {
        let resolveAcquisition: (lock: ResourceLockRecord) => void = () => {};
        mockedAcquireResourceLock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveAcquisition = resolve;
                }),
        );

        const { result, rerender, unmount } = renderHook(
            ({
                scope,
                onConflict,
            }: {
                scope: { sectionKey: string; languageId: number };
                onConflict: (error: unknown) => void;
            }) =>
                useResourceSectionEditLock({
                    resourceId: 20,
                    scope,
                    isDirty: true,
                    isSubmitting: false,
                    onConflict,
                }),
            {
                initialProps: {
                    scope: { sectionKey: 'authoring.details', languageId: 127 },
                    onConflict: jest.fn(),
                },
            },
        );

        rerender({
            scope: { sectionKey: 'authoring.details', languageId: 127 },
            onConflict: jest.fn(),
        });

        expect(mockedAcquireResourceLock).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveAcquisition({
                lock_token: 'lock-token',
                lock_scope: 'engagement_section:20:authoring.details:lang:127',
                resource_type: 'engagement_section',
                resource_id: 20,
                section_key: 'authoring.details',
                language_id: 127,
                owner: { user_sub: 'user' },
                owner_session_id: 'session',
                acquired_at: '2026-10-13T00:00:00Z',
                is_mine: true,
            });
        });

        expect(result.current.activeLockToken).toBe('lock-token');
        expect(mockedReleaseLock).not.toHaveBeenCalled();

        unmount();
    });
});
