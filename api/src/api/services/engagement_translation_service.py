"""Service for engagement translation management."""
from http import HTTPStatus

from sqlalchemy.exc import IntegrityError
from api.constants.engagement_status import SubmissionStatus
from api.constants.membership_type import MembershipType
from api.exceptions.business_exception import BusinessException
from api.models.engagement import Engagement as EngagementModel
from api.models.engagement_slug import EngagementSlug as EngagementSlugModel
from api.models.engagement_status_block import EngagementStatusBlock as EngagementStatusBlockModel
from api.models.engagement_translation import EngagementTranslation as EngagementTranslationModel
from api.models.survey import Survey as SurveyModel
from api.models.language import Language as LanguageModel
from api.schemas.language import LanguageSchema
from api.schemas.engagement_translation import EngagementTranslationSchema
from api.services import authorization
from api.utils.roles import Role


class EngagementTranslationService:
    """Engagement translation management service."""

    ENGAGEMENT_NOT_FOUND = 'Engagement with id {} was not found for translation'
    LANGUAGE_NOT_FOUND = 'Language with id {} was not found'
    TRANSLATION_NOT_FOUND = 'Engagement translation with id {} was not found'

    @staticmethod
    def get_engagement_translation_by_id(engagement_translation_id):
        """Get engagement translation by id."""
        engagement_translation_record = EngagementTranslationModel.find_by_id(
            engagement_translation_id
        )
        return engagement_translation_record

    @staticmethod
    def get_translation_by_engagement_and_language(engagement_id=None, language_id=None):
        """Get engagement translation by engagement id and/or language id."""
        engagement_translation_schema = EngagementTranslationSchema(many=True)
        engagement_translation_records =\
            EngagementTranslationModel.get_engagement_translation_by_engagement_and_language(engagement_id,
                                                                                             language_id)
        engagement_translations = engagement_translation_schema.dump(engagement_translation_records)
        return engagement_translations

    @staticmethod
    def create_engagement_translation(translation_data, pre_populate=True):
        """Create engagement translation."""
        try:
            engagement = EngagementModel.find_by_id(translation_data['engagement_id'])
            if not engagement:
                raise KeyError(
                    EngagementTranslationService.ENGAGEMENT_NOT_FOUND.format(translation_data['engagement_id']),
                    HTTPStatus.NOT_FOUND,    
                )

            one_of_roles = (
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value
            )
            authorization.check_auth(one_of_roles=one_of_roles, engagement_id=engagement.id)

            language_record = LanguageModel.find_by_id(translation_data['language_id'])
            if not language_record:
                raise KeyError(
                    EngagementTranslationService.LANGUAGE_NOT_FOUND.format(translation_data['language_id']),
                    HTTPStatus.NOT_FOUND,
                )

            if pre_populate:
                # prepopulate translation_date dict with base language data from engagement content
                EngagementTranslationService._get_default_language_values(engagement,
                                                                          translation_data)

            created_engagement_translation = EngagementTranslationModel.create_engagement_translation(
                translation_data)
            return EngagementTranslationSchema().dump(created_engagement_translation)
        except IntegrityError as e:
            detail = (
                str(e.orig).split('DETAIL: ')[1]
                if 'DETAIL: ' in str(e.orig)
                else 'Duplicate entry.'
            )
            raise BusinessException(
                str(detail), HTTPStatus.INTERNAL_SERVER_ERROR
            ) from e

    @staticmethod
    def update_engagement_translation(engagement_id, engagement_translation_id: int, translation_data: dict):
        """Update engagement translation."""
        engagement = EngagementModel.find_by_id(engagement_id)
        if not engagement:
            raise KeyError(
                EngagementTranslationService.ENGAGEMENT_NOT_FOUND.format(engagement_id),
                HTTPStatus.NOT_FOUND
            )

        EngagementTranslationService._verify_engagement_translation(engagement_translation_id)

        one_of_roles = (
            MembershipType.TEAM_MEMBER.name,
            Role.EDIT_ENGAGEMENT.value
        )
        authorization.check_auth(one_of_roles=one_of_roles, engagement_id=engagement.id)

        updated_engagement_translation = EngagementTranslationModel.update_engagement_translation(
            engagement_translation_id, translation_data)
        return EngagementTranslationSchema().dump(updated_engagement_translation)

    @staticmethod
    def delete_engagement_translation(engagement_id, engagement_translation_id):
        """Remove engagement translation."""
        engagement = EngagementModel.find_by_id(engagement_id)
        if not engagement:
            raise KeyError(
                EngagementTranslationService.ENGAGEMENT_NOT_FOUND.format(engagement_id),
                HTTPStatus.NOT_FOUND
            )

        EngagementTranslationService._verify_engagement_translation(engagement_translation_id)

        one_of_roles = (
            MembershipType.TEAM_MEMBER.name,
            Role.EDIT_ENGAGEMENT.value
        )

        authorization.check_auth(one_of_roles=one_of_roles, engagement_id=engagement.id)

        return EngagementTranslationModel.delete_engagement_translation(engagement_translation_id)

    @staticmethod
    def get_available_engagement_translation_languages(engagement_id):
        """Get a list of all languages for each entry in the engagement_translation table."""
        language_schema = LanguageSchema(many=True)
        available_translations = EngagementTranslationModel.get_available_translation_languages(engagement_id)

        return language_schema.dump(available_translations)

    @staticmethod
    def _verify_engagement_translation(engagement_translation_id):
        """Verify if engagement translation exists."""
        engagement_translation = EngagementTranslationModel.find_by_id(engagement_translation_id)
        if not engagement_translation:
            raise KeyError(
                EngagementTranslationService.TRANSLATION_NOT_FOUND.format(engagement_translation_id),
                HTTPStatus.NOT_FOUND
            )
        return engagement_translation

    @staticmethod
    def _get_default_language_values(engagement, translation_data):
        """Populate the default values from the English (default) translation row."""
        engagement_id = engagement.id
        translation_data['name'] = engagement.name

        # Read all translatable content from the existing English translation row.
        english_language = LanguageModel.query.filter_by(code='en').first()
        english_translations = (
            EngagementTranslationModel.get_engagement_translation_by_engagement_and_language(
                engagement_id=engagement_id,
                language_id=english_language.id if english_language else None,
            )
        )
        english_translation = english_translations[0] if english_translations else None

        if english_translation:
            translation_data['description'] = english_translation.description
            translation_data['rich_description'] = english_translation.rich_description
            translation_data['description_title'] = english_translation.description_title
            translation_data['consent_message'] = english_translation.consent_message
            translation_data['sponsor_name'] = english_translation.sponsor_name
            translation_data['feedback_heading'] = english_translation.feedback_heading
            translation_data['feedback_body'] = english_translation.feedback_body
            translation_data['subscribe_section_heading'] = english_translation.subscribe_section_heading
            translation_data['subscribe_section_description'] = english_translation.subscribe_section_description
            translation_data['subscribe_consent_message'] = english_translation.subscribe_consent_message
            translation_data['more_engagements_heading'] = english_translation.more_engagements_heading
            translation_data['open_status_block_button_text'] = english_translation.open_status_block_button_text
            translation_data['view_results_status_block_button_text'] = (
                english_translation.view_results_status_block_button_text
            )

        engagement_slug = EngagementSlugModel.find_by_engagement_id(engagement_id)
        if engagement_slug:
            translation_data['slug'] = engagement_slug.slug

        upcoming_status_block = EngagementStatusBlockModel.get_by_status(engagement_id,
                                                                         SubmissionStatus.Upcoming.name)
        if upcoming_status_block:
            translation_data['upcoming_status_block_text'] = upcoming_status_block.block_text

        open_status_block = EngagementStatusBlockModel.get_by_status(engagement_id,
                                                                     SubmissionStatus.Open.name)
        if open_status_block:
            translation_data['open_status_block_text'] = open_status_block.block_text
            translation_data['open_status_block_button_text'] = (
                translation_data.get('open_status_block_button_text') or open_status_block.button_text
            )

        closed_status_block = EngagementStatusBlockModel.get_by_status(engagement_id,
                                                                       SubmissionStatus.Closed.name)
        if closed_status_block:
            translation_data['closed_status_block_text'] = closed_status_block.block_text

        view_results_status_block = EngagementStatusBlockModel.get_by_status(
            engagement_id,
            SubmissionStatus.ViewResults.name,
        )
        if view_results_status_block:
            translation_data['view_results_status_block_button_text'] = (
                translation_data.get('view_results_status_block_button_text') or view_results_status_block.button_text
            )

        surveys = SurveyModel.find_by_id(engagement_id)
        if surveys:
            translation_data['surveys'] = surveys

        return translation_data
