import React, { useState, useEffect, Suspense, useMemo, memo } from 'react';
import { Grid2 as Grid, Skeleton, Paper, ThemeProvider } from '@mui/material';
import { Widget } from 'models/widget';
import { useAppDispatch, useSubmittedPolls, useAppSelector } from 'hooks';
import { PollWidget } from 'models/pollWidget';
import { fetchPollWidgets, postPollResponse } from 'services/widgetService/PollService/index';
import { openNotification } from 'services/notificationService/notificationSlice';
import { BodyText, Heading3 } from 'components/common/Typography';
import { BaseTheme, colors } from 'styles/Theme';
import { Await } from 'react-router';
import { PollStatus } from 'constants/engagementStatus';
import PollDisplay from 'components/engagement/form/EngagementWidgets/Poll/PollDisplay';
import { Button } from 'components/common/Input/Button';
import {
    faCheckCircle,
    faInboxFull,
    faSignalStreamSlash,
    faXmarkCircle,
    IconDefinition,
} from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PollWidgetViewProps {
    widget: Widget;
}

interface ResponseMessage {
    color: string;
    message: string;
    icon: IconDefinition;
}

const RESPONSE_MESSAGES = {
    SUCCESS: {
        color: colors.notification.success.icon,
        message: 'Thank you for the response.',
        icon: faCheckCircle,
    },
    RECORDED: { color: colors.notification.info.icon, message: 'Response already recorded.', icon: faCheckCircle },
    ERROR: { color: colors.notification.error.icon, message: 'An unknown error occurred.', icon: faXmarkCircle },
    NETWORK_ERROR: {
        color: colors.notification.error.icon,
        message: 'Network error. Please check your connection.',
        icon: faSignalStreamSlash,
    },
    LIMIT: {
        color: colors.notification.error.icon,
        message: 'You or your IP address have exceeded the response limit for this poll.',
        icon: faInboxFull,
    },
};

const PollMessage = ({ message, color, icon }: { message: string; color: string; icon: IconDefinition }) => (
    <Grid
        size={12}
        sx={{
            mt: 2,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        }}
    >
        <BodyText
            color={color}
            sx={{
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
            }}
        >
            <span style={{ fontSize: '3rem', marginBottom: '0.5em' }}>
                <FontAwesomeIcon icon={icon} />
            </span>
            {message}
        </BodyText>
    </Grid>
);

const SubmitSection = memo(
    ({
        isLoggedIn,
        onSubmit,
        responseMessage,
    }: {
        isLoggedIn: boolean;
        onSubmit: () => void;
        responseMessage: ResponseMessage | null;
    }) => {
        if (isLoggedIn) return null; // Only show for non-logged-in users

        return (
            <>
                <Grid size={12} sx={{ mt: 2 }}>
                    <Button onClick={onSubmit} variant="primary" size="small">
                        Submit
                    </Button>
                </Grid>
                {responseMessage && <PollMessage {...responseMessage} />}
            </>
        );
    },
);

const PollContent = ({
    pollWidget,
    isSubmitted,
    isLoggedIn,
    responseMessage,
    handleSubmit,
    handleOptionChange,
}: {
    pollWidget: PollWidget;
    isSubmitted: boolean;
    isLoggedIn: boolean;
    responseMessage: ResponseMessage | null;
    handleSubmit: (pollWidget: PollWidget) => Promise<void>;
    handleOptionChange: (option: string) => void;
}) => {
    if (pollWidget.status === PollStatus.Inactive) {
        return <PollMessage {...RESPONSE_MESSAGES.ERROR} message="Poll is inactive." />;
    }

    if (responseMessage) {
        return <PollMessage {...responseMessage} />;
    }

    return (
        <>
            <PollDisplay pollWidget={pollWidget} interactionEnabled={true} onOptionChange={handleOptionChange} />
            <SubmitSection
                isLoggedIn={isLoggedIn}
                onSubmit={() => handleSubmit(pollWidget)}
                responseMessage={null} // Ensure no duplicate error message below the poll
            />
        </>
    );
};

const fetchPollDetails = async (id: number) => {
    const pollWidgets = await fetchPollWidgets(id);
    return pollWidgets[pollWidgets.length - 1];
};

