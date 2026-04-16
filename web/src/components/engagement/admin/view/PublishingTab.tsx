import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BodyText, Heading2 } from 'components/common/Typography';
import { Box, Grid2 as Grid, Modal } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { Await, createSearchParams, Form, useFetcher, useRouteLoaderData } from 'react-router';
import dayjs, { Dayjs } from 'dayjs';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from 'components/common/Input/Button';
import { EngagementLoaderAdminData } from '../EngagementLoaderAdmin';
import { Engagement } from 'models/engagement';
import { Then, If, Else } from 'react-if';
import { EngagementStatus } from 'constants/engagementStatus';
import { colors } from 'styles/Theme';
import ConfirmModal from 'components/common/Modals/ConfirmModal';
import { useAppDispatch } from 'hooks';
import { openNotification } from 'services/notificationService/notificationSlice';
import { AlertColor } from 'services/notificationService/types';
import { ROUTES, getPath } from 'routes/routes';

export interface PublishEngagementData {
    id: number;
    form_date: Dayjs;
    form_time: Dayjs;
    scheduled_date: string;
    status_id: EngagementStatus;
}

const now = dayjs(new Date());
const defaultValues = {
    id: 0,
    form_date: now,
    form_time: now,
    scheduled_date: now.format('YYYY-MM-DD hh:mm a'),
    status_id: EngagementStatus.Draft,
};

const numericEnumValues = (e: object) => Object.values(e).filter((v) => typeof v === 'number') as number[];
const publishEngagementSchema = yup.object({
    form_date: yup
        .mixed<Dayjs>()
        .test('is-dayjs', 'Invalid date', (value) => dayjs.isDayjs(value))
        .required(),
    form_time: yup
        .mixed<Dayjs>()
        .test('is-dayjs', 'Invalid date', (value) => dayjs.isDayjs(value))
        .required(),
    status_id: yup.number().oneOf(numericEnumValues(EngagementStatus)).required(),
});

