import axios from 'axios';
import { ENGAGEMENT_MEMBERSHIP_STATUS } from 'models/engagementTeamMember';
import { ActionFunction, redirect } from 'react-router';
import { ApiErrorBody, patchEngagement } from 'services/engagementService';
import { openNotification } from 'services/notificationService/notificationSlice';
import { LOCK_TOKEN_HEADER } from 'services/resourceLockService';
import {
    addTeamMemberToEngagement,
    revokeMembership,
    reinstateMembership,
    getTeamMembers,
} from 'services/membershipService';
import { store } from 'store';
import { ROUTES, getPath } from 'routes/routes';

const getUpdateFailureMessage = (error: unknown): string => {
    if (!axios.isAxiosError<ApiErrorBody>(error)) {
        return 'Failed to update engagement';
    }

    if (typeof error.response?.data === 'string') {
        return error.response.data;
    }

    return error.response?.data?.message ?? 'Failed to update engagement';
};

const getLanguageCodes = (formData: FormData): string[] => {
    const values = formData.getAll('languages').map(String);
    return values
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean);
};

export const engagementUpdateAction: ActionFunction = async ({ request, params }) => {
    const formData = await request.formData();
    const engagementId = Number(params.engagementId);
    const lockToken = formData.get('lock_token');
    const requestHeaders: Record<string, string> | undefined =
        typeof lockToken === 'string' && lockToken ? { [LOCK_TOKEN_HEADER]: lockToken } : undefined;
    try {
        await patchEngagement(
            {
                id: engagementId,
                slug: formData.get('slug') as string,
                name: formData.get('name') as string,
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') as string,
                is_internal: formData.get('is_internal') === 'true',
                languages: getLanguageCodes(formData),
            },
            requestHeaders,
        );
    } catch (e) {
        const message = getUpdateFailureMessage(e);
        console.error('Error updating engagement:', e);
        store.dispatch(openNotification({ severity: 'error', text: message }));
        return { status: 'failure' };
    }

    const currentTeamMembers = await getTeamMembers({ engagement_id: engagementId });
    const users = formData.getAll('users') as string[];
    const usersSet = new Set(users);

    try {
        const membershipUpdates: Promise<unknown>[] = [];
        // Process deactivated users for reinstatement (and active users for revocation)
        // Caution - headaches ahead! There is a big difference between user_id and user.external_id
        for (const member of currentTeamMembers) {
            const isUserInForm = usersSet.has(String(member.user.external_id));
            if (member.status !== ENGAGEMENT_MEMBERSHIP_STATUS.Active) {
                if (isUserInForm) {
                    // If the user was previously deactivated, reinstate them
                    membershipUpdates.push(reinstateMembership(engagementId, member.user_id));
                }
            } else if (!isUserInForm) {
                // If the user was previously active but is not in the form, revoke their membership
                membershipUpdates.push(revokeMembership(engagementId, member.user_id));
            }

            // Remove all known users from the set so we can add new members in the next step
            usersSet.delete(String(member.user.external_id));
        }
        // Add new members that weren't in the current team members list
        for (const user of usersSet) {
            membershipUpdates.push(addTeamMemberToEngagement({ user_id: user, engagement_id: engagementId }));
        }

        await Promise.all(membershipUpdates);
    } catch (e) {
        console.error('Error updating team members', e);
    }

    return redirect(getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG, { engagementId }));
};

export default engagementUpdateAction;
