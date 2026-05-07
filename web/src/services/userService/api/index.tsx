import http from 'apiManager/httpRequestHandler';
import Endpoints from 'apiManager/endpoints';
import { Page } from 'services/type';
import { User } from 'models/user';
import { replaceUrl } from 'helper';
import { Engagement } from 'models/engagement';

export interface GetUserListParams {
    page?: number;
    size?: number;
    sort_key?: string;
    sort_order?: 'asc' | 'desc';
    search_text?: string;
    // If yes, user roles will be fetched as well from keycloak
    include_roles?: boolean;
    include_inactive?: boolean;
}
export const getUserList = async (params: GetUserListParams = {}): Promise<Page<User>> => {
    const responseData = await http.GetRequest<Page<User>>(Endpoints.User.GET_LIST, params);
    return (
        responseData.data ?? {
            items: [],
            total: 0,
        }
    );
};

interface GetUserParams {
    user_id: number;
    // If yes, user roles will be fetched as well from keycloak
    include_roles?: boolean;
}
export const getUser = async (params: GetUserParams): Promise<User> => {
    const url = replaceUrl(Endpoints.User.GET, 'user_id', String(params.user_id));
    const response = await http.GetRequest<User>(url, params);
    if (response.data) {
        return response.data;
    }
    return Promise.reject('Failed to fetch user details');
};

interface AddUserToRoleProps {
    user_id?: string;
    role?: string;
}
export const addUserToRole = async ({ user_id, role }: AddUserToRoleProps): Promise<User> => {
    const url = replaceUrl(Endpoints.User.ADD_TO_COMPOSITE_ROLE, 'user_id', String(user_id));
    const responseData = await http.PostRequest<User>(url, {}, { role });
    return responseData.data;
};

interface ChangeUserRoleProps {
    user_id: number;
    role: string;
}
export const changeUserRole = async ({ user_id, role }: ChangeUserRoleProps): Promise<User> => {
    const url = replaceUrl(Endpoints.User.CHANGE_COMPOSITE_ROLE, 'user_id', String(user_id));
    const responseData = await http.PutRequest<User>(url, {}, { role });
    return responseData.data;
};

interface GetUserEngagementsParams {
    user_id?: string;
}

export const fetchUserEngagements = async ({ user_id }: GetUserEngagementsParams): Promise<Engagement[]> => {
    if (!user_id) {
        return [];
    }
    const url = replaceUrl(Endpoints.User.GET_USER_ENGAGEMENTS, 'user_id', String(user_id));
    const responseData = await http.GetRequest<Engagement[]>(url);
    return responseData.data ?? [];
};

export const toggleUserStatus = async (user_id: string, active: boolean): Promise<User> => {
    const url = replaceUrl(Endpoints.User.TOGGLE_USER_STATUS, 'user_id', String(user_id));
    const data = {
        active,
    };
    const responseData = await http.PatchRequest<User>(url, data);
    return responseData.data;
};

export interface DeleteUserResponse {
    message: string;
    action: 'deleted_user' | 'removed_current_tenant_membership';
}

export const deleteUser = async (user_id: number): Promise<DeleteUserResponse> => {
    const url = replaceUrl(Endpoints.User.DELETE, 'user_id', String(user_id));
    const responseData = await http.DeleteRequest<DeleteUserResponse>(url);
    return responseData.data;
};
