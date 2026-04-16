import { Avatar, Grid2 as Grid } from '@mui/material';
import { User, USER_COMPOSITE_ROLE } from 'models/user';
import React, { useEffect, useRef } from 'react';
import { useFetcher } from 'react-router';
import { BodyText } from 'components/common/Typography/Body';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/pro-regular-svg-icons';
import { colors } from 'styles/Theme';
import { useFormContext } from 'react-hook-form';
import { useAppSelector } from 'hooks';
import { debounce } from 'lodash';
import MultiSelect from './MultiSelect';
import { getPath, ROUTES } from 'routes/routes';

export const UserManager = () => {
    const currentUser = useAppSelector((state) => state.user);
    const fetcher = useFetcher({ key: 'user-search' });

    const engagementForm = useFormContext();
    const { setValue, watch } = engagementForm;
    const selectedUsers = watch('users') as User[];

    const debouncedSearch = useRef(
        debounce(
            (q) => {
                const searchOptions = new URLSearchParams({
                    searchTerm: q,
                    includeRoles: 'true',
                    sortKey: 'last_name',
                    sortOrder: 'asc',
                    page: '1',
                    size: '100',
                });
                fetcher.load(`${getPath(ROUTES.USER_MANAGEMENT_SEARCH)}?${searchOptions.toString()}`);
            },
            500,
            { maxWait: 1000, leading: true, trailing: true },
        ),
    );

    const users = (fetcher.data?.users?.items as User[] | undefined)?.filter(
        (user) =>
            // Remove ourselves from the list
            user.id !== currentUser.userDetail.user?.id &&
            // Remove admins from the list - they can already see everything and will cause an error if specified
            user.main_role !== USER_COMPOSITE_ROLE.ADMIN.label,
    );

    const handleAddUser = (user: User) => {
        if (!selectedUsers.filter((u) => u.id === user.id).length) {
            setValue('users', [...selectedUsers, user], { shouldDirty: true });
        }
    };

    const handleRemoveUser = (user: User) => {
        setValue(
            'users',
            selectedUsers.filter((u) => u !== user),
            { shouldDirty: true },
        );
    };

    useEffect(() => {
        debouncedSearch.current('');
    }, []);

    return (
        <MultiSelect<User>
            selectLabel="Add Team Members"
            options={users ?? []}
            onChange={(_, user, reason) => {
                if (reason === 'removeOption' && user) {
                    handleRemoveUser(user);
                }
                if (reason === 'selectOption' && user) {
                    handleAddUser(user);
                }
            }}
            onInputChange={(_, q) => {
                debouncedSearch.current(q);
            }}
            searchPlaceholder="Select Team Member"
            selectedLabel={{
                singular: 'Team Member Added',
                plural: 'Team Members Added',
            }}
            containerProps={{ sx: { width: '100%' } }}
            renderOption={(props, option) => {
                return (
                    <li {...props}>
                        <Grid container direction="row" spacing={2} alignItems={'center'}>
                            <Grid>
                                <Avatar
                                    sx={{
                                        height: '30px',
                                        width: '30px',
                                        fontSize: '16px',
                                        backgroundColor: 'primary.light',
                                    }}
                                >
                                    {`${option.first_name[0]}${option.last_name[0]}`}
                                </Avatar>
                            </Grid>
                            <Grid>{`${option.first_name} ${option.last_name}`}</Grid>
                        </Grid>
                        {props['aria-disabled'] && (
                            <Grid alignSelf="flex-end" marginLeft="auto">
                                <FontAwesomeIcon icon={faCheck} color={colors.notification.success.shade} />
                            </Grid>
                        )}
                    </li>
                );
            }}
            renderSelectedOption={(props, option, state) => {
                return (
                    <Grid container direction="row" spacing={1} alignItems="center">
                        <Grid>
                            <Avatar
                                sx={{
                                    height: '30px',
                                    width: '30px',
                                    fontSize: '16px',
                                    backgroundColor: 'primary.main',
                                }}
                            >
                                {`${option.first_name[0]}${option.last_name[0]}`}
                            </Avatar>
                        </Grid>
                        <Grid>
                            <BodyText>{`${option.first_name} ${option.last_name}`}</BodyText>
                        </Grid>
                    </Grid>
                );
            }}
            getOptionLabel={(option: User) => `${option.first_name} ${option.last_name}`}
            buttonLabel="Add Team Member"
            loading={fetcher.state === 'loading'}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionDisabled={(option) => selectedUsers.filter((u) => u.id === option.id).length > 0}
            selectedOptions={selectedUsers}
        />
    );
};
