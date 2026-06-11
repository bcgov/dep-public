import { Box, Grid2 as Grid, IconContainerProps, InputAdornment, Modal, Stack, SvgIcon } from '@mui/material';
import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-regular-svg-icons/faXmark';
import { faFaceSmile } from '@fortawesome/pro-regular-svg-icons/faFaceSmile';
import { faFaceMeh } from '@fortawesome/pro-regular-svg-icons/faFaceMeh';
import { faFaceFrown } from '@fortawesome/pro-regular-svg-icons/faFaceFrown';
import { ReactComponent as CheckIcon } from 'assets/images/check.svg';
import { useState } from 'react';
import { DisclaimerBox, modalStyle } from 'components/common';
import { BodyText, Heading3 } from 'components/common/Typography';
import { CommentTypeEnum, createDefaultFeedback, setFeedbackPath, RatingTypeEnum } from 'models/feedback';
import { Else, If, Then, When } from 'react-if';
import { CommentTypeButton, StyledRating } from './styledComponents';
import { createFeedback } from 'services/feedbackService';
import { openNotification } from 'services/notificationService/notificationSlice';
import { useAppDispatch } from 'hooks';
import { customRatings, commentTypes } from './constants';
import { useAppTranslation } from 'hooks';
import { Button, IconButton, CustomTextField } from 'components/common/Input';
import { useTheme } from '@mui/material/styles';
import { ZIndex } from 'styles/Theme';

