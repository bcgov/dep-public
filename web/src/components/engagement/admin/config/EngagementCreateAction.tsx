import { ActionFunction, redirect } from 'react-router';
import { postEngagement as createEngagement } from 'services/engagementService';
import { patchEngagementSlug } from 'services/engagementSlugService';
import { addTeamMemberToEngagement } from 'services/membershipService';
import { ROUTES, getPath } from 'routes/routes';

export const engagementCreateAction: ActionFunction = async ({ request }) => {
    const formData = (await request.formData()) as FormData;
    const engagement = await createEngagement({
        name: formData.get('name') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        is_internal: formData.get('is_internal') === 'true',
        description: '',
        rich_description: '',
        description_title: '',
    });
    try {
        await patchEngagementSlug({
            engagement_id: engagement.id,
            slug: formData.get('slug') as string,
        });
    } catch (e) {
        console.error('Error updating engagement slug', e);
    }
    formData.getAll('users').forEach((user_id) => {
        addTeamMemberToEngagement({ user_id: user_id.toString(), engagement_id: engagement.id });
    });
    return redirect(getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG, { engagementId: engagement.id }));
};

export default engagementCreateAction;
