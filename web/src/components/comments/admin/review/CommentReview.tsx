import React, { useState, useEffect } from 'react';
import {
    Grid2 as Grid,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Stack,
    FormLabel,
    Divider,
    Checkbox,
    TextField,
    FormHelperText,
    Link,
    Tooltip,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import { getSubmission, reviewComments } from 'services/submissionService';
import { useAppDispatch, useAppTranslation, useAppSelector } from 'hooks';
import { useParams, useNavigate } from 'react-router';
import { openNotification } from 'services/notificationService/notificationSlice';
import { BodyText, Heading2, Heading3, Heading4 } from 'components/common/Typography';
import { Button } from 'components/common/Input/Button';
import { CommentStatus } from 'constants/commentStatus';
import { StaffNoteType } from 'constants/staffNoteType';
import { formatToPacific } from 'components/common/dateHelper';
import { CommentReviewSkeleton } from './CommentReviewSkeleton';
import { createDefaultSubmission, SurveySubmission } from 'models/surveySubmission';
import { createDefaultReviewNote, createDefaultInternalNote, StaffNote } from 'models/staffNote';
import { If, Then, Else, When } from 'react-if';
import EmailPreviewModal from './emailPreview/EmailPreviewModal';
import { RejectEmailTemplate } from './emailPreview/EmailTemplates';
import EmailPreview from './emailPreview/EmailPreview';
import { Survey, createDefaultSurvey } from 'models/survey';
import { getSurvey } from 'services/surveyService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessageCheck } from '@fortawesome/pro-solid-svg-icons/faMessageCheck';
import { faMessageSlash } from '@fortawesome/pro-solid-svg-icons/faMessageSlash';
import { LanguageState } from 'reduxSlices/languageSlice';
import { TenantState } from 'reduxSlices/tenantSlice';
import { ROUTES, getPath } from 'routes/routes';
import { Form } from 'components/Form/formio/setup';
import { faChevronDown, faBoxBallot } from '@fortawesome/pro-regular-svg-icons';
import { EngagementAccordion } from 'components/common/Layout';
import { createSimpleFileOptions } from 'components/Form/formio/simpleFileOptions';
import { AuthorChip, CommentStatusChip } from 'components/comments/status';

const CommentReview = () => {
    const [submission, setSubmission] = useState<SurveySubmission>(createDefaultSubmission());
    const [review, setReview] = useState(CommentStatus.Approved);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasOtherReason, setHasOtherReason] = useState(false);
    const [hasPersonalInfo, setHasPersonalInfo] = useState(false);
    const [hasProfanity, setHasProfanity] = useState(false);
    const [hasThreat, setHasThreat] = useState(false);
    const [otherReason, setOtherReason] = useState('');
    const [hasError, setHasError] = useState(false);
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [staffNote, setStaffNote] = useState<StaffNote[]>([]);
    const [updatedStaffNote, setUpdatedStaffNote] = useState<StaffNote[]>([]);
    const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
    const [survey, setSurvey] = useState<Survey>(createDefaultSurvey());
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { t: translate } = useAppTranslation();
    const { submissionId, surveyId } = useParams();
    const reviewNotes = updatedStaffNote.filter((staffNote) => staffNote.note_type == StaffNoteType.Review);
    const internalNotes = updatedStaffNote.filter((staffNote) => staffNote.note_type == StaffNoteType.Internal);
    const tenant: TenantState = useAppSelector((state) => state.tenant);

    const MAX_OTHER_REASON_CHAR = 500;

    const language: LanguageState = useAppSelector((state) => state.language);

    const getEmailPreview = () => {
        return (
            <EmailPreview survey={survey}>
                <When condition={review == CommentStatus.Rejected}>
                    <RejectEmailTemplate
                        hasPersonalInfo={hasPersonalInfo}
                        hasProfanity={hasProfanity}
                        hasThreat={hasThreat}
                        otherReason={otherReason}
                        reviewNotes={reviewNotes}
                    />
                </When>
            </EmailPreview>
        );
    };

    const fetchSubmission = async () => {
        try {
            if (Number.isNaN(Number(submissionId))) {
                throw new Error('Invalid submission ID');
            }
            const fetchedSubmission = await getSubmission(Number(submissionId));
            const fetchedSurvey = await getSurvey(Number(surveyId));
            setSubmission(fetchedSubmission);
            setSurvey(fetchedSurvey);
            setHasOtherReason(!!fetchedSubmission.rejected_reason_other);
            setOtherReason(fetchedSubmission.rejected_reason_other ?? '');
            setHasPersonalInfo(fetchedSubmission.has_personal_info ?? false);
            setHasProfanity(fetchedSubmission.has_profanity ?? false);
            setHasThreat(fetchedSubmission.has_threat ?? false);
            setNotifyEmail(fetchedSubmission.notify_email ?? true);
            setStaffNote(fetchedSubmission.staff_note);
            setReview(
                fetchedSubmission.comment_status_id == CommentStatus.Pending
                    ? CommentStatus.Approved
                    : fetchedSubmission.comment_status_id,
            );
            setIsLoading(false);
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'Error occurred while fetching comments' }));
            navigate(getPath(ROUTES.PUBLIC_LANDING));
        }
    };

    const extract_staff_note = async () => {
        setUpdatedStaffNote(
            staffNote.length !== 0 ? staffNote : [createDefaultReviewNote(), createDefaultInternalNote()],
        );
    };

    useEffect(() => {
        fetchSubmission();
    }, [submissionId]);

    useEffect(() => {
        extract_staff_note();
    }, [staffNote]);

    const handleReviewChange = (verdict: number) => {
        setReview(verdict);
        if (review === CommentStatus.Approved) {
            setHasOtherReason(false);
            setOtherReason('');
            setHasPersonalInfo(false);
            setHasProfanity(false);
            setHasThreat(false);
            setNotifyEmail(true);
        }
    };

    const validate = (): boolean => {
        if (review == CommentStatus.Rejected) {
            if (hasOtherReason && !otherReason) {
                // Other reason is mandatory if selected
                return false;
            }
            // At least one reason is selected
            return hasOtherReason || hasPersonalInfo || hasProfanity || hasThreat;
        }
        return true;
    };
    const handleSave = async () => {
        const isValid = validate();
        setHasError(!isValid);
        if (!isValid) {
            return;
        }
        setIsSaving(true);
        try {
            await reviewComments({
                submission_id: Number(submissionId),
                status_id: review,
                has_personal_info: hasPersonalInfo,
                has_profanity: hasProfanity,
                has_threat: hasThreat,
                rejected_reason_other: otherReason,
                notify_email: notifyEmail,
                staff_note: updatedStaffNote,
                language: language.id,
            });
            setIsSaving(false);
            dispatch(openNotification({ severity: 'success', text: 'Comments successfully reviewed.' }));
            navigate(getPath(ROUTES.SURVEY_COMMENTS, { surveyId: submission.survey_id }));
        } catch {
            dispatch(openNotification({ severity: 'error', text: 'Error occurred while sending comments review.' }));
            setIsSaving(false);
        }
    };

    const previewEmail = () => {
        setEmailPreviewOpen(true);
    };

    // The comment display information below is fetched from the first comment from the list
    // since comment status/review are being stored individually
    // These values should be exacly the same throughout the array.
    const { id, comment_status_id, reviewed_by, created_date, review_date } = submission;

    if (isLoading) {
        return <CommentReviewSkeleton />;
    }

    const handleNoteChange = (note: string, note_type: string, note_id: number) => {
        const newStaffNoteArray = [...updatedStaffNote];
        newStaffNoteArray.forEach((staffNote) => {
            if (staffNote.id === note_id && staffNote.note_type === note_type) {
                staffNote.note = note;
            }
        });
        setUpdatedStaffNote(newStaffNoteArray);
    };

    const defaultVerdict = comment_status_id !== CommentStatus.Pending ? comment_status_id : CommentStatus.Approved;
    const threatEmailContact = tenant.contact_email;
    const threatConactName = tenant.contact_name;
    return (
        <Grid
            container
            size={12}
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            rowSpacing={4}
            maxWidth="1120px"
        >
            <EmailPreviewModal
                open={emailPreviewOpen}
                handleClose={() => setEmailPreviewOpen(false)}
                header={'Your comment on (Engagement name) needs to be edited'}
                renderEmail={getEmailPreview()}
            />
            <Grid container direction="row" spacing={2}>
                <Grid container alignItems="center" direction="row" size={'auto'} spacing={1}>
                    <Heading2 my={0} bold>
                        Submission #{id}
                    </Heading2>
                </Grid>

                <Grid container alignItems="center" direction="row" size={'grow'} spacing={1}>
                    <CommentStatusChip commentStatus={comment_status_id} />
                </Grid>
                <Grid container direction="row" size={12}>
                    <Grid container direction="row" size={6} spacing={1}>
                        <Grid alignItems="center" justifyContent="center">
                            <BodyText bold>Comment Date:</BodyText>
                        </Grid>
                        <Grid alignItems="center" justifyContent="center">
                            <BodyText>{formatToPacific(created_date, 'YYYY-MM-DD')}</BodyText>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid
                    container
                    display={!reviewed_by && !review_date ? 'none' : 'flex'}
                    spacing={1}
                    alignItems="center"
                >
                    <Grid>
                        <BodyText bold>Reviewed by:</BodyText>
                    </Grid>
                    <Grid>
                        <AuthorChip author={reviewed_by || ''} />
                    </Grid>
                </Grid>
                <Grid
                    container
                    display={!reviewed_by && !review_date ? 'none' : 'flex'}
                    spacing={1}
                    alignItems="center"
                >
                    <Grid>
                        <BodyText bold>Date Reviewed:</BodyText>
                    </Grid>
                    <Grid>
                        <BodyText>{formatToPacific(review_date, 'YYYY-MM-DD') || <i>N/A</i>}</BodyText>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container size={12} direction="row" rowSpacing={2} className="formio multipageform form-wrapper">
                <EngagementAccordion sx={{ width: '100%' }}>
                    <AccordionSummary
                        sx={{ flexDirection: 'row-reverse' }}
                        expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
                        aria-controls="form-submission-content"
                    >
                        <FontAwesomeIcon
                            icon={faBoxBallot}
                            style={{ marginRight: '0.5rem', fontSize: '1.25rem', padding: '5px' }}
                        />
                        <Heading3 bold>Form Submission Data</Heading3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Form
                            options={{
                                readOnly: true,
                                noAlerts: true,
                                ...createSimpleFileOptions({ allowDownloadWithoutToken: true }),
                            }}
                            form={survey.form_json}
                            submission={{ data: submission.submission_json }}
                        />
                    </AccordionDetails>
                </EngagementAccordion>
            </Grid>
            <Grid container rowSpacing={2}>
                <Grid size={12}>
                    <Heading3 bold>Comments</Heading3>
                </Grid>
                {submission.comments?.map((comment) => {
                    return (
                        <Grid key={comment.id} size={12}>
                            <Divider />
                            <Grid container direction="row" alignItems={'flex-start'} justifyContent="flex-start">
                                <Grid size={1} paddingTop={3}>
                                    <If condition={comment.is_displayed}>
                                        <Then>
                                            <Grid size={12}>
                                                <Tooltip
                                                    disableInteractive
                                                    title={'Displayed to the public'}
                                                    placement="top"
                                                    arrow
                                                >
                                                    <span>
                                                        <FontAwesomeIcon
                                                            icon={faMessageCheck}
                                                            style={{ fontSize: '24px', color: '#757575' }}
                                                        />
                                                    </span>
                                                </Tooltip>
                                            </Grid>
                                        </Then>
                                        <Else>
                                            <Grid size={12}>
                                                <Tooltip
                                                    disableInteractive
                                                    title={'Not displayed to the public'}
                                                    placement="top"
                                                    arrow
                                                >
                                                    <span>
                                                        <FontAwesomeIcon
                                                            icon={faMessageSlash}
                                                            style={{ fontSize: '24px', color: '#757575' }}
                                                        />
                                                    </span>
                                                </Tooltip>
                                            </Grid>
                                        </Else>
                                    </If>
                                </Grid>
                                <Grid size={11}>
                                    <Grid size={12} paddingTop={2}>
                                        <BodyText bold>{comment.label ?? <i>Label not available</i>}:</BodyText>
                                    </Grid>
                                    <Grid size={12}>
                                        <BodyText>{comment.text}</BodyText>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    );
                })}
                <Grid size={12}>
                    <Divider />
                </Grid>
            </Grid>
            <If condition={!submission.comments || submission.comments.length == 0}>
                <Then>
                    <Grid container direction="row" size={12} spacing={2}>
                        <Grid size={12}>
                            <BodyText bold>This submission has no comments.</BodyText>
                        </Grid>
                    </Grid>
                </Then>
                <Else>
                    <Grid size={12}>
                        <FormControl>
                            <FormLabel id="controlled-radio-buttons-group">
                                <Heading3 sx={{ color: '#494949' }}>Comments Approval</Heading3>
                            </FormLabel>
                            <RadioGroup
                                defaultValue={defaultVerdict}
                                onChange={(e) => handleReviewChange(Number(e.target.value))}
                            >
                                <FormControlLabel
                                    value={CommentStatus.Approved}
                                    control={<Radio />}
                                    label={<BodyText>Approve</BodyText>}
                                />
                                <FormControlLabel
                                    value={CommentStatus.Rejected}
                                    control={<Radio />}
                                    label={<BodyText>Reject</BodyText>}
                                />
                                <FormControlLabel
                                    value={CommentStatus.NeedsFurtherReview}
                                    control={<Radio />}
                                    label={<BodyText>Needs further review</BodyText>}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <When condition={review == CommentStatus.Rejected}>
                        <Grid size={12} maxWidth="800px">
                            <FormControl>
                                <FormLabel id="controlled-checkbox-group">
                                    <Heading4 sx={{ color: '#494949' }}>Reason for Rejection</Heading4>
                                </FormLabel>
                                <FormControlLabel
                                    label={<BodyText>Contains personal information</BodyText>}
                                    control={
                                        <Checkbox
                                            checked={hasPersonalInfo}
                                            onChange={(event, checked) => setHasPersonalInfo(checked)}
                                        />
                                    }
                                />
                                <FormControlLabel
                                    label={<BodyText>Contains profanity or inappropriate language</BodyText>}
                                    control={
                                        <Checkbox
                                            checked={hasProfanity}
                                            onChange={(event, checked) => setHasProfanity(checked)}
                                        />
                                    }
                                />
                                <FormControlLabel
                                    label={<BodyText>Contains threat/menace</BodyText>}
                                    control={
                                        <Checkbox
                                            checked={hasThreat}
                                            onChange={(event, checked) => setHasThreat(checked)}
                                        />
                                    }
                                />
                                <BodyText size="small" bold color="#d32f2f" marginLeft={'3em'} mt={'-1em'}>
                                    {translate('comment.admin.review.threatTextOne')}&nbsp;
                                    {threatConactName}&nbsp;
                                    {translate('comment.admin.review.threatTextTwo')} &nbsp;
                                    <Link href={`mailto:${threatEmailContact}`}>{threatEmailContact}</Link>
                                </BodyText>
                                <FormControlLabel
                                    label={<BodyText sx={{ color: '#494949' }}>Other</BodyText>}
                                    control={
                                        <Checkbox
                                            checked={hasOtherReason}
                                            onChange={(event, checked) => {
                                                setHasOtherReason(checked);
                                                if (!checked) {
                                                    setOtherReason('');
                                                }
                                            }}
                                        />
                                    }
                                />
                                <BodyText sx={{ marginLeft: '3em', color: '#707070', fontSize: '13px' }}>
                                    This will be inserted in the email sent to the respondent:
                                </BodyText>
                                <BodyText
                                    sx={{
                                        marginLeft: '3em',
                                        fontStyle: 'italic',
                                        color: '#707070',
                                        fontSize: '13px',
                                    }}
                                >
                                    We have reviewed your feedback and can't accept it for the following reason(s): -
                                    Your feedback contains "other"
                                </BodyText>
                                <TextField
                                    disabled={!hasOtherReason}
                                    value={otherReason}
                                    sx={{ marginLeft: '2em' }}
                                    FormHelperTextProps={{ error: true }}
                                    onChange={(event) => setOtherReason(event.target.value)}
                                    inputProps={{ maxLength: MAX_OTHER_REASON_CHAR }}
                                    multiline
                                />
                                <br />
                                <BodyText sx={{ fontWeight: 'bold', color: '#494949' }}>Review Notes</BodyText>
                                <BodyText sx={{ color: '#707070', fontSize: '13px' }}>
                                    This note will be inserted in the email sent to the respondent to help them
                                    understand what needs to be edited for their comment(s) to be approved.
                                </BodyText>
                                {reviewNotes.map((staffNote) => {
                                    return (
                                        <TextField
                                            value={staffNote.note}
                                            key={staffNote.note_type}
                                            fullWidth
                                            multiline={true}
                                            rows={4}
                                            FormHelperTextProps={{ error: true }}
                                            onChange={(event) => {
                                                handleNoteChange(event.target.value, staffNote.note_type, staffNote.id);
                                            }}
                                        />
                                    );
                                })}

                                <When condition={review == CommentStatus.Rejected && notifyEmail && !hasThreat}>
                                    <Grid
                                        size={12}
                                        sx={{ m: 1 }}
                                        container
                                        alignItems="flex-end"
                                        justifyContent="flex-end"
                                    >
                                        <Button onClick={previewEmail}>{'Preview Email'}</Button>
                                    </Grid>
                                </When>
                                <br />
                                <BodyText bold>Internal Note</BodyText>
                                {internalNotes.map((staffNote) => {
                                    return (
                                        <TextField
                                            value={staffNote.note}
                                            key={staffNote.note_type}
                                            fullWidth
                                            multiline={true}
                                            rows={4}
                                            slotProps={{ formHelperText: { error: true } }}
                                            onChange={(event) => {
                                                handleNoteChange(event.target.value, staffNote.note_type, staffNote.id);
                                            }}
                                        />
                                    );
                                })}
                                <br />
                                <BodyText>
                                    Clicking the "Save" button will trigger an automatic email to be sent to the person
                                    who made this comment. They will have the option to edit and re-submit their
                                    comment. The edited comment will have to be approved before it is published.
                                </BodyText>
                                <br />
                                <FormControlLabel
                                    label={<BodyText>Don't send this email to the person who commented.</BodyText>}
                                    control={
                                        <Checkbox
                                            checked={notifyEmail === true ? false : true}
                                            onChange={(event, checked) =>
                                                setNotifyEmail(checked === true ? false : true)
                                            }
                                        />
                                    }
                                />
                                <br />
                                <FormHelperText error={true}>
                                    {hasError ? 'Please enter at least one reason for rejecting the comment(s).' : ''}
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                    </When>
                    <When condition={review !== CommentStatus.Rejected}>
                        <Grid size={12} maxWidth="800px">
                            <BodyText bold>Internal Note</BodyText>
                            {internalNotes.map((staffNote) => {
                                return (
                                    <TextField
                                        value={staffNote.note}
                                        key={staffNote.note_type}
                                        fullWidth
                                        multiline={true}
                                        rows={4}
                                        slotProps={{ formHelperText: { error: true } }}
                                        onChange={(event) => {
                                            handleNoteChange(event.target.value, staffNote.note_type, staffNote.id);
                                        }}
                                    />
                                );
                            })}
                        </Grid>
                    </When>
                    <Grid size={12}>
                        <Stack direction="row" spacing={2}>
                            <Button variant="primary" loading={isSaving} onClick={handleSave}>
                                Save &amp; Continue
                            </Button>
                            <Button onClick={() => navigate(-1)}>Cancel</Button>
                        </Stack>
                    </Grid>
                </Else>
            </If>
        </Grid>
    );
};

export default CommentReview;
