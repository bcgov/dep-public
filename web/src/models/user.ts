export type UserCompositeRole = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER' | 'TEAM_MEMBER' | 'REVIEWER';

export const USER_COMPOSITE_ROLE: { [x: string]: { value: UserCompositeRole; label: string } } = {
    SUPER_ADMIN: {
        value: 'SUPER_ADMIN',
        label: 'Super Admin',
    },
    ADMIN: {
        value: 'ADMIN',
        label: 'Administrator',
    },
    VIEWER: {
        value: 'VIEWER',
        label: 'Viewer',
    },
    TEAM_MEMBER: {
        value: 'TEAM_MEMBER',
        label: 'Team Member',
    },
    REVIEWER: {
        value: 'REVIEWER',
        label: 'Reviewer',
    },
};

export interface User {
    contact_number: string;
    created_date: string;
    description: string;
    email_address: string;
    external_id: string;
    first_name: string;
    composite_roles: string[];
    id: number;
    last_name: string;
    updated_date: string;
    roles: string[];
    main_role: string;
    username: string;
    status_id: number;
}

export const USER_STATUS: { [x: string]: { value: number; label: string } } = {
    ACTIVE: {
        value: 1,
        label: 'Active',
    },
    INACTIVE: {
        value: 2,
        label: 'Deactivated',
    },
};

export const createDefaultUser: User = {
    id: 0,
    contact_number: '',
    description: '',
    email_address: '',
    external_id: '',
    composite_roles: [''],
    first_name: '',
    last_name: '',
    updated_date: Date(),
    created_date: Date(),
    roles: [],
    username: '',
    main_role: '',
    status_id: 0,
};
