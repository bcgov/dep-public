import { Params } from 'react-router';
import { getUser } from 'services/userService/api';
import { User } from 'models/user';

export interface UserDetailsLoaderData {
    user: Promise<User>;
}

export const userDetailsLoader = ({ params }: { params: Params<string> }): UserDetailsLoaderData => {
    const { userId } = params;

    if (!userId || Number.isNaN(Number(userId))) {
        throw new Error('User ID is required');
    }

    const user = getUser({
        user_id: Number(userId),
        include_roles: true,
    });

    return { user };
};

export default userDetailsLoader;
