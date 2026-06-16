"""Service for submission management."""
from datetime import datetime
from http import HTTPStatus

from flask import current_app

from api.constants.comment_status import Status
from api.constants.email_verification import EmailVerificationType
from api.constants.engagement_status import Status as EngagementStatus
from api.constants.engagement_status import SubmissionStatus
from api.constants.membership_type import MembershipType
from api.constants.staff_note_type import StaffNoteType
from api.exceptions.business_exception import BusinessException
from api.models import Engagement as EngagementModel
from api.models import EngagementSettingsModel
from api.models import Survey as SurveyModel
from api.models import Tenant as TenantModel
from api.models.comment import Comment
from api.models.comment_status import CommentStatus
from api.models.db import db, transactional
from api.models.pagination_options import PaginationOptions
from api.models.participant import Participant as ParticipantModel
from api.models.staff_note import StaffNote
from api.models.submission import Submission as SubmissionModel
from api.schemas.submission import PublicSubmissionSchema, SubmissionSchema
from api.services import authorization
from api.services.comment_service import CommentService
from api.services.email_verification_service import EmailVerificationService
from api.services.staff_user_service import StaffUserService
from api.services.survey_service import SurveyService
from api.utils import notification
from api.utils.roles import Role
from api.utils.template import Template


class SubmissionService:
    """Submission management service."""

    otherdateformat = '%Y-%m-%d'

    @classmethod
    def get(cls, submission_id):
        """Get submission by the id."""
        submission: SubmissionModel = SubmissionModel.find_by_id(submission_id)

        # if submission is approved , anyone can see .No need to do auth
        if submission.comment_status_id != Status.Approved.value:
            cls._check_comment_auth(submission)

        return SubmissionSchema(exclude=['submission_json']).dump(submission)

    @classmethod
    def _check_comment_auth(cls, submission):
        """Verify comment auth."""
        survey: SurveyModel = SurveyModel.find_by_id(submission.survey_id)
        engagement: EngagementModel = EngagementModel.find_by_id(
            survey.engagement_id)
        # TM can see all comments if assigned
        # who ever has REVIEW_COMMENTS
        one_of_roles = (
            MembershipType.TEAM_MEMBER.name,
            Role.REVIEW_COMMENTS.value
        )
        authorization.check_auth(
            one_of_roles=one_of_roles, engagement_id=engagement.id)

    @classmethod
    def get_by_token(cls, token):
        """Get submission by the verification token."""
        email_verification = EmailVerificationService().get_active(token)
        submission_id = email_verification.get('submission_id')
        submission = SubmissionModel.find_by_id(submission_id)
        return PublicSubmissionSchema().dump(submission)

    @classmethod
    @transactional()
    def create(cls, token, submission: SubmissionSchema):
        """Create submission."""
        cls._validate_fields(submission)
        lang_code = submission.get(
            'language_code', current_app.config['DEFAULT_LANGUAGE'])
        survey_id = submission.get('survey_id')
        survey = SurveyService.get(survey_id)
        engagement_id = survey.get('engagement_id')
        # Restrict submission on unpublished engagement
        if SubmissionService.is_unpublished(engagement_id):
            return {}

        email_verification = EmailVerificationService().verify(
            token, survey_id, None, db.session)
        participant_id = email_verification.get('participant_id')
        submission['participant_id'] = participant_id
        submission['created_by'] = participant_id
        submission['engagement_id'] = engagement_id

        submission_result = SubmissionModel.create(submission, db.session)
        submission['id'] = submission_result.id
        comments = CommentService.extract_comments_from_survey(
            submission, survey)
        CommentService().create_comments(comments, db.session)

        engagement_settings: EngagementSettingsModel =\
            EngagementSettingsModel.find_by_id(engagement_id)
        if engagement_settings:
            if engagement_settings.send_report:
                SubmissionService._send_submission_response_email(
                    participant_id, engagement_id, lang_code)
        return submission_result

    @classmethod
    def update(cls, data: SubmissionSchema):
        """Update submission."""
        cls._validate_fields(data)
        return SubmissionModel.update(data)

    @classmethod
    def update_comments(cls, token, data: PublicSubmissionSchema):
        """Update submission comments."""
        email_verification = EmailVerificationService().get_active(token)
        submission_id = email_verification.get('submission_id')
        submission = SubmissionModel.find_by_id(submission_id)

        # Restrict submission on unpublished engagement
        if SubmissionService.is_unpublished(submission.engagement_id):
            return {}

        submission.comment_status_id = Status.Pending
        EmailVerificationService().verify(
            token, submission.survey_id, submission.id, db.session)
        comments_result = [Comment.update(submission.id, comment, db.session)
                           for comment in data.get('comments', [])]
        SubmissionModel.update(SubmissionSchema().dump(submission), db.session)
        db.session.commit()
        return comments_result

    @staticmethod
    def _validate_fields(submission):
        # TODO: Validate against survey form_json
        """Validate all fields."""
        survey_id = submission.get('survey_id', None)
        survey: SurveyModel = SurveyModel.find_by_id(survey_id)
        engagement: EngagementModel = EngagementModel.find_by_id(
            survey.engagement_id)
        if not engagement:
            raise ValueError('Survey not linked to an Engagement')

        if engagement.status_id != SubmissionStatus.Open.value:
            raise ValueError('Engagement not open to submissions')

    @classmethod
    @transactional()
    def review_comment(cls, submission_id, staff_review_details: dict, external_user_id) -> SubmissionSchema:
        """Review comment."""
        user = StaffUserService.get_user_by_external_id(external_user_id)
        submission = SubmissionModel.find_by_id(submission_id)
        cls._check_comment_auth(submission)
        cls.validate_review(staff_review_details, user, submission)
        reviewed_by = ' '.join(
            [user.get('first_name', ''), user.get('last_name', '')])
        default_lang = current_app.config['DEFAULT_LANGUAGE']
        lang_code = staff_review_details.get('language_code', default_lang)
        staff_review_details['reviewed_by'] = reviewed_by
        staff_review_details['user_id'] = user.get('id')
        should_send_email = SubmissionService._should_send_email(
            submission_id, staff_review_details, submission.engagement_id)
        submission = SubmissionModel.update_comment_status(
            submission_id, staff_review_details, db.session)
        if staff_notes := staff_review_details.get('staff_note', []):
            cls.add_or_update_staff_note(
                submission.survey_id, submission_id, staff_notes)

        if should_send_email:
            rejection_review_note = StaffNote.get_staff_note_by_type(
                submission_id, StaffNoteType.Review.name)
            SubmissionService._trigger_email(
                rejection_review_note[0].note, db.session, staff_review_details, submission, lang_code)
        return SubmissionSchema().dump(submission)

    @staticmethod
    def _trigger_email(review_note, session, staff_review_details: dict, submission, lang_code):
        email_verification = EmailVerificationService().create({
            'participant_id': submission.participant_id,
            'survey_id': submission.survey_id,
            'submission_id': submission.id,
            'type': EmailVerificationType.RejectedComment,
        }, session)
        SubmissionService._send_rejected_email(
            staff_review_details, submission, review_note,
            email_verification.get('verification_token'), lang_code)

    @classmethod
    def validate_review(cls, values: dict, user, submission):
        """Validate a review comment request."""
        status_id = values.get('status_id', None)
        has_personal_info = values.get('has_personal_info', None)
        has_profanity = values.get('has_profanity', None)
        has_threat = values.get('has_threat', None)
        rejected_reason_other = values.get('rejected_reason_other', None)

        valid_statuses = [
            status.id for status in CommentStatus.get_comment_statuses()]

        if not user:
            raise ValueError('Invalid user.')

        if not status_id or status_id == Status.Pending.value or status_id not in valid_statuses:
            raise ValueError('Invalid review status.')

        if status_id == Status.Rejected.value and \
                not any(set((has_personal_info, has_profanity, has_threat))) and \
                not rejected_reason_other:
            raise ValueError('A rejection reason is required.')

        if not submission:
            raise ValueError('Invalid submission.')

    @classmethod
    def add_or_update_staff_note(cls, survey_id, submission_id, staff_notes):
        """Process staff note for a comment."""
        for staff_note in staff_notes:
            note = StaffNote.get_staff_note_by_type(
                submission_id, staff_note.get('note_type'))
            if note:
                note[0].note = staff_note['note']
                note[0].flush()
            else:
                doc = SubmissionService._create_staff_notes(
                    survey_id, submission_id, staff_note)
                doc.flush()

    @staticmethod
    def _get_tenant_name(tenant_id):
        tenant = TenantModel.find_by_id(tenant_id)
        return tenant.name

    @staticmethod
    def _create_staff_notes(survey_id, submission_id, staff_note):
        doc: StaffNote = StaffNote()
        doc.note = staff_note['note']
        doc.note_type = staff_note['note_type']
        doc.survey_id = survey_id
        doc.submission_id = submission_id
        return doc

    @staticmethod
    def _should_send_email(submission_id: int, staff_comment_details: dict, engagement_id: int) -> bool:
        """Check if an email should be sent for a rejected submission."""
        # Dont send the mail
        #   if the comment has threat
        #   if notify_email is false
        #   if engagement is unpublished
        # Send the mail
        #   if the status of the comment is rejected
        #      if review note has changed
        #      if review reason has changed
        if SubmissionService.is_unpublished(engagement_id):
            return False
        if staff_comment_details.get('has_threat') is True:
            return False
        if staff_comment_details.get('notify_email') is False:
            return False
        if staff_comment_details.get('status_id') == Status.Rejected.value:
            has_review_note_changed = SubmissionService.is_review_note_changed(
                submission_id, staff_comment_details)
            if has_review_note_changed:
                return True
            has_reason_changed = SubmissionService.is_rejection_reason_changed(
                submission_id, staff_comment_details)
            if has_reason_changed:
                return True
        return False

    @staticmethod
    def is_rejection_reason_changed(submission_id, values: dict):
        """Check if rejection reason has changed."""
        submission = SubmissionModel.find_by_id(submission_id)
        if submission.has_personal_info == values.get('has_personal_info') and \
                submission.has_profanity == values.get('has_profanity') and \
                submission.has_threat == values.get('has_threat') and \
                submission.rejected_reason_other == values.get('rejected_reason_other'):
            return False

        return True

    @staticmethod
    def is_review_note_changed(submission_id: int, values: dict) -> bool:
        """Check if review note has changed for a submission."""
        staff_notes = values.get('staff_note', [])
        for staff_note in staff_notes:
            if staff_note['note_type'] == StaffNoteType.Review.name:
                note = StaffNote.get_staff_note_by_type(
                    submission_id, StaffNoteType.Review.name)
                if not note or note[0].note != staff_note.get('note'):
                    return True
        return False

    @classmethod
    def get_paginated(
            cls,
            survey_id,
            pagination_options: PaginationOptions,
            search_text: str,
            advanced_search_filters: dict
    ):
        """Get submissions by survey id paginated."""
        if not CommentService.can_view_unapproved_comments(survey_id):
            if 'status' in advanced_search_filters:
                if advanced_search_filters['status'] in (Status.Rejected.value, Status.Pending.value):
                    # Cant view any Rejected/Pending
                    return {'items': [], 'total': 0}
                if not advanced_search_filters['status']:
                    # No blanket search.Return only approved if filter doesnt have any status
                    advanced_search_filters['status'] = Status.Approved.value

        items, total = Comment.get_by_survey_id_paginated(
            survey_id,
            pagination_options,
            search_text,
            advanced_search_filters if any(
                advanced_search_filters.values()) else None
        )
        return {
            'items': SubmissionSchema(many=True, exclude=['submission_json']).dump(items),
            'total': total
        }

    @staticmethod
    def _send_rejected_email(staff_review_details: dict, submission: SubmissionModel,
                             review_note, token, lang_code) -> None:
        """Send an verification email.Throws error if fails."""
        participant_id = submission.participant_id
        participant = ParticipantModel.find_by_id(participant_id)
        template_id, subject, body, args = SubmissionService._render_email_template(
            staff_review_details, submission, review_note, token, lang_code)
        try:
            notification.send_email(subject=subject,
                                    email=ParticipantModel.decode_email(
                                        participant.email_address),
                                    html_body=body,
                                    args=args,
                                    template_id=template_id)
        except Exception as exc:  # noqa: B902
            current_app.logger.error(
                '<Notification for rejected comment failed', exc)
            raise BusinessException(
                error='Error sending rejected comment notification email.',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR) from exc

    @staticmethod
    # pylint: disable-msg=too-many-locals
    def _render_email_template(staff_review_details: dict, submission: SubmissionModel, review_note, token, lang_code):
        engagement: EngagementModel = EngagementModel.find_by_id(
            submission.engagement_id)
        templates = current_app.config['EMAIL_TEMPLATES']
        paths = current_app.config['PATH_CONFIG']
        engagement_name = engagement.name
        templates = current_app.config.get('EMAIL_TEMPLATES')
        if engagement.status_id == EngagementStatus.Closed.value:
            template_id = templates['CLOSED_ENGAGEMENT_REJECTED']['ID']
            template = Template.get_template(
                'email_rejected_comment_closed.html')
            subject = templates['CLOSED_ENGAGEMENT_REJECTED']['SUBJECT']. \
                format(engagement_name=engagement_name)
        else:
            template_id = templates['REJECTED']['ID']
            template = Template.get_template('email_rejected_comment.html')
            subject = templates['REJECTED']['SUBJECT']. \
                format(engagement_name=engagement_name)
        survey: SurveyModel = SurveyModel.find_by_id(submission.survey_id)
        survey_name = survey.name
        tenant_name = SubmissionService._get_tenant_name(
            engagement.tenant_id)
        submission_path = paths['SUBMISSION'].format(
            engagement_id=submission.engagement_id,
            submission_id=submission.id, token=token,
            lang=lang_code
        )
        submission_url = notification.get_tenant_site_url(
            engagement.tenant_id, submission_path)
        email_environment = templates['ENVIRONMENT']
        args = {
            'engagement_name': engagement_name,
            'survey_name': survey_name,
            'has_personal_info': 'yes' if staff_review_details.get('has_personal_info', None) else '',
            'has_profanity': 'yes' if staff_review_details.get('has_profanity', None) else '',
            'has_other_reason': 'yes' if staff_review_details.get('rejected_reason_other', None) else '',
            'other_reason': staff_review_details.get('rejected_reason_other', None),
            'submission_url': submission_url,
            'review_note': review_note,
            'end_date': datetime.strftime(engagement.end_date, EmailVerificationService.full_date_format),
            'tenant_name': tenant_name,
            'email_environment': email_environment,
        }
        body = template.render(
            engagement_name=args.get('engagement_name'),
            survey_name=args.get('survey_name'),
            has_personal_info=args.get('has_personal_info'),
            has_profanity=args.get('has_profanity'),
            has_other_reason=args.get('has_other_reason'),
            other_reason=args.get('other_reason'),
            review_note=args.get('review_note'),
            end_date=args.get('end_date'),
            email_environment=args.get('email_environment'),
        )
        return template_id, subject, body, args

    @staticmethod
    def _send_submission_response_email(participant_id, engagement_id, lang_code) -> None:
        """Send response to survey submission."""
        participant = ParticipantModel.find_by_id(participant_id)
        templates = current_app.config['EMAIL_TEMPLATES']
        template_id = templates['SUBMISSION_RESPONSE']['ID']
        subject, body, args = SubmissionService._render_submission_response_email_template(
            engagement_id, lang_code)
        try:
            notification.send_email(subject=subject,
                                    email=ParticipantModel.decode_email(
                                        participant.email_address),
                                    html_body=body,
                                    args=args,
                                    template_id=template_id)
        except Exception as exc:  # noqa: B902
            current_app.logger.error(
                '<Notification for submission response failed', exc)
            raise BusinessException(
                error='Error sending submission response notification email.',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR) from exc

    @staticmethod
    def _render_submission_response_email_template(engagement_id, lang_code):
        engagement: EngagementModel = EngagementModel.find_by_id(engagement_id)
        templates = current_app.config['EMAIL_TEMPLATES']
        template = Template.get_template('submission_response.html')
        subject = templates['SUBMISSION_RESPONSE']['SUBJECT']
        dashboard_path = SubmissionService._get_dashboard_path(
            engagement, lang_code)
        engagement_url = notification.get_tenant_site_url(
            engagement.tenant_id, dashboard_path)
        email_environment = templates['ENVIRONMENT']
        tenant_name = SubmissionService._get_tenant_name(
            engagement.tenant_id)
        args = {
            'engagement_url': engagement_url,
            'engagement_time': templates['CLOSING_TIME'],
            'engagement_end_date': datetime.strftime(engagement.end_date, EmailVerificationService.full_date_format),
            'tenant_name': tenant_name,
            'email_environment': email_environment,
        }
        body = template.render(
            engagement_url=args.get('engagement_url'),
            engagement_time=args.get('engagement_time'),
            engagement_end_date=args.get('engagement_end_date'),
            tenant_name=args.get('tenant_name'),
            email_environment=args.get('email_environment'),
        )
        return subject, body, args

    @staticmethod
    def _get_dashboard_path(engagement: EngagementModel, lang_code):
        paths = current_app.config['PATH_CONFIG']
        if engagement.slug:
            return paths['ENGAGEMENT']['DASHBOARD_SLUG'].format(
                slug=engagement.slug,
                lang=lang_code
            )
        return paths['ENGAGEMENT']['DASHBOARD'].format(
            engagement_id=engagement.id,
            lang=lang_code
        )

    @staticmethod
    def is_unpublished(engagement_id):
        """Check if the engagement is unpublished."""
        engagement: EngagementModel = EngagementModel.find_by_id(engagement_id)
        return engagement.status_id == EngagementStatus.Unpublished.value
