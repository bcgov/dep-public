import { Params } from 'react-router';
import { getUser } from 'services/userService/api';

export const userDetailsLoader = async ({ params }: { params: Params<string> }) => {
    const { userId } = params;

    if (!userId || Number.isNaN(Number(userId))) {
        throw new Error('User ID is required');
    }

    const user = await getUser({
        user_id: Number(userId),
        include_roles: true,
    });

    return { user };
};

export default userDetailsLoader;
