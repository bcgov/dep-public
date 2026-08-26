import React, { useMemo } from 'react';
import { CircularProgress, MenuItem, Select } from '@mui/material';
import { Palette } from 'styles/Theme';
import { ENGAGEMENT_MEMBERSHIP_STATUS, EngagementTeamMember } from 'models/engagementTeamMember';
import { reinstateMembership, revokeMembership } from 'services/membershipService';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { UserDetailsContext } from './UserDetailsContext';
import { USER_STATUS } from 'models/user';

interface ActionDropDownItem {
    value: number;
    label: string;
    action?: () => void;
    condition?: boolean;
}
export const ActionsDropDown = ({ membership }: { membership: EngagementTeamMember }) => {
    const [loading, setLoading] = React.useState(false);
    const { getUserMemberships, savedUser } = React.useContext(UserDetailsContext);
    const dispatch = useAppDispatch();

    const handleRevoke = async () => {
        try {
            setLoading(true);
            await revokeMembership(membership.engagement_id, membership.user_id);
            getUserMemberships();
            dispatch(
                openNotification({
                    text: `You have successfully revoked ${membership.user.first_name} ${membership.user.last_name} from ${membership.engagement?.name}`,
                    severity: 'success',
                }),
            );
            setLoading(false);
        } catch {
            setLoading(false);
            dispatch(openNotification({ text: 'Failed to revoke membership', severity: 'error' }));
        }
    };

    const handleReinstate = async () => {
        try {
            setLoading(true);
            await reinstateMembership(membership.engagement_id, membership.user_id);
            getUserMemberships();
            dispatch(
                openNotification({
                    text: `You have successfully reinstated ${membership.user.first_name} ${membership.user.last_name} on ${membership.engagement?.name}`,
                    severity: 'success',
                }),
            );
            setLoading(false);
        } catch {
            setLoading(false);
            dispatch(openNotification({ text: 'Failed to reinstate membership', severity: 'error' }));
        }
    };
    const ITEMS: ActionDropDownItem[] = useMemo(
        () => [
            {
                value: 1,
                label: 'Revoke',
                action: () => handleRevoke(),
                condition:
                    membership.status !== ENGAGEMENT_MEMBERSHIP_STATUS.Revoked &&
                    savedUser?.status_id === USER_STATUS.ACTIVE.value,
            },
            {
                value: 2,
                label: 'Reinstate',
                action: () => handleReinstate(),
                condition:
                    membership.status !== ENGAGEMENT_MEMBERSHIP_STATUS.Active &&
                    savedUser?.status_id === USER_STATUS.ACTIVE.value,
            },
        ],
        [membership.id, membership.status],
    );

    if (loading) {
        return <CircularProgress size={30} sx={{ color: Palette.info.main }} />;
    }

    return (
        <Select size="small" id={`action-drop-down-${membership.id}`} value={0} fullWidth>
            <MenuItem value={0} sx={{ fontStyle: 'italic', height: '2em' }} color="info" disabled>
                {'(Select One)'}
            </MenuItem>
            {ITEMS.filter((item) => item.condition).map((item) => (
                <MenuItem key={item.value} value={item.value} onClick={item.action}>
                    {item.label}
                </MenuItem>
            ))}
        </Select>
    );
};