export const FeedbackModal = () => {
    const { t: translate } = useAppTranslation();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackFormData, setFeedbackFormData] = useState(setFeedbackPath(createDefaultFeedback()));
    const { comment, rating, comment_type } = feedbackFormData;
    const dispatch = useAppDispatch();

    const IconContainer = (props: IconContainerProps) => {
        const { value, ...other } = props;
        return <span {...other}>{customRatings[value].icon}</span>;
    };

    const handleRatingChanged = (value: number) => {
        setFeedbackFormData({
            ...feedbackFormData,
            rating: rating == value ? 0 : value,
        });
    };

    const handleCommentTypeChanged = (value: CommentTypeEnum) => {
        setFeedbackFormData({
            ...feedbackFormData,
            comment_type: comment_type == value ? CommentTypeEnum.None : value,
        });
    };

    const handleCommentChanged = (value: string) => {
        setFeedbackFormData({
            ...feedbackFormData,
            comment: value,
        });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const formData = { ...feedbackFormData, submission_path: globalThis.location.pathname };
            await createFeedback(formData);
            dispatch(openNotification({ severity: 'success', text: translate('feedback.notification.success') }));
            setIsSubmitted(true);
        } catch {
            dispatch(openNotification({ severity: 'error', text: translate('feedback.notification.error') }));
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setIsSubmitted(false);
        setFeedbackFormData(createDefaultFeedback());
        setIsOpen(false);
    };

    const isFeedbackTypeNotSelected = rating === RatingTypeEnum.None && comment_type === CommentTypeEnum.None;
    const isCommentNotProvided = comment_type !== CommentTypeEnum.None && !comment;

    const theme = useTheme();
    const bottomSpacing = theme.spacing(52);
    const rightSpacing = theme.spacing(0);

    return (
        <>
            <Button
                variant="primary"
                data-testid="feedback-button"
                onClick={() => setIsOpen(true)}
                sx={{
                    borderRadius: '20px 20px 0px 0px',
                    position: 'fixed',
                    bottom: bottomSpacing,
                    right: rightSpacing,
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'bottom right',
                    zIndex: ZIndex.feedback,
                }}
            >
                <FontAwesomeIcon
                    icon={faFaceFrown}
                    style={{ fontSize: '20px', marginRight: 1, padding: 5, transform: 'rotate(90deg)' }}
                />
                <FontAwesomeIcon
                    icon={faFaceMeh}
                    style={{ fontSize: '20px', marginRight: 1, padding: 5, transform: 'rotate(90deg)' }}
                />
                <FontAwesomeIcon
                    icon={faFaceSmile}
                    style={{ fontSize: '20px', marginRight: 1, padding: 5, transform: 'rotate(90deg)' }}
                />
                {translate('feedback.websiteFeedback')}
            </Button>
            <Modal aria-labelledby="modal-title" open={isOpen} onClose={() => handleClose()}>
                <Grid
                    container
                    direction="row"
                    justifyContent="space-around"
                    alignItems="flex-start"
                    sx={{ ...modalStyle, paddingX: 2, width: 370 }}
                    rowSpacing={2}
                >
                    <If condition={isSubmitted}>
                        <Then>
                            <Grid size={12} justifyContent="center" textAlign="center" alignItems="center">
                                <Stack
                                    justifyContent="center"
                                    textAlign="center"
                                    alignItems="center"
                                    sx={{ height: 200 }}
                                >
                                    <SvgIcon
                                        component={CheckIcon}
                                        fontSize="large"
                                        viewBox="0 0 64 64"
                                        sx={{ marginBottom: 2 }}
                                    />
                                    <Heading3 data-testid="success-title">
                                        {translate('feedback.submitModal.header')}
                                    </Heading3>
                                </Stack>
                            </Grid>
                            <Grid size={12} display="flex" alignItems="end" justifyContent="flex-end">
                                <Button variant="primary" onClick={handleClose}>
                                    {translate('feedback.submitModal.button')}
                                </Button>
                            </Grid>
                        </Then>
                        <Else>
                            <Grid
                                size={12}
                                display="flex"
                                alignItems={'flex-start'}
                                justifyContent={'flex-end'}
                                sx={{ marginTop: -2 }}
                            >
                                <Box sx={{ padding: 0 }}>
                                    <IconButton onClick={handleClose} icon={faXmark} />
                                </Box>
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold>{translate('feedback.feedbackModal.label.0')}</BodyText>
                            </Grid>
                            <Grid size={12} textAlign="center">
                                <StyledRating
                                    data-testid="rating-input"
                                    value={rating}
                                    size="large"
                                    IconContainerComponent={IconContainer}
                                    highlightSelectedOnly
                                    onChange={(event, newValue) => {
                                        handleRatingChanged(newValue ?? 0);
                                    }}
                                />
                            </Grid>
                            <Grid size={12} justifyContent="space-around" textAlign="center">
                                {customRatings[rating].label}
                            </Grid>
                            <Grid size={12}>
                                <BodyText bold>{translate('feedback.feedbackModal.label.1')}</BodyText>
                            </Grid>
                            <Grid container size={12} alignItems="space-between" justifyContent="space-between">
                                <CommentTypeButton
                                    data-testid="comment-type-issue-button"
                                    onClick={() => handleCommentTypeChanged(CommentTypeEnum.Issue)}
                                    sx={{ border: comment_type == CommentTypeEnum.Issue ? '2px solid black' : '' }}
                                >
                                    <Stack spacing={0} justifyContent="space-around" alignItems="center">
                                        <BodyText>{commentTypes[CommentTypeEnum.Issue].label}</BodyText>
                                        <When condition={!comment_type}>
                                            {commentTypes[CommentTypeEnum.Issue].icon}
                                        </When>
                                    </Stack>
                                </CommentTypeButton>
                                <CommentTypeButton
                                    onClick={() => handleCommentTypeChanged(CommentTypeEnum.Idea)}
                                    sx={{ border: comment_type == CommentTypeEnum.Idea ? '2px solid black' : '' }}
                                >
                                    <Stack spacing={0} justifyContent="space-around" alignItems="center">
                                        <BodyText>{commentTypes[CommentTypeEnum.Idea].label}</BodyText>
                                        <When condition={!comment_type}>{commentTypes[CommentTypeEnum.Idea].icon}</When>
                                    </Stack>
                                </CommentTypeButton>
                            </Grid>
                            <Grid size={12}>
                                <When condition={Boolean(comment_type)}>
                                    <CustomTextField
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment
                                                    position="start"
                                                    sx={{
                                                        padding: '35px 14px',
                                                        width: '100px',
                                                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                                        color: (theme) => theme.palette.text.primary,
                                                    }}
                                                >
                                                    <Stack
                                                        spacing={0}
                                                        justifyContent="space-around"
                                                        alignItems="center"
                                                    >
                                                        <BodyText>{commentTypes[comment_type].label}</BodyText>
                                                        {commentTypes[comment_type].icon}
                                                    </Stack>
                                                </InputAdornment>
                                            ),
                                        }}
                                        data-testid="comment-input"
                                        placeholder={commentTypes[comment_type].text}
                                        onChange={(event) => handleCommentChanged(event.target.value)}
                                        value={comment}
                                        multiline
                                        rows={4}
                                        sx={{
                                            width: '100%',
                                            '& .MuiOutlinedInput-root': {
                                                paddingLeft: 0,
                                            },
                                        }}
                                    />
                                </When>
                            </Grid>
                            <Grid size={12}>
                                <DisclaimerBox marginTop={0}>
                                    {translate('feedback.feedbackModal.disclaimer')}
                                </DisclaimerBox>
                            </Grid>
                            <Grid size={12} display="flex" alignItems="end" justifyContent="flex-end">
                                <Button
                                    variant="primary"
                                    size="small"
                                    data-testid="submit-button"
                                    loading={isSaving}
                                    disabled={isFeedbackTypeNotSelected || isCommentNotProvided}
                                    onClick={handleSubmit}
                                >
                                    {translate('feedback.feedbackModal.button')}
                                </Button>
                            </Grid>
                        </Else>
                    </If>
                </Grid>
            </Modal>
        </>
    );
};
