import React, { useContext, useEffect, useState } from 'react';
import Modal from '@mui/material/Modal';
import { Grid2 as Grid, Paper } from '@mui/material';
import { modalStyle } from 'components/common';
import { Heading3, BodyText } from 'components/common/Typography';
import { UserManagementContext } from './UserManagementContext';
import { useForm, FormProvider, SubmitHandler, Controller, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { addTeamMemberToEngagement } from 'services/membershipService';
import { When } from 'react-if';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useAppDispatch } from 'hooks';
import axios, { AxiosError } from 'axios';
import { EngagementAutocomplete } from 'components/userManagement/common/EngagementAutocomplete';
import { ModalActions } from 'components/userManagement/common/ModalActions';

const schema = yup
    .object({
        engagement: yup
            .object()
            .shape({
                id: yup.number().required(),
                name: yup.string().required(),
            })
            .nullable(),
    })
    .required();

type AddUserForm = yup.TypeOf<typeof schema>;

export const AddUserModal = () => {
    const dispatch = useAppDispatch();
    const { addUserModalOpen, setAddUserModalOpen, user, loadUserListing } = useContext(UserManagementContext);
    const [isAddingToEngagement, setIsAddingToEngagement] = useState(false);
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

    const formValues = watch();
    useEffect(() => {
        if (backendError) {
            setBackendError('');
        }
    }, [JSON.stringify(formValues)]);

    const { engagement: engagementErrors } = errors;

    const handleClose = () => {
        setAddUserModalOpen(false);
        reset({});
        setBackendError('');
    };

    const addUserToEngagement = async (data: AddUserForm) => {
        await addTeamMemberToEngagement({
            user_id: user?.external_id,
            engagement_id: data.engagement?.id,
        });
        dispatch(
            openNotification({
                severity: 'success',
                text: `You have successfully added ${user?.first_name + ' ' + user?.last_name} as a ${
                    user?.main_role
                } on ${data.engagement?.name}.`,
            }),
        );
    };

    const setErrors = (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status !== 409) {
            return;
        }
        setBackendError(error.response?.data?.message || '');
    };

    const onSubmit: SubmitHandler<AddUserForm> = async (data: AddUserForm) => {
        try {
            setIsAddingToEngagement(true);
            await addUserToEngagement(data);
            setIsAddingToEngagement(false);
            loadUserListing();
            handleClose();
        } catch (error) {
            setIsAddingToEngagement(false);
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
                                <Heading3 bold>Add {user?.first_name + ' ' + user?.last_name} to Engagement</Heading3>
                            </Grid>

                            <Grid
                                size={12}
                                container
                                direction="row"
                                alignItems="flex-start"
                                justifyContent="flex-start"
                                rowSpacing={4}
                            >
                                <Grid size={12}>
                                    <BodyText bold sx={{ marginBottom: '2px', display: 'flex' }}>
                                        Which Engagement would you like to add{' '}
                                        {user?.first_name + ' ' + user?.last_name} to?
                                    </BodyText>
                                    <Controller
                                        control={control}
                                        name="engagement"
                                        render={({ field: { onChange, value } }) => (
                                            <EngagementAutocomplete
                                                value={value}
                                                onChange={onChange}
                                                error={Boolean(engagementErrors)}
                                                helperText={String(engagementErrors?.message || '')}
                                                hasTeamAccess
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                            <When condition={backendError}>
                                <Grid size={12}>
                                    <BodyText size="small" color="error">
                                        {backendError}
                                    </BodyText>
                                </Grid>
                            </When>

                            <ModalActions onClose={handleClose} loading={isAddingToEngagement} />
                        </Grid>
                    </form>
                </FormProvider>
            </Paper>
        </Modal>
    );
};
