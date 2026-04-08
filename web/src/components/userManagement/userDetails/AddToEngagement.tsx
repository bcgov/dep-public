import React, { useContext, useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import { FormControl, FormControlLabel, FormHelperText, FormLabel, Grid2 as Grid, Paper, Radio } from '@mui/material';
import { modalStyle } from 'components/common';
import { BodyText, Heading3 } from 'components/common/Typography';
import { USER_COMPOSITE_ROLE } from 'models/user';
import { UserDetailsContext } from './UserDetailsContext';
import { useForm, FormProvider, SubmitHandler, Controller, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { addUserToRole } from 'services/userService/api';
import { addTeamMemberToEngagement } from 'services/membershipService';
import { When } from 'react-if';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useAppDispatch } from 'hooks';
import axios, { AxiosError } from 'axios';
import { Palette } from 'styles/Theme';
import { Engagement } from 'models/engagement';
import ControlledRadioGroup from 'components/common/ControlledInputComponents/ControlledRadioGroup';
import { HTTP_STATUS_CODES } from 'constants/httpResponseCodes';
import { EngagementAutocomplete } from 'components/userManagement/common/EngagementAutocomplete';
import { ModalActions } from 'components/userManagement/common/ModalActions';

export const AddToEngagementModal = () => {
    const { savedUser, addUserModalOpen, setAddUserModalOpen, getUserMemberships, getUserDetails } =
        useContext(UserDetailsContext);
    const userHasRole = savedUser?.composite_roles && savedUser?.composite_roles.length > 0;
    const schema = yup
        .object({
            engagement: yup.mixed<Engagement>().nullable(),
            role: yup.string().when([], {
                is: () => savedUser?.composite_roles.length === 0,
                then: yup.string().required('A role must be specified'),
                otherwise: yup.string(),
            }),
        })
        .required();

    type AddUserForm = yup.TypeOf<typeof schema>;

    const dispatch = useAppDispatch();
    const [isAssigningRole, setIsAssigningRole] = useState(false);
    const [backendError, setBackendError] = useState('');

    const methods = useForm<AddUserForm>({
        resolver: yupResolver(schema) as unknown as Resolver<AddUserForm>,
    });

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
        watch,
    } = methods;

    const userTypeSelected = watch('role');

    const formValues = watch();
    useEffect(() => {
        if (backendError) {
            setBackendError('');
        }
    }, [JSON.stringify(formValues)]);

    const { role: roleErrors, engagement: engagementErrors } = errors;

    const handleClose = () => {
        setAddUserModalOpen(false);
        reset({});
        setBackendError('');
    };

    const addUserToEngagement = async (data: AddUserForm) => {
        if (userHasRole) {
            await addTeamMemberToEngagement({
                user_id: savedUser?.external_id,
                engagement_id: data.engagement?.id,
            });
            dispatch(
                openNotification({
                    severity: 'success',
                    text: `You have successfully added ${savedUser?.first_name} ${savedUser?.last_name} as a ${savedUser?.main_role} on ${data.engagement?.name}.`,
                }),
            );
        } else {
            if (userTypeSelected === USER_COMPOSITE_ROLE.ADMIN.value) {
                await addUserToRole({ user_id: savedUser?.external_id, role: data.role ?? '' });
                dispatch(
                    openNotification({
                        severity: 'success',
                        text: `You have successfully added ${savedUser?.first_name} ${savedUser?.last_name} to the role ${USER_COMPOSITE_ROLE.ADMIN.label}`,
                    }),
                );
            } else {
                await addUserToRole({ user_id: savedUser?.external_id, role: data.role ?? '' });
                await addTeamMemberToEngagement({
                    user_id: savedUser?.external_id,
                    engagement_id: data.engagement?.id,
                });
                dispatch(
                    openNotification({
                        severity: 'success',
                        text: `You have successfully added ${savedUser?.first_name} ${savedUser?.last_name} as a ${data.role} on ${data.engagement?.name}.`,
                    }),
                );
            }
            getUserDetails();
        }
        getUserMemberships();
    };

    const setErrors = (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status !== HTTP_STATUS_CODES.CONFLICT) {
            return;
        }
        setBackendError(error.response?.data?.message || '');
    };

    const onSubmit: SubmitHandler<AddUserForm> = async (data: AddUserForm) => {
        try {
            setIsAssigningRole(true);
            await addUserToEngagement(data);
            setIsAssigningRole(false);
            handleClose();
        } catch (error) {
            setIsAssigningRole(false);
            if (axios.isAxiosError(error)) {
                setErrors(error);
            }
            dispatch(openNotification({ severity: 'error', text: 'An error occurred while trying to add user' }));
        }
    };

    return (
        <Modal open={addUserModalOpen} onClose={handleClose} keepMounted={false}>
            <Paper sx={{ ...modalStyle }}>
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container direction="row" alignItems="flex-start" justifyContent="flex-start" spacing={2}>
                            <Grid size={12}>
                                <When condition={!userHasRole}>
                                    <Heading3 bold>
                                        Assign Role to {savedUser?.first_name + ' ' + savedUser?.last_name}
                                    </Heading3>
                                </When>
                                <When condition={userHasRole}>
                                    <Heading3 bold>
                                        Add {savedUser?.first_name + ' ' + savedUser?.last_name} to Engagement
                                    </Heading3>
                                </When>
                            </Grid>

                            <Grid
                                size={12}
                                container
                                direction="row"
                                alignItems="flex-start"
                                justifyContent="flex-start"
                                rowSpacing={4}
                            >
                                <When condition={!userHasRole}>
                                    <Grid size={12}>
                                        <FormControl error={Boolean(errors['role'])}>
                                            <FormLabel
                                                id="controlled-radio-buttons-group"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: Palette.text.primary,
                                                    paddingBottom: 1,
                                                }}
                                            >
                                                What role would you like to assign to this user?
                                            </FormLabel>
                                            <ControlledRadioGroup name="role">
                                                <FormControlLabel
                                                    value={USER_COMPOSITE_ROLE.REVIEWER.value}
                                                    control={<Radio />}
                                                    label={'Reviewer'}
                                                />
                                                <FormControlLabel
                                                    value={USER_COMPOSITE_ROLE.TEAM_MEMBER.value}
                                                    control={<Radio />}
                                                    label={'Team Member'}
                                                />
                                            </ControlledRadioGroup>
                                            <When condition={Boolean(roleErrors)}>
                                                <FormHelperText>{String(roleErrors?.message)}</FormHelperText>
                                            </When>
                                        </FormControl>
                                    </Grid>
                                </When>
                                <When
                                    condition={
                                        userTypeSelected === USER_COMPOSITE_ROLE.TEAM_MEMBER.value ||
                                        userTypeSelected === USER_COMPOSITE_ROLE.REVIEWER.value ||
                                        userHasRole
                                    }
                                >
                                    <Grid size={12}>
                                        <BodyText bold sx={{ marginBottom: '2px', display: 'flex' }}>
                                            Which Engagement would you like to add{' '}
                                            {savedUser?.first_name + ' ' + savedUser?.last_name} to?
                                        </BodyText>
                                        <Controller
                                            control={control}
                                            name="engagement"
                                            render={({ field: { onChange, value } }) => (
                                                <EngagementAutocomplete
                                                    value={(value as Engagement | null) ?? null}
                                                    onChange={onChange}
                                                    error={Boolean(engagementErrors)}
                                                    helperText={String(engagementErrors?.message || '')}
                                                    hasTeamAccess
                                                />
                                            )}
                                        />
                                    </Grid>
                                </When>
                            </Grid>
                            <When condition={backendError}>
                                <Grid size={12}>
                                    <BodyText size="small" color="error">
                                        {backendError}
                                    </BodyText>
                                </Grid>
                            </When>
                            <ModalActions onClose={handleClose} loading={isAssigningRole} />
                        </Grid>
                    </form>
                </FormProvider>
            </Paper>
        </Modal>
    );
};
