"""Service for Email Verification management."""
import uuid
from datetime import datetime, timedelta
from http import HTTPStatus

from flask import current_app
from api.constants.email_verification import INTERNAL_EMAIL_DOMAIN, EmailVerificationType

from api.constants.subscription_type import SubscriptionTypes
from api.exceptions.business_exception import BusinessException
from api.models import Engagement as EngagementModel
from api.models import EngagementSlug as EngagementSlugModel
from api.models import Survey as SurveyModel
from api.models import Tenant as TenantModel
from api.models.email_verification import EmailVerification
from api.schemas.email_verification import EmailVerificationSchema
from api.services.participant_service import ParticipantService
from api.utils import notification
from api.utils.template import Template


class EmailVerificationService:
    """Email Verification management service."""

    verification_expiry_hours = 24
    datetime_format = '%Y-%m-%d %H:%M:%S.%f'
    full_date_format = ' %B %d, %Y'
    date_format = '%Y-%m-%d'

    @classmethod
    def get(cls, verification_token):
        """Get an active email verification matching the provided token."""
        db_email_verification = EmailVerification.get(verification_token)
        return EmailVerificationSchema().dump(db_email_verification)

    @classmethod
    def get_active(cls, verification_token):
        """Get an active email verification matching the provided token."""
        db_email_verification = EmailVerification.get(verification_token)
        email_verification = EmailVerificationSchema().dump(db_email_verification)
        cls.validate_email_verification(email_verification)
        return email_verification

    @classmethod
    def create(cls, email_verification: EmailVerificationSchema,
               subscription_type='', session=None) -> EmailVerificationSchema:
        """Create an email verification."""
        cls.validate_fields(email_verification)
        if email_verification.get('type', None) == EmailVerificationType.Subscribe:
            subscription_type = cls._normalize_subscription_type(subscription_type)
        email_address: str = email_verification.get('email_address')
        survey = SurveyModel.find_by_id(email_verification.get('survey_id'))
        engagement: EngagementModel = EngagementModel.find_by_id(
            survey.engagement_id)
        if engagement.is_internal and not email_address.endswith(INTERNAL_EMAIL_DOMAIN):
            raise BusinessException(
                error='Not an internal email address.',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR)

        if email_address is not None:
            participant = ParticipantService.get_or_create_by_email(
                email_address)
            email_verification['participant_id'] = participant.id

        email_verification['created_by'] = email_verification.get(
            'participant_id')
        verification_token = uuid.uuid4()
        email_verification['verification_token'] = verification_token
        EmailVerification.create(email_verification, session)

        # TODO: remove this once email logic is brought over from submission service to here
        if email_verification.get('type', None) != EmailVerificationType.RejectedComment:
            cls._send_verification_email(email_verification, subscription_type)

        return email_verification

    @classmethod
    def verify(cls, verification_token, survey_id, submission_id, session):
        """Validate and update an email verification."""
        db_email_verification = EmailVerification.get(verification_token)
        email_verification = EmailVerificationSchema().dump(db_email_verification)
        cls.validate_email_verification(email_verification)

        verification_type = email_verification.get('type', None)

        if verification_type == EmailVerificationType.Survey and\
           email_verification.get('survey_id', None) != survey_id:
            raise ValueError('Email verification invalid for survey')

        if verification_type == EmailVerificationType.RejectedComment and\
           email_verification.get('submission_id', None) != submission_id:
            raise ValueError('Email verification invalid for submission')

        email_verification['updated_by'] = email_verification['participant_id']
        email_verification['is_active'] = False
        EmailVerification.update(email_verification, session)
        return email_verification

    @staticmethod
    def _send_verification_email(email_verification: dict, subscription_type) -> None:
        """Send an verification email.Throws error if fails."""
        survey_id = email_verification.get('survey_id')
        email_to = email_verification.get('email_address')
        participant_id = email_verification.get('participant_id')
        survey: SurveyModel = SurveyModel.find_by_id(survey_id)

        if not survey:
            raise ValueError('Survey not found')
        if not survey.engagement_id:
            raise ValueError('Engagement not found')

        subject, body, args, template_id = EmailVerificationService._render_email_template(
            survey,
            email_verification.get('verification_token'),
            email_verification.get('language_code', current_app.config['DEFAULT_LANGUAGE']),
            email_verification.get('type'),
            subscription_type,
            participant_id
        )
        try:
            # user hasn't been created yet.so create token using SA.
            notification.send_email(
                subject=subject, email=email_to, html_body=body, args=args, template_id=template_id)
        except Exception as exc:  # noqa: B902
            current_app.logger.error(
                'Notification for registration failed', exc)
            raise BusinessException(
                error='Error sending verification email.',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR) from exc

    @staticmethod
    # pylint: disable-msg=too-many-arguments
    def _render_email_template(
        survey: SurveyModel,
        token,
        lang_code: str,
        email_type: EmailVerificationType,
        subscription_type,
        participant_id,
    ):
        if email_type == EmailVerificationType.Subscribe:
            return EmailVerificationService._render_subscribe_email_template(
                survey, token, subscription_type, participant_id, lang_code)
        # if email_type == EmailVerificationType.RejectedComment:
        # TODO: move reject comment email verification logic here
        #    return
        return EmailVerificationService._render_survey_email_template(survey, token, lang_code)

    @staticmethod
    # pylint: disable-msg=too-many-locals
    def _render_subscribe_email_template(survey: SurveyModel, token, subscription_type, participant_id, lang_code):
        # url is origin url excluding context path
        engagement: EngagementModel = EngagementModel.find_by_id(survey.engagement_id)
        tenant_name = EmailVerificationService._get_tenant_name(engagement.tenant_id)
        project_name = EmailVerificationService._get_project_name(
            subscription_type, tenant_name, engagement)
        is_subscribing_to_tenant = subscription_type == SubscriptionTypes.TENANT.value
        is_subscribing_to_project = subscription_type != SubscriptionTypes.TENANT.value
        template = Template.get_template('subscribe_email.html')
        templates = current_app.config['EMAIL_TEMPLATES']
        paths = current_app.config['PATH_CONFIG']
        template_id = templates['SUBSCRIBE']['ID']
        confirm_path = paths.get('SUBSCRIBE').format(
            engagement_id=engagement.id, token=token, lang=lang_code
        )
        current_app.logger.info(f'Confirm path: {confirm_path}')
        unsubscribe_path = paths.get('UNSUBSCRIBE').format(
            engagement_id=engagement.id, participant_id=participant_id, lang=lang_code
        )
        confirm_url = notification.get_tenant_site_url(engagement.tenant_id, confirm_path)
        unsubscribe_url = notification.get_tenant_site_url(
            engagement.tenant_id, unsubscribe_path)
        email_environment = templates['ENVIRONMENT']
        args = {
            'project_name': project_name,
            'confirm_url': confirm_url,
            'unsubscribe_url': unsubscribe_url,
            'email_environment': email_environment,
            'tenant_name': tenant_name,
            'is_subscribing_to_tenant': is_subscribing_to_tenant,
            'is_subscribing_to_project': is_subscribing_to_project,
        }
        subject = templates['SUBSCRIBE']['SUBJECT']
        body = template.render(
            project_name=args.get('project_name'),
            confirm_url=args.get('confirm_url'),
            unsubscribe_url=args.get('unsubscribe_url'),
            email_environment=args.get('email_environment'),
            tenant_name=args.get('tenant_name'),
            is_subscribing_to_tenant=args.get('is_subscribing_to_tenant'),
            is_subscribing_to_project=args.get('is_subscribing_to_project'),
        )
        return subject, body, args, template_id

    @staticmethod
    def _normalize_subscription_type(subscription_type):
        """Validate and normalize subscription type to enum values."""
        normalized_type = (subscription_type or '').strip().upper()
        valid_types = {subscription_type.value for subscription_type in SubscriptionTypes}
        if normalized_type not in valid_types:
            raise BusinessException(
                error='Invalid subscription type.',
                status_code=HTTPStatus.BAD_REQUEST,
            )
        return normalized_type

    @staticmethod
    def _render_survey_email_template(survey: SurveyModel, token, lang_code):
        # url is origin url excluding context path
        engagement: EngagementModel = EngagementModel.find_by_id(survey.engagement_id)
        paths = current_app.config['PATH_CONFIG']
        templates = current_app.config['EMAIL_TEMPLATES']
        subject_template = templates['VERIFICATION']['SUBJECT']
        template = Template.get_template('email_verification.html')
        survey_path = paths['SURVEY'].format(survey_id=survey.id, token=token, lang=lang_code)
        engagement_path = EmailVerificationService.get_engagement_path(engagement, lang_code=lang_code)
        site_url = notification.get_tenant_site_url(engagement.tenant_id)
        tenant_name = EmailVerificationService._get_tenant_name(engagement.tenant_id)
        args = {
            'engagement_name': engagement.name,
            'survey_url': f'{site_url}{survey_path}',
            'engagement_url': f'{site_url}{engagement_path}',
            'tenant_name': tenant_name,
            'end_date': datetime.strftime(engagement.end_date, EmailVerificationService.full_date_format),
            'email_environment': templates['ENVIRONMENT'],
        }
        subject = subject_template.format(engagement_name=engagement.name)
        body = template.render(
            engagement_name=args.get('engagement_name'),
            survey_url=args.get('survey_url'),
            engagement_url=args.get('engagement_url'),
            tenant_name=args.get('tenant_name'),
            end_date=args.get('end_date'),
            email_environment=args.get('email_environment'),
        )
        return subject, body, args, templates['VERIFICATION']['ID']

    @staticmethod
    def get_engagement_path(engagement: EngagementModel, is_public_url=True, lang_code=None):
        """Get an engagement path."""
        lang_code = lang_code or current_app.config['DEFAULT_LANGUAGE']
        paths = current_app.config['PATH_CONFIG']
        if is_public_url:
            engagement_slug = EngagementSlugModel.find_by_engagement_id(engagement.id)
            if engagement_slug:
                return paths['ENGAGEMENT']['SLUG'].format(slug=engagement_slug.slug, lang=lang_code)
        return paths['ENGAGEMENT']['VIEW'].format(engagement_id=engagement.id, lang=lang_code)

    @staticmethod
    def _get_tenant_name(tenant_id):
        tenant = TenantModel.find_by_id(tenant_id)
        return tenant.name

    @staticmethod
    def _get_project_name(subscription_type, tenant_name, engagement):
        # metadata_model: EngagementMetadataModel = EngagementMetadataModel.find_by_id(engagement.id)
        if subscription_type == SubscriptionTypes.TENANT.value:
            return tenant_name

        if subscription_type == SubscriptionTypes.PROJECT.value:
            # TODO: Uncomment depending on future metadata work
            # metadata_model: EngagementMetadataModel = EngagementMetadataModel.find_by_id(engagement.id)
            return engagement.name

        if subscription_type == SubscriptionTypes.ENGAGEMENT.value:
            return engagement.name

        return None

    @staticmethod
    def validate_email_verification(email_verification: EmailVerificationSchema):
        """Validate an email verification."""
        if email_verification.get('id', None) is None:
            raise ValueError('Email verification not found')

        is_active = email_verification.get('is_active')
        if not is_active:
            raise ValueError('Email verification already verified')

        if email_verification.get('type') == EmailVerificationType.Subscribe:
            return

        if email_verification.get('type') == EmailVerificationType.Survey:
            # New email verification expires in 24 hours
            verification_created_datetime = datetime.strptime(
                email_verification.get('created_date'), EmailVerificationService.datetime_format)
            verification_expiry_datetime = verification_created_datetime + \
                timedelta(
                    hours=EmailVerificationService.verification_expiry_hours)
            if datetime.now() >= verification_expiry_datetime:
                raise ValueError('Email verification is expired')

        survey_id = email_verification.get('survey_id')
        survey: SurveyModel = SurveyModel.get_open(survey_id)
        if not survey:
            raise ValueError('Engagement period is over')

    @staticmethod
    def validate_fields(data: EmailVerificationSchema):
        """Validate all required fields."""
        empty_fields = [not data[field] for field in [
            'survey_id'
        ]]

        if any(empty_fields):
            raise ValueError('Some required fields are empty')
