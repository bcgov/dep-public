"""Service for TimelineEventTranslation management with authorization checks."""

from http import HTTPStatus

from sqlalchemy.exc import SQLAlchemyError

from api.constants.membership_type import MembershipType
from api.exceptions.business_exception import BusinessException
from api.models.timeline_event_translation import TimelineEventTranslation as TimelineEventTranslationModel
from api.services import authorization
from api.services.timeline_event_service import TimelineEventService
from api.services.widget_timeline_service import WidgetTimelineService
from api.utils.roles import Role


class TimelineEventTranslationService:
    """TimelineEventTranslation management service."""

    @staticmethod
    def get_by_id(translation_id: int):
        """Get timeline event translation by ID."""
        return TimelineEventTranslationModel.find_by_id(translation_id)

    @staticmethod
    def get_engagement_id(timeline_id):
        """Get engagement id using timeline event id."""
        timeline = WidgetTimelineService.get_timeline_by_id(timeline_id)
        if not timeline:
            raise BusinessException(
                status_code=HTTPStatus.NOT_FOUND,
                error='Timeline not found',
            )
        return timeline.engagement_id

    @staticmethod
    def get_timeline_event_translation(timeline_event_id=None, language_id=None):
        """Get timeline event translations by timeline event ID and language ID."""
        return TimelineEventTranslationModel.get_by_event_and_language(
            timeline_event_id, language_id
        )

    @staticmethod
    def get_by_timeline_and_language(timeline_id: int, language_id: int):
        """Get all event translations for a timeline widget and language."""
        return TimelineEventTranslationModel.get_by_timeline_and_language(timeline_id, language_id)

    @staticmethod
    def create_timeline_event_translation(timeline_id: int, data: dict, pre_populate: bool = True):
        """Insert a new TimelineEventTranslation with authorization check."""
        try:
            one_of_roles = (
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value,
            )
            engagement_id = TimelineEventTranslationService.get_engagement_id(
                timeline_id
            )
            authorization.check_auth(
                one_of_roles=one_of_roles, engagement_id=engagement_id
            )
            # Pre populating with timeline event item base language data
            if pre_populate:
                timeline_event_item = TimelineEventService.get_timeline_event(data['timeline_event_id'])
                if not timeline_event_item:
                    raise BusinessException(
                        'TimelineEventItem not found', HTTPStatus.NOT_FOUND
                    )
                data['description'] = timeline_event_item.description
                data['time'] = timeline_event_item.time

            return TimelineEventTranslationModel.create_timeline_event_translation(
                data
            )
        except SQLAlchemyError as e:
            raise BusinessException(
                str(e), HTTPStatus.INTERNAL_SERVER_ERROR
            ) from e

    @staticmethod
    def update_timeline_event_translation(timeline_id: int, translation_id: int, data: dict):
        """Update an existing TimelineEventTranslation with authorization check."""
        try:
            timeline_event_translation = TimelineEventTranslationModel.find_by_id(translation_id)
            if not timeline_event_translation:
                raise BusinessException(
                    'TimelineEventTranslation not found', HTTPStatus.NOT_FOUND
                )

            one_of_roles = (
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value,
            )
            engagement_id = TimelineEventTranslationService.get_engagement_id(
                timeline_id
            )
            authorization.check_auth(
                one_of_roles=one_of_roles, engagement_id=engagement_id
            )

            updated_translation = (
                TimelineEventTranslationModel.update_timeline_event_translation(
                    translation_id, data
                )
            )
            return updated_translation
        except SQLAlchemyError as e:
            raise BusinessException(
                str(e), HTTPStatus.INTERNAL_SERVER_ERROR
            ) from e

    @staticmethod
    def delete_timeline_event_translation(timeline_id: int, translation_id: int):
        """Delete a TimelineEventTranslation with authorization check."""
        try:
            timeline_event_translation = TimelineEventTranslationModel.find_by_id(translation_id)
            if not timeline_event_translation:
                raise BusinessException(
                    'TimelineEventTranslation not found', HTTPStatus.NOT_FOUND
                )

            one_of_roles = (
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value,
            )
            engagement_id = TimelineEventTranslationService.get_engagement_id(
                timeline_id
            )
            authorization.check_auth(
                one_of_roles=one_of_roles,
                engagement_id=engagement_id,
            )

            return TimelineEventTranslationModel.delete_timeline_event_translation(translation_id)
        except SQLAlchemyError as e:
            raise BusinessException(
                str(e), HTTPStatus.INTERNAL_SERVER_ERROR
            ) from e
