import React from 'react';
import { Chip } from '@mui/material';
import { COMMENTS_STATUS, CommentStatus } from 'constants/commentStatus';
import { faBadgeCheck, faDoNotEnter, faHourglassClock, faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHexagonCheck } from '@fortawesome/pro-regular-svg-icons/faHexagonCheck';
import { faUserRobot } from '@fortawesome/pro-solid-svg-icons/faUserRobot';
import { UserAvatar } from 'components/common/Layout';

export const AuthorChip = ({ author }: { author: string }) => {
    if (!author) {
        return <Chip label={<i>Unreviewed</i>} color="default" variant="outlined" />;
    }
    const icon =
        author?.toLowerCase() === 'system' ? (
            <FontAwesomeIcon icon={faUserRobot} style={{ fontSize: '20px', marginRight: '0.5rem' }} />
        ) : (
            <UserAvatar
                displayName={author}
                sx={{
                    height: '1.25rem',
                    width: '1.25rem',
                    fontSize: '0.5125rem',
                    marginRight: '0.5rem',
                    marginLeft: '-0.1rem',
                }}
            />
        );
    const label = (
        <span style={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            {author}
        </span>
    );
    return <Chip label={label}></Chip>;
};

const colorMap = {
    [CommentStatus.Pending]: 'default' as const,
    [CommentStatus.Approved]: 'success' as const,
    [CommentStatus.Rejected]: 'error' as const,
    [CommentStatus.NeedsFurtherReview]: 'warning' as const,
};

const iconMap = {
    [CommentStatus.Pending]: faHourglassClock,
    [CommentStatus.Approved]: faBadgeCheck,
    [CommentStatus.Rejected]: faDoNotEnter,
    [CommentStatus.NeedsFurtherReview]: faMagnifyingGlass,
};

export const CommentStatusChip = ({ commentStatus, isAuto }: { commentStatus: CommentStatus; isAuto?: boolean }) => {
    const isAutoApproved = isAuto && commentStatus === CommentStatus.Approved;
    if (isAutoApproved) {
        return (
            <Chip
                color="success"
                label={
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={faHexagonCheck} style={{ marginRight: '0.5rem' }} />
                        Auto-Approved
                    </span>
                }
            />
        );
    }

    const color = colorMap[commentStatus];
    const icon = isAutoApproved ? faHexagonCheck : iconMap[commentStatus];

    const label = (
        <span style={{ display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={icon} style={{ marginRight: '0.5rem' }} />
            {COMMENTS_STATUS[commentStatus]}
        </span>
    );

    return <Chip color={color} label={label} sx={{ fontWeight: 500 }} />;
};