const PollWidgetView = ({ widget }: PollWidgetViewProps) => {
    const dispatch = useAppDispatch();
    const isLoggedIn = useAppSelector((state) => state.user.authentication.authenticated);
    const [selectedOption, setSelectedOption] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [responseMessage, setResponseMessage] = useState<ResponseMessage | null>(null);
    const { getSubmittedPolls, addSubmittedPoll } = useSubmittedPolls();

    useEffect(() => {
        if (getSubmittedPolls().includes(widget.id)) {
            setIsSubmitted(true);
            // Only set the response message on refresh
            if (!responseMessage) {
                setResponseMessage(RESPONSE_MESSAGES.RECORDED);
            }
        }
    }, [widget, getSubmittedPolls, responseMessage]);

    const handleSubmit = async (pollWidget: PollWidget) => {
        setResponseMessage(null);

        if (!selectedOption) {
            dispatch(
                openNotification({
                    severity: 'error',
                    text: 'You need to select an answer to the poll before submitting it.',
                }),
            );
            return;
        }

        try {
            await postPollResponse(widget.id, pollWidget.id, {
                selected_answer_id: Number.parseInt(selectedOption),
            });

            setIsSubmitted(true);
            addSubmittedPoll(widget.id);
            setResponseMessage(RESPONSE_MESSAGES.SUCCESS);
        } catch (error: unknown) {
            // Simplified error extraction
            const errorResponse = error as { status?: number; data?: unknown; message?: string };
            const rejectionReason =
                errorResponse?.message ??
                (typeof errorResponse?.data === 'string' ? errorResponse.data : null) ??
                'An unknown error occurred';
            // Check if this is a submission limit error (400)
            if (getSubmittedPolls().includes(widget.id)) {
                setResponseMessage(RESPONSE_MESSAGES.RECORDED);
            }
            if (rejectionReason.toLowerCase().includes('limit')) {
                setResponseMessage(RESPONSE_MESSAGES.LIMIT);
            } else if (rejectionReason.toLowerCase().includes('network')) {
                setResponseMessage(RESPONSE_MESSAGES.NETWORK_ERROR);
            } else {
                const error = RESPONSE_MESSAGES.ERROR;
                if (rejectionReason) {
                    error.message = rejectionReason;
                }
                setResponseMessage(error);
            }

            // Only set submission to false if it's not a 400 error
            if (errorResponse?.status !== 400) {
                setIsSubmitted(false);
            }
        }
    };

    const handleOptionChange = (option: string) => setSelectedOption(option);
    const cachedPollDetails = useMemo(() => fetchPollDetails(widget.id), [widget.id]);

    return (
        <Grid container gap="1rem" size={12}>
            <Grid size={12}>
                <Heading3 weight="thin">{widget.title}</Heading3>
            </Grid>
            <Grid
                size={12}
                component={Paper}
                sx={{
                    bgcolor: 'white',
                    padding: '2em',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'blue.90',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <section aria-label="Widget" style={{ flexGrow: 1 }}>
                    <ThemeProvider theme={BaseTheme}>
                        <Suspense fallback={<PollWidgetSkeleton />}>
                            <Await resolve={cachedPollDetails} errorElement={<PollWidgetLoadingErrorElement />}>
                                {(pollWidget: PollWidget) => {
                                    const localizedPollWidget: PollWidget = {
                                        ...pollWidget,
                                        title: widget.poll_title ?? pollWidget.title,
                                        description: widget.poll_description ?? pollWidget.description,
                                    };

                                    return (
                                        <PollContent
                                            pollWidget={localizedPollWidget}
                                            isSubmitted={isSubmitted}
                                            isLoggedIn={isLoggedIn}
                                            responseMessage={responseMessage}
                                            handleSubmit={handleSubmit}
                                            handleOptionChange={handleOptionChange}
                                        />
                                    );
                                }}
                            </Await>
                        </Suspense>
                    </ThemeProvider>
                </section>
            </Grid>
        </Grid>
    );
};

const PollWidgetSkeleton = () => (
    <Grid container spacing={2}>
        <Grid size={12}>
            <Skeleton variant="text" width="60%" height={40} />
        </Grid>
        <Grid size={12}>
            <Skeleton variant="rectangular" width="100%" height={115} />
        </Grid>
        <Grid size={12}>
            <Skeleton variant="text" width="30%" height={40} />
        </Grid>
    </Grid>
);

const PollWidgetLoadingErrorElement = () => {
    // Return an error message based on the PollMessage component
    return (
        <PollMessage
            message="Error occurred while fetching widget information"
            color={colors.notification.error.icon}
            icon={faSignalStreamSlash}
        />
    );
};

export default PollWidgetView;
