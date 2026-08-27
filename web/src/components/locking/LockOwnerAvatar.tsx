import React, { Suspense } from 'react';
import type { AvatarProps } from '@mui/material/Avatar';
import { Tooltip, Skeleton } from '@mui/material';
import { ResourceLockRecord, getLockOwnerDisplayName } from 'services/resourceLockService';
import { UserAvatar } from 'components/common/Layout/UserAvatar';
import { useAppSelector } from 'hooks';

const UnsuspendedLockOwnerAvatar = ({
    lock,
    size = 22,
    ...props
}: AvatarProps & {
    lock?: ResourceLockRecord | Promise<ResourceLockRecord>;
    size?: number;
}) => {
    const lockRecord = lock instanceof Promise ? React.use(lock) : lock;
    if (!lockRecord) {
        return null;
    }
    const currentUserSub = useAppSelector((state) => state.user.userDetail.sub);
    const languageName = useAppSelector((state) => state.language.name);
    const ownerName = getLockOwnerDisplayName(lockRecord.owner);
    const languageSuffix = languageName ? ` in ${languageName}` : '';
    const title = lockRecord.is_mine ? `Locked by you${languageSuffix}` : `Locked by ${ownerName}${languageSuffix}`;
    const recordIsMine = lockRecord.is_mine || lockRecord.owner?.user_sub === currentUserSub;

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Tooltip title={title} placement="top" arrow>
                <UserAvatar
                    displayName={ownerName}
                    fallbackCharacter="?"
                    {...props}
                    sx={[
                        {
                            width: size,
                            height: size,
                            fontSize: `${Math.max(10, Math.floor(size * 0.45))}px`,
                            bgcolor: recordIsMine ? 'success.main' : 'warning.main',
                            color: recordIsMine ? 'common.white' : 'grey.900',
                            border: '1px solid',
                            borderColor: recordIsMine ? 'success.dark' : 'warning.dark',
                        },
                        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
                    ]}
                />
            </Tooltip>
        </span>
    );
};

export const LockOwnerAvatar = ({
    lock,
    size = 22,
    ...props
}: AvatarProps & {
    lock?: ResourceLockRecord;
    size?: number;
}) => {
    return (
        <Suspense fallback={<LockOwnerAvatarSkeleton size={size} />}>
            <UnsuspendedLockOwnerAvatar lock={lock} size={size} {...props} />
        </Suspense>
    );
};

export const LockOwnerAvatarSkeleton = ({ size = 22 }: { size?: number }) => (
    <Skeleton variant="circular" width={size} height={size} />
);

export default LockOwnerAvatar;
