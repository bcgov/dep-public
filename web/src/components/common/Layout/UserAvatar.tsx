import React from 'react';
import Avatar, { AvatarProps } from '@mui/material/Avatar';
import { useAppSelector } from '../../../hooks';
import type { User } from 'models/user';

const getInitialsFromDisplayName = (displayName?: string): string => {
    if (!displayName) {
        return '';
    }

    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

export const UserAvatar = ({
    displayName,
    fallbackCharacter = '?',
    ...props
}: AvatarProps & { user?: User; displayName?: string; fallbackCharacter?: string }) => {
    const currentUser = useAppSelector((state) => state.user.userDetail.user);
    const initialsFromUser = currentUser
        ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase()
        : '';
    const initials = getInitialsFromDisplayName(displayName) || initialsFromUser;
    const fallbackFromUser = currentUser?.email_address?.[0]?.toUpperCase() || '';

    return (
        <Avatar
            {...props}
            sx={[
                {
                    color: (theme) => (theme.palette.mode === 'dark' ? 'blue.90' : 'blue.10'),
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'blue.10' : 'blue.90'),
                    height: '2rem',
                    width: '2rem',
                    fontSize: '1rem',
                },
                ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
            ]}
        >
            {initials || fallbackFromUser || fallbackCharacter}
        </Avatar>
    );
};