export const PublishingTab = () => {
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);
    const fetcher = useFetcher();
    const dispatch = useAppDispatch();
    const { engagement } = useRouteLoaderData('single-engagement') as EngagementLoaderAdminData;
    const engPubForm = useForm<PublishEngagementData>({
        defaultValues: useMemo(() => defaultValues, [defaultValues]),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        resolver: yupResolver(publishEngagementSchema) as unknown as Resolver<PublishEngagementData>,
    });

    useEffect(() => {
        if ('success' === fetcher.data || 'failure' === fetcher.data) {
            const responseText =
                'success' === fetcher.data
                    ? 'Publishing status updated successfully.'
                    : 'Unable to update publishing status.';
            const responseSeverity = 'success' === fetcher.data ? 'success' : 'error';
            notify(responseSeverity, responseText);
            fetcher.data = undefined;
        }
        if ('success' === fetcher.data) {
            const newDefaults = engPubForm.getValues();
            engPubForm.reset(newDefaults);
        }
    }, [fetcher.data]);

    useEffect(() => {
        engagement.then((eng) => {
            engPubForm.setValue('id', eng.id);
            engPubForm.setValue('form_date', dayjs(eng.scheduled_date || dayjs(new Date())));
            engPubForm.setValue('form_time', dayjs(eng.scheduled_date || dayjs(new Date())));
            engPubForm.setValue('scheduled_date', eng.scheduled_date || '');
            engPubForm.setValue('status_id', eng.status_id || EngagementStatus.Draft);
            engPubForm.reset(engPubForm.getValues());
        });
    }, [engagement]);

    const publishConfirm = () => {
        const formDate = engPubForm.getValues('form_date');
        const formTime = engPubForm.getValues('form_time');
        if (dayjs.isDayjs(formDate) && dayjs.isDayjs(formTime)) {
            const newDateString = `${formDate.format('YYYY-MM-DD')} ${formTime.format('hh:mm a')}`;
            const newDate = dayjs(newDateString);
            const now = dayjs(new Date());
            if (newDate?.isValid() && newDate.isAfter(now)) {
                engPubForm.setValue('status_id', EngagementStatus.Scheduled);
                engPubForm.setValue('scheduled_date', newDateString);
                submitForm(engPubForm.getValues());
            } else {
                notify('error', 'The date and time must be after the present.');
            }
        } else {
            notify('error', 'The date and/or time are invalid.');
        }
        setPublishConfirmOpen(false);
    };

    const unpublishConfirm = () => {
        const statusId: EngagementStatus = engPubForm.getValues('status_id');
        const errorVerb = statusId === EngagementStatus.Published ? 'published' : 'scheduled';
        if (statusId === EngagementStatus.Published) {
            engPubForm.setValue('status_id', EngagementStatus.Unpublished);
            submitForm(engPubForm.getValues());
        } else if (statusId === EngagementStatus.Scheduled) {
            engPubForm.setValue('status_id', EngagementStatus.Draft);
            submitForm(engPubForm.getValues());
        } else {
            notify('error', `The engagement could not be un${errorVerb}.`);
        }
        setUnpublishConfirmOpen(false);
    };

    const submitForm = async (data: PublishEngagementData) => {
        fetcher.submit(
            createSearchParams({
                id: 0 !== data.id ? String(data.id) : '',
                scheduled_date: data.scheduled_date || '',
                status_id: String(data.status_id) || '',
            }),
            {
                method: 'post',
                action: getPath(ROUTES.ENGAGEMENT_DETAILS_PUBLISH, { engagementId: data.id }),
            },
        );
    };

    const notify = (severity: AlertColor, text: string) => {
        dispatch(
            openNotification({
                severity: severity,
                text: text,
            }),
        );
    };

    // Styles

    const dateAndTimeContainerStyles = {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        gap: '1rem',
    };

    const publishingSectionStyles = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        margin: '2rem 0',
        padding: '0',
        flexBasis: '50%',
        width: '50%',
    };

    const labelStyles = {
        fontWeight: 'bold',
        mb: '0.5rem',
    };

    const calendarStyles = {
        width: '100%',
        '&:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled)': {
            'fieldset.MuiPickersOutlinedInput-notchedOutline': {
                borderColor: colors.surface.gray[80],
            },
        },
    };

    const timePickerStyles = {
        width: '100%',
        '& fieldset': { borderColor: colors.surface.gray[80] },
    };

    const publishButtonContainerStyles = {
        display: 'flex',
        gap: '1rem',
    };

    const buttonStyles = {
        minHeight: { xs: '100px', md: '50px' },
    };

    return (
        <>
            {/* confirm that the user wants to publish the engagement */}
            <Modal open={publishConfirmOpen} aria-describedby="publish-modal-subtext">
                <ConfirmModal
                    style="warning"
                    header={`Are you sure you want to publish this engagement?`}
                    subHeader="This action should not be performed unless all engagement content is ready."
                    subTextId="publish-modal-subtext"
                    subText={[
                        {
                            text: 'Your engagement will be published at the selected date and time.',
                            bold: false,
                        },
                    ]}
                    handleConfirm={publishConfirm}
                    handleClose={() => setPublishConfirmOpen(false)}
                    confirmButtonText={'Publish Engagement'}
                    cancelButtonText={'Cancel & Go Back'}
                />
            </Modal>

            <Grid id="admin-authoring-section" direction="column" maxWidth={'700px'}>
                <Heading2 decorated>Publishing</Heading2>
                <Suspense>
                    <Await resolve={engagement}>
                        {(eng: Engagement) => (
                            <>
                                {/* confirm that the user wants to unpublish the engagement */}
                                {/* Modal must await engagement values */}
                                <Modal open={unpublishConfirmOpen} aria-describedby="unpublish-modal-subtext">
                                    <ConfirmModal
                                        style="danger"
                                        header={`Are you sure you want to ${eng.status_id === EngagementStatus.Scheduled ? 'unschedule' : 'unpublish'} this engagement?`}
                                        subHeader="This action cannot be undone."
                                        subTextId="unpublish-modal-subtext"
                                        subText={[
                                            {
                                                text: `Your engagement will be placed in ${eng.status_id === EngagementStatus.Scheduled ? 'a draft' : 'an unpublished'} state.`,
                                                bold: false,
                                            },
                                        ]}
                                        handleConfirm={unpublishConfirm}
                                        handleClose={() => setUnpublishConfirmOpen(false)}
                                        confirmButtonText={`${eng.status_id === EngagementStatus.Scheduled ? 'Unschedule' : 'Unpublish'} Engagement`}
                                        cancelButtonText={'Cancel & Go Back'}
                                    />
                                </Modal>
                                <If condition={eng.status_id === EngagementStatus.Published}>
                                    <Then>
                                        <BodyText size="small">The engagement has already been published.</BodyText>
                                    </Then>
                                    <Else>
                                        <BodyText size="small">
                                            The Engagement page will be visible on the date selected below, but the
                                            public won't be able to provide feedback until the public comment period
                                            opens.
                                        </BodyText>
                                        <BodyText size="small">
                                            Enter the date and time you want the Engagement page to go live.
                                        </BodyText>
                                    </Else>
                                </If>
                                <Form onSubmit={engPubForm.handleSubmit(submitForm)} id="publishing-form">
                                    <Box sx={dateAndTimeContainerStyles}>
                                        <Box sx={publishingSectionStyles}>
                                            <Box component="label" htmlFor="publish_date" sx={labelStyles}>
                                                Date
                                            </Box>
                                            <Controller
                                                control={engPubForm.control}
                                                name="form_date"
                                                rules={{ required: 'Publishing date is required' }}
                                                render={({ field }) => (
                                                    <DatePicker
                                                        {...field}
                                                        disabled={eng.status_id === EngagementStatus.Published}
                                                        showDaysOutsideCurrentMonth
                                                        slots={{ actionBar: () => null }}
                                                        fixedWeekNumber={6}
                                                        sx={calendarStyles}
                                                        aria-label="Pick a publishing date"
                                                    />
                                                )}
                                            />
                                        </Box>
                                        <Box sx={publishingSectionStyles}>
                                            <Box component="label" htmlFor="publish_time" sx={labelStyles}>
                                                Time (Pacific Timezone)
                                            </Box>
                                            <Controller
                                                control={engPubForm.control}
                                                name="form_time"
                                                rules={{ required: 'Publishing time is required' }}
                                                render={({ field }) => (
                                                    <TimePicker
                                                        {...field}
                                                        disabled={eng.status_id === EngagementStatus.Published}
                                                        disablePast
                                                        format="hh:mm a"
                                                        slotProps={{
                                                            textField: {
                                                                error: false,
                                                            },
                                                        }}
                                                        sx={timePickerStyles}
                                                        aria-label="Pick a publishing time"
                                                    />
                                                )}
                                            />
                                        </Box>
                                    </Box>
                                    <Box sx={publishButtonContainerStyles}>
                                        <Button
                                            sx={buttonStyles}
                                            disabled={eng.status_id === EngagementStatus.Published}
                                            variant="primary"
                                            type="button"
                                            onClick={() => setPublishConfirmOpen(true)}
                                        >
                                            {eng.status_id === EngagementStatus.Scheduled
                                                ? 'Update Scheduled Date & Time'
                                                : 'Publish'}
                                        </Button>
                                        <Button
                                            sx={buttonStyles}
                                            disabled={
                                                eng.status_id !== EngagementStatus.Published &&
                                                eng.status_id !== EngagementStatus.Scheduled
                                            }
                                            variant="secondary"
                                            type="button"
                                            onClick={() => setUnpublishConfirmOpen(true)}
                                        >
                                            {eng.status_id === EngagementStatus.Scheduled
                                                ? 'Cancel Scheduled Date & Time'
                                                : 'Unpublish'}
                                        </Button>
                                    </Box>
                                </Form>
                            </>
                        )}
                    </Await>
                </Suspense>
            </Grid>
        </>
    );
};

export default PublishingTab;
