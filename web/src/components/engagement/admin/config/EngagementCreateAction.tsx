import { ActionFunction, redirect } from 'react-router';
import { postEngagement as createEngagement } from 'services/engagementService';
import { addTeamMemberToEngagement } from 'services/membershipService';
import { ROUTES, getPath } from 'routes/routes';

const getLanguageCodes = (formData: FormData): string[] => {
    const values = formData.getAll('languages').map(String);
    return values
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean);
};

export const engagementCreateAction: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const engagement = await createEngagement({
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        is_internal: formData.get('is_internal') === 'true',
        languages: getLanguageCodes(formData),
        description: '',
        rich_description: '',
        description_title: '',
    });
    formData.getAll('users').forEach((user_id) => {
        addTeamMemberToEngagement({ user_id: user_id.toString(), engagement_id: engagement.id });
    });
    return redirect(getPath(ROUTES.ENGAGEMENT_DETAILS_CONFIG, { engagementId: engagement.id }));
};

export default engagementCreateAction;
