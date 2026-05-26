import React, { useEffect } from 'react';
import { Button } from 'components/common/Input/Button';
import { PickerDayOwnerState, StaticDatePicker, TimePicker } from '@mui/x-date-pickers';
import { Controller, useFormContext } from 'react-hook-form';
import { Grid2 as Grid, Stack } from '@mui/material';
import { BodyText } from 'components/common/Typography/Body';
import dayjs, { Dayjs } from 'dayjs';
import { When } from 'react-if';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/pro-regular-svg-icons';
import { colors } from 'styles/Theme';
import { Link } from 'components/common/Navigation';
import { EngagementStatusChip } from 'components/common/Indicators';
import { SubmissionStatus } from 'constants/engagementStatus';
import { OutlineBox } from 'components/common/Layout';

export const DateTimeRangePickerWithCalculation = () => {
    const engagementForm = useFormContext();
    const { control, reset, watch, setValue, getValues, trigger } = engagementForm;
    const [numberOfDays, setNumberOfDays] = React.useState(0);
    const [disableDatesBefore, setDisableDatesBefore] = React.useState<Dayjs | undefined>(dayjs());
    const [startDate, startTime, endDate, endTime] = watch(['start_date', 'start_time', 'end_date', 'end_time']);

    const isPickingDate = !watch('_dateConfirmed');

    const setIsPickingDate = (value: boolean) => {
        setValue('_dateConfirmed', !value);
    };

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name === 'start_date') {
                setDisableDatesBefore(value.start_date.clone().add(1, 'day'));
                if (!value.end_date || value.start_date.isAfter(value.end_date.clone().subtract(1, 'day'))) {
                    reset({
                        ...value,
                        end_date: value.start_date.clone().add(1, 'day'),
                    });
                }
                trigger('start_date');
                trigger('end_date');
            }
            if (name === 'end_date') {
                trigger('end_date');
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    useEffect(() => {
        if (startDate && endDate) {
            setNumberOfDays(endDate.clone().add(1, 'second').diff(startDate, 'days'));
        }
    }, [startDate, endDate]);

    const getDayStyle = (ownerState: PickerDayOwnerState) => {
        const day = dayjs(ownerState.day as Dayjs);
        const standardStyle = {
            margin: 0,
            width: '40px',
            height: '40px',
            color: colors.type.regular.primary,
        };
        if (
            getValues().start_date &&
            day.isSame(getValues().start_date, 'day') &&
            (day.isSame(getValues().end_date, 'day') || !getValues().end_date)
        ) {
            // First and last day of the range - rounded corners
            return {
                ...standardStyle,
                backgroundColor: colors.surface.blue[80],
                color: colors.type.inverted.primary,
                border: `1px solid ${colors.surface.blue[80]}`,
            };
        }
        if (!getValues().start_date) return standardStyle;
        if (day.isSame(getValues().start_date, 'day')) {
            // First day of the range - rounded left side
            return {
                ...standardStyle,
                backgroundColor: colors.surface.blue[80],
                '&.MuiButtonBase-root:not(.Mui-selected)': {
                    color: colors.type.inverted.primary,
                },
                borderRadius: '50% 0 0 50%',
                border: `1px solid ${colors.surface.blue[80]}`,
                borderRight: 'none',
            };
        }
        if (!getValues().end_date) return standardStyle;
        if (day.isSame(getValues().end_date, 'day')) {
            // Last day of the range - rounded right side
            return {
                ...standardStyle,
                backgroundColor: colors.surface.blue[80],
                color: colors.type.inverted.primary,
                borderRadius: '0 50% 50% 0',
                border: `1px solid ${colors.surface.blue[80]}`,
                borderLeft: 'none',
                '&:hover': {
                    backgroundColor: colors.surface.blue[70],
                },
            };
        }
        if (day.isAfter(getValues().start_date) && day.isBefore(getValues().end_date)) {
            // Middle days of the range - no rounded corners
            return {
                ...standardStyle,
                backgroundColor: colors.surface.blue[10],
                borderRadius: 0,
                borderTop: `1px solid ${colors.surface.blue[80]}`,
                borderBottom: `1px solid ${colors.surface.blue[80]}`,
            };
        }
        return standardStyle;
    };

    const calendarStyles = {
        border: 'none',
        borderRadius: '8px',
        width: '100%',
        minWidth: '150px',
        maxWidth: '400px',
        margin: '0 auto 0 0',
        '& .MuiPickersCalendarHeader-root': {
            mt: 0,
            p: 0,
        },
        '& .MuiDateCalendar-root': {
            height: '100%',
            maxHeight: { xs: '450px', lg: '400px' },
            minHeight: { xs: '450px', lg: '400px' },
            width: '100%',
            overflow: 'visible',
        },
        '& .MuiPickersSlideTransition-root.MuiDayCalendar-slideTransition': {
            overflow: 'visible',
            height: '100%',
            maxHeight: { xs: '360px', lg: '310px' },
            minHeight: { xs: '360px', lg: '310px' },
        },
        '& .MuiTypography-root.MuiTypography-caption.MuiDayCalendar-weekDayLabel': {
            flex: '1',
        },
        '& .MuiButtonBase-root.MuiPickersDay-root': {
            flex: '1',
            aspectRatio: '1 / 1',
            height: 'auto',
        },
    };

    const timePickerStyles = {
        borderRadius: '8px',
        boxShadow: '0 0 0 1px #7A7876 inset',
        border: 'none',
        width: '100%',
        maxWidth: '400px',
        '& .MuiPickersInputBase-root': {
            borderRadius: '8px',
        },
    };

    const stackStyles = { gap: '1rem', flexBasis: { xs: '100%', lg: '50%' } };

    return (
        <Grid container mt={2} direction="column" spacing={2} sx={{ mt: 0 }}>
            <When condition={isPickingDate}>
                <Grid container direction="row" sx={{ gap: '2rem', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
                    <Stack sx={stackStyles}>
                        <BodyText bold>Start Date</BodyText>
                        <Controller
                            name="start_date"
                            rules={{ required: 'Start date is required' }}
                            control={control}
                            render={({ field }) => (
                                <StaticDatePicker
                                    {...field}
                                    sx={calendarStyles}
                                    slotProps={{
                                        day: (ownerState) => {
                                            return {
                                                sx: getDayStyle(ownerState),
                                            };
                                        },
                                    }}
                                    showDaysOutsideCurrentMonth
                                    disablePast
                                    displayStaticWrapperAs="desktop"
                                    slots={{ actionBar: () => null }}
                                    fixedWeekNumber={6}
                                    aria-label="Pick an engagement start date"
                                />
                            )}
                        />

                        <BodyText bold>Start Time (Pacific Timezone)</BodyText>
                        <Controller
                            control={control}
                            name="start_time"
                            rules={{ required: 'Start time is required' }}
                            render={({ field }) => (
                                <TimePicker
                                    {...field}
                                    disablePast
                                    format="h:mm a"
                                    slotProps={{
                                        textField: {
                                            error: false,
                                        },
                                    }}
                                    sx={timePickerStyles}
                                    aria-label="Pick an engagement start time"
                                />
                            )}
                        />
                    </Stack>
                    <Stack sx={stackStyles}>
                        <BodyText bold>End Date</BodyText>
                        <Controller
                            name="end_date"
                            rules={{ required: 'End date is required' }}
                            control={control}
                            render={({ field }) => (
                                <StaticDatePicker
                                    {...field}
                                    value={field.value || undefined}
                                    disabled={!startDate}
                                    slotProps={{
                                        day: (ownerState) => {
                                            return {
                                                sx: getDayStyle(ownerState),
                                            };
                                        },
                                    }}
                                    disableHighlightToday
                                    showDaysOutsideCurrentMonth
                                    disablePast
                                    displayStaticWrapperAs="desktop"
                                    minDate={disableDatesBefore}
                                    slots={{ actionBar: () => null }}
                                    fixedWeekNumber={6}
                                    sx={calendarStyles}
                                    aria-label="Pick an engagement end date"
                                />
                            )}
                        />
                        <BodyText bold>End Time (Pacific Timezone)</BodyText>
                        <Controller
                            control={control}
                            name="end_time"
                            rules={{ required: 'End time is required' }}
                            render={({ field }) => (
                                <TimePicker
                                    {...field}
                                    disablePast
                                    format="h:mm a"
                                    slotProps={{
                                        textField: {
                                            error: false,
                                        },
                                    }}
                                    sx={timePickerStyles}
                                    aria-label="Pick an engagement end time"
                                />
                            )}
                        />
                    </Stack>
                </Grid>
                <Grid container direction="row" alignItems="center" spacing={2}>
                    <Grid>
                        <Button variant="primary" onClick={() => setIsPickingDate(false)}>
                            Select
                        </Button>
                    </Grid>
                    <Grid>
                        <Link
                            sx={{ cursor: 'pointer', color: colors.type.regular.primary }}
                            onClick={() => {
                                reset({
                                    ...getValues(),
                                    start_date: undefined,
                                    end_date: undefined,
                                });
                                setNumberOfDays(0);
                                setIsPickingDate(false);
                            }}
                        >
                            Reset
                        </Link>
                    </Grid>
                </Grid>
            </When>
            <When condition={!isPickingDate}>
                {Boolean(numberOfDays) && (
                    <Grid>
                        <OutlineBox sx={{ maxWidth: '400px' }}>
                            <Grid container direction="column" size={{ xs: 12 }} spacing={2}>
                                <Grid>
                                    <BodyText bold sx={{ color: 'primary.main' }}>
                                        Engagement Feedback Dates
                                    </BodyText>
                                </Grid>
                                <Grid container direction="row" spacing={1}>
                                    <Grid>
                                        <EngagementStatusChip statusId={SubmissionStatus.Open} />
                                    </Grid>
                                    <Grid>
                                        <BodyText bold display="inline">
                                            {startDate.format('MMM D, YYYY')}{' '}
                                        </BodyText>
                                    </Grid>
                                    <Grid>
                                        <BodyText thin display="inline">
                                            {`(${dayjs(startTime, 'HH:mm:ss').format('h:mm a')})`}
                                        </BodyText>
                                    </Grid>
                                </Grid>
                                <Grid container direction="row" spacing={1}>
                                    <Grid>
                                        <EngagementStatusChip statusId={SubmissionStatus.Closed} />
                                    </Grid>
                                    <Grid>
                                        <BodyText bold display="inline">
                                            {endDate.format('MMM D, YYYY')}{' '}
                                        </BodyText>
                                    </Grid>
                                    <Grid>
                                        <BodyText thin display="inline">
                                            {`(${dayjs(endTime, 'HH:mm:ss').format('h:mm a')})`}
                                        </BodyText>
                                    </Grid>
                                </Grid>
                                <Grid sx={{ mb: 1 }}>
                                    <BodyText bold size="large" sx={{ color: 'primary.light', lineHeight: 1 }}>
                                        <span style={{ fontSize: '72px' }}>{numberOfDays}</span>
                                        <span style={{ position: 'relative', bottom: '32px', fontSize: '24px' }}>
                                            {' '}
                                            days
                                        </span>
                                    </BodyText>
                                </Grid>
                            </Grid>
                        </OutlineBox>
                    </Grid>
                )}
                <Grid sx={{ '&.MuiGrid-root': { paddingTop: 0 } }}>
                    <Button onClick={() => setIsPickingDate(true)} icon={<FontAwesomeIcon icon={faCalendar} />}>
                        {`${numberOfDays ? 'Change' : 'Select'} Dates and Times`}
                    </Button>
                </Grid>
            </When>
        </Grid>
    );
};
