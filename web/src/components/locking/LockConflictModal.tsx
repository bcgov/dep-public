import React from 'react';
import { Modal, Grid2 as Grid, Stack } from '@mui/material';
import { modalStyle } from 'components/common';
import { Heading2, BodyText } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { faHammerCrash, faLockAlt } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ResourceLockRecord, getLockOwnerDisplayName } from 'services/resourceLockService';
import { UserAvatar } from 'components/common/Layout/UserAvatar';
import { EngagementLoaderAdminData } from 'engagements/admin/EngagementLoaderAdmin';
import { useRouteLoaderData } from 'react-router';
import { useAppSelector } from 'hooks';
import { formatRelative } from 'components/common/dateHelper';

export const LockConflictModal = ({
    open,
    lock,
    isBusy,
    sectionName,
    backButtonText = 'Back to Authoring Tab',
    retryButtonText = 'Try Again',
    breakButtonText = 'Release Lock',
    showRetry = true,
    onBack,
    onRetry,
    onBreakLock,
}: {
    open: boolean;
    lock?: ResourceLockRecord | null;
    isBusy?: boolean;
    sectionName?: string;
    backButtonText?: string;
    retryButtonText?: string;
    breakButtonText?: string;
    showRetry?: boolean;
    onBack: () => void;
    onRetry?: () => void;
    onBreakLock?: () => void;
}) => {
    const currentUserSub = useAppSelector((state) => state.user.userDetail?.sub);
    const ownerName = getLockOwnerDisplayName(lock?.owner) ?? 'another editor';
    const isCurrentUserLock = Boolean(lock?.owner.user_sub === currentUserSub);
    const engagementLoaderData = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData | undefined;
    const lockLastRenewed = lock?.heartbeat_at ? formatRelative(lock?.heartbeat_at) : 'unknown';
    const lockExpiresAt = lock?.expires_at ? formatRelative(lock?.expires_at) : 'unknown';

    const languageLabel = (() => {
        if (lock?.language_id === null || lock?.language_id === undefined) {
            return 'all';
        }

        if (!engagementLoaderData?.languages) {
            return `Language #${lock.language_id}`;
        }

        const resolvedLanguages = React.use(engagementLoaderData.languages);
        const language = resolvedLanguages.find((item) => item.id === lock?.language_id);
        return language ? language.name : `Unknown Language - ID ${lock?.language_id}`;
    })();

    return (
        <Modal
            open={open}
            aria-labelledby="authoring-lock-conflict-title"
            sx={{
                '& .MuiBackdrop-root': {
                    zIndex: 10001, // to cover formio's absurd z-index of 10000 for its modal dialogs
                },
                '& > .MuiGrid2-root': {
                    zIndex: 10002, // ditto
                },
            }}
        >
            <Grid
                container
                direction="column"
                spacing={2}
                sx={{
                    ...modalStyle,
                    borderColor: 'warning.main',
                }}
            >
                <Grid container>
                    <Grid size="grow">
                        <Heading2 id="authoring-lock-conflict-title" sx={{ mb: 0 }}>
                            <FontAwesomeIcon icon={faLockAlt} /> This section is currently locked
                        </Heading2>
                    </Grid>
                </Grid>
                <Grid container direction="column" spacing={1} sx={{ mb: 2 }}>
                    <Grid container alignItems="center" spacing={1}>
                        <UserAvatar
                            displayName={ownerName}
                            fallbackCharacter="?"
                            sx={{
                                bgcolor: isCurrentUserLock ? 'success.main' : 'warning.main',
                                color: isCurrentUserLock ? 'common.white' : 'grey.900',
                                border: '1px solid',
                                borderColor: isCurrentUserLock ? 'success.dark' : 'warning.dark',
                            }}
                        />

                        <BodyText component="span">
                            This lock belongs to{' '}
                            <b>{isCurrentUserLock ? 'another tab/session you opened' : ownerName}</b>.
                        </BodyText>
                    </Grid>
                    <Grid container direction="column" spacing={1}>
                        <Grid container spacing={1}>
                            <BodyText bold>Section:</BodyText>
                            <BodyText>{sectionName ?? 'Unknown'}</BodyText>
                        </Grid>
                        {languageLabel && languageLabel !== 'all' ? (
                            <Grid container spacing={1}>
                                <BodyText bold>Language:</BodyText>
                                <BodyText>{languageLabel}</BodyText>
                            </Grid>
                        ) : null}
                        <Grid container spacing={1}>
                            <BodyText bold>Lock renewed:</BodyText>
                            <BodyText>{lockLastRenewed}</BodyText>
                        </Grid>
                        <Grid container spacing={1}>
                            <BodyText bold>Expires:</BodyText>
                            <BodyText>{lockExpiresAt} if not renewed</BodyText>
                        </Grid>
                    </Grid>

                    <BodyText>
                        {isCurrentUserLock
                            ? 'You can save from that other tab, then try again here. If needed, you can also break that lock from this tab.'
                            : 'Please return to the main page and try again later.'}
                    </BodyText>
                </Grid>
                <Grid>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1}>
                        <Button type="button" onClick={onBack} disabled={isBusy}>
                            {backButtonText}
                        </Button>
                        {isCurrentUserLock && showRetry && onRetry ? (
                            <Button type="button" onClick={onRetry} disabled={isBusy}>
                                {retryButtonText}
                            </Button>
                        ) : null}
                        {onBreakLock ? (
                            <Button
                                icon={<FontAwesomeIcon icon={faHammerCrash} />}
                                variant="primary"
                                color="warning"
                                type="button"
                                onClick={onBreakLock}
                                disabled={isBusy}
                            >
                                {breakButtonText}
                            </Button>
                        ) : null}
                    </Stack>
                </Grid>
            </Grid>
        </Modal>
    );
};

export default LockConflictModal;
