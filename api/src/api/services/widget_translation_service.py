"""Service for widget translation management."""
from datetime import datetime, timezone
from http import HTTPStatus

from sqlalchemy.exc import IntegrityError

from api.constants.membership_type import MembershipType
from api.constants.widget import WidgetType
from api.exceptions.business_exception import BusinessException
from api.models.db import db
from api.models.language import Language as LanguageModel
from api.models.widget import Widget as WidgetModel
from api.models.widget_image import WidgetImage as WidgetImageModel
from api.models.widget_image_translation import WidgetImageTranslation as WidgetImageTranslationModel
from api.models.widget_listening import WidgetListening as WidgetListeningModel
from api.models.widget_map import WidgetMap as WidgetMapModel
from api.models.widget_poll import Poll as PollModel
from api.models.widget_timeline import WidgetTimeline as WidgetTimelineModel
from api.models.widget_timeline_translation import WidgetTimelineTranslation as WidgetTimelineTranslationModel
from api.models.widget_translation import WidgetTranslation as WidgetTranslationModel
from api.models.widget_video import WidgetVideo as WidgetVideoModel
from api.schemas.widget_translation import WidgetTranslationSchema
from api.services import authorization
from api.utils.roles import Role


WIDGET_NOT_FOUND_ERROR = 'Widget to translate was not found'


class WidgetTranslationService:
    """Widget translation management service."""

    @staticmethod
    def _validate_language_payload_scope(translations_data, language_id: int, payload_name: str):
        """Ensure payload rows are scoped to the same language as the route.

        Prevents accidental cross-language updates when clients submit stale rows from a different language.
        """
        mismatched_rows = [
            row for row in translations_data if (lang := row.get('language_id')) is not None and lang != language_id
        ]
        if mismatched_rows:
            raise BusinessException(
                error=(
                    f'Invalid {payload_name} payload: language_id must match the request language ({language_id})'
                ),
                status_code=HTTPStatus.BAD_REQUEST,
            )

    @staticmethod
    def get_translation_by_widget_id_and_language_id(widget_id=None, language_id=None):
        """Get translation by widget id and language id."""
        widget_translation_schema = WidgetTranslationSchema(many=True)
        widgets_translation_records =\
            WidgetTranslationModel.get_translation_by_widget_id_and_language_id(widget_id, language_id)
        widget_translations = widget_translation_schema.dump(widgets_translation_records)
        return widget_translations

    @staticmethod
    def get_translations_by_engagement_and_language(engagement_id: int, language_id: int):
        """Get all widget translations for an engagement and language."""
        widget_translation_schema = WidgetTranslationSchema(many=True)
        widget_translation_records = WidgetTranslationModel.find_by_engagement_and_language(engagement_id, language_id)
        return widget_translation_schema.dump(widget_translation_records)

    @staticmethod
    def sync_translations(engagement_id: int, language_id: int, translations_data, user_id=None):
        """Sync widget translations for an engagement and language: create, update, delete."""
        WidgetTranslationService._authorize_for_engagement(engagement_id)

        if not isinstance(translations_data, list):
            raise BusinessException(error='Invalid widget translations payload', status_code=HTTPStatus.BAD_REQUEST)

        WidgetTranslationService._validate_language_payload_scope(
            translations_data,
            language_id,
            'widget translations',
        )

        existing_translations = WidgetTranslationModel.find_by_engagement_and_language(engagement_id, language_id)
        existing_ids = {translation.id for translation in existing_translations}
        incoming_ids = {t.get('id') for t in translations_data if t.get('id') and t.get('id') > 0}

        updates = [t for t in translations_data if t.get('id') in existing_ids]
        for update in updates:
            update['updated_by'] = user_id
            update['updated_date'] = datetime.now(timezone.utc)
            update['language_id'] = language_id

        inserts = [t for t in translations_data if not t.get('id') or t.get('id') == -1]
        for insert in inserts:
            insert.pop('id', None)
            insert['language_id'] = language_id
            insert['created_date'] = datetime.now(timezone.utc)

        to_delete = existing_ids - incoming_ids

        if updates:
            WidgetTranslationModel.bulk_update_widget_translations(updates)
        if to_delete:
            WidgetTranslationModel.delete_translations_by_ids(to_delete)
        if inserts:
            WidgetTranslationModel.bulk_insert_widget_translations(inserts)

        updated_records = WidgetTranslationModel.find_by_engagement_and_language(engagement_id, language_id)
        return {
            'summary': {'updated': len(updates), 'created': len(inserts), 'deleted': len(to_delete)},
            'widgets': WidgetTranslationSchema(many=True).dump(updated_records),
        }

    @staticmethod
    def get_timeline_translations_by_engagement_and_language(engagement_id: int, language_id: int):
        """Get all per-timeline-widget translations for an engagement and language."""
        results = (
            db.session.query(WidgetTimelineTranslationModel, WidgetTimelineModel.widget_id)
            .join(WidgetTimelineModel, WidgetTimelineModel.id == WidgetTimelineTranslationModel.widget_timeline_id)
            .filter(
                WidgetTimelineModel.engagement_id == engagement_id,
                WidgetTimelineTranslationModel.language_id == language_id,
            )
            .all()
        )
        return [
            {
                'id': t.id,
                'widget_timeline_id': t.widget_timeline_id,
                'language_id': t.language_id,
                'title': t.title,
                'description': t.description,
                'widget_id': widget_id,
            }
            for t, widget_id in results
        ]

    @staticmethod
    def sync_timeline_translations(engagement_id: int, language_id: int, translations_data, user_id=None):
        """Sync timeline widget translations for an engagement and language."""
        WidgetTranslationService._authorize_for_engagement(engagement_id)

        if not isinstance(translations_data, list):
            raise BusinessException(
                error='Invalid timeline widget translations payload',
                status_code=HTTPStatus.BAD_REQUEST,
            )

        WidgetTranslationService._validate_language_payload_scope(
            translations_data,
            language_id,
            'timeline widget translations',
        )

        existing_translations = (
            db.session.query(WidgetTimelineTranslationModel)
            .join(WidgetTimelineModel, WidgetTimelineModel.id == WidgetTimelineTranslationModel.widget_timeline_id)
            .filter(
                WidgetTimelineModel.engagement_id == engagement_id,
                WidgetTimelineTranslationModel.language_id == language_id,
            )
            .all()
        )

        existing_ids = {t.id for t in existing_translations}
        incoming_ids = {t.get('id') for t in translations_data if t.get('id') and t.get('id') > 0}

        updates = [t for t in translations_data if t.get('id') in existing_ids]
        for update in updates:
            update['updated_by'] = user_id
            update['updated_date'] = datetime.now(timezone.utc)
            update['language_id'] = language_id
            update.pop('widget_id', None)  # not a column in widget_timeline_translation

        inserts = [t for t in translations_data if not t.get('id') or t.get('id') == -1]
        for insert in inserts:
            insert.pop('id', None)
            insert.pop('widget_id', None)  # not a column in widget_timeline_translation
            insert['language_id'] = language_id
            insert['created_date'] = datetime.now(timezone.utc)

        to_delete = existing_ids - incoming_ids

        if updates:
            db.session.bulk_update_mappings(WidgetTimelineTranslationModel, updates)
            db.session.commit()
        if to_delete:
            db.session.query(WidgetTimelineTranslationModel).filter(
                WidgetTimelineTranslationModel.id.in_(to_delete)
            ).delete(synchronize_session=False)
            db.session.commit()
        if inserts:
            db.session.bulk_insert_mappings(WidgetTimelineTranslationModel, inserts)
            db.session.commit()

        updated_records = WidgetTranslationService.get_timeline_translations_by_engagement_and_language(
            engagement_id,
            language_id,
        )
        return {
            'summary': {'updated': len(updates), 'created': len(inserts), 'deleted': len(to_delete)},
            'timeline_widgets': updated_records,
        }

    @staticmethod
    def get_events_translations_by_engagement_and_language(engagement_id: int, language_id: int):
        """Get all per-event translations for an engagement and language."""
        records = WidgetTranslationModel.find_events_by_engagement_and_language(engagement_id, language_id)
        return WidgetTranslationSchema(many=True).dump(records)

    @staticmethod
    def sync_events_translations(engagement_id: int, language_id: int, translations_data, user_id=None):
        """Sync per-event translations for an engagement and language."""
        WidgetTranslationService._authorize_for_engagement(engagement_id)

        if not isinstance(translations_data, list):
            raise BusinessException(
                error='Invalid events widget translations payload',
                status_code=HTTPStatus.BAD_REQUEST,
            )

        WidgetTranslationService._validate_language_payload_scope(
            translations_data,
            language_id,
            'events widget translations',
        )

        existing_translations = WidgetTranslationModel.find_events_by_engagement_and_language(
            engagement_id, language_id
        )

        existing_ids = {t.id for t in existing_translations}
        incoming_ids = {t.get('id') for t in translations_data if t.get('id') and t.get('id') > 0}

        updates = [t for t in translations_data if t.get('id') in existing_ids]
        for update in updates:
            update['updated_by'] = user_id
            update['updated_date'] = datetime.now(timezone.utc)
            update['language_id'] = language_id

        inserts = [t for t in translations_data if not t.get('id') or t.get('id') == -1]
        for insert in inserts:
            insert.pop('id', None)
            insert['language_id'] = language_id
            insert['created_date'] = datetime.now(timezone.utc)

        to_delete = existing_ids - incoming_ids

        if updates:
            WidgetTranslationModel.bulk_update_widget_translations(updates)
        if to_delete:
            WidgetTranslationModel.delete_translations_by_ids(to_delete)
        if inserts:
            WidgetTranslationModel.bulk_insert_widget_translations(inserts)

        updated_records = WidgetTranslationService.get_events_translations_by_engagement_and_language(
            engagement_id,
            language_id,
        )
        return {
            'summary': {'updated': len(updates), 'created': len(inserts), 'deleted': len(to_delete)},
            'events_widgets': updated_records,
        }

    @staticmethod
    def get_documents_translations_by_engagement_and_language(engagement_id: int, language_id: int):
        """Get all per-document translations for an engagement and language."""
        records = WidgetTranslationModel.find_documents_by_engagement_and_language(engagement_id, language_id)
        return WidgetTranslationSchema(many=True).dump(records)

    @staticmethod
    def sync_documents_translations(
        engagement_id: int,
        language_id: int,
        translations_data,
        user_id=None
    ):
        """Sync per-document translations for an engagement and language."""
        WidgetTranslationService._authorize_for_engagement(engagement_id)

        if not isinstance(translations_data, list):
            raise BusinessException(
                error='Invalid documents widget translations payload',
                status_code=HTTPStatus.BAD_REQUEST
            )

        WidgetTranslationService._validate_language_payload_scope(
            translations_data,
            language_id,
            'documents widget translations',
        )

        existing_translations = WidgetTranslationModel.find_documents_by_engagement_and_language(
            engagement_id, language_id
        )

        existing_ids = {t.id for t in existing_translations}
        incoming_ids = {t.get('id') for t in translations_data if t.get('id') and t.get('id') > 0}

        updates = [t for t in translations_data if t.get('id') in existing_ids]
        for update in updates:
            update['updated_by'] = user_id
            update['updated_date'] = datetime.now(timezone.utc)
            update['language_id'] = language_id

        inserts = [t for t in translations_data if not t.get('id') or t.get('id') == -1]
        for insert in inserts:
            insert.pop('id', None)
            insert['language_id'] = language_id
            insert['created_date'] = datetime.now(timezone.utc)

        to_delete = existing_ids - incoming_ids

        if updates:
            WidgetTranslationModel.bulk_update_widget_translations(updates)
        if to_delete:
            WidgetTranslationModel.delete_translations_by_ids(to_delete)
        if inserts:
            WidgetTranslationModel.bulk_insert_widget_translations(inserts)

        updated_records = WidgetTranslationService.get_documents_translations_by_engagement_and_language(
            engagement_id,
            language_id,
        )
        return {
            'summary': {'updated': len(updates), 'created': len(inserts), 'deleted': len(to_delete)},
            'documents_widgets': updated_records,
        }

    @staticmethod
    def get_image_translations_by_engagement_and_language(engagement_id: int, language_id: int):
        """Get all image widget translations for an engagement and language."""
        records = (
            db.session.query(WidgetImageTranslationModel, WidgetImageModel.widget_id)
            .join(WidgetImageModel, WidgetImageModel.id == WidgetImageTranslationModel.widget_image_id)
            .join(WidgetModel, WidgetModel.id == WidgetImageModel.widget_id)
            .filter(WidgetModel.engagement_id == engagement_id, WidgetImageTranslationModel.language_id == language_id)
            .order_by(WidgetModel.location.asc(), WidgetModel.id.asc(), WidgetImageModel.id.asc())
            .all()
        )

        return [
            {
                'id': translation.id,
                'widget_id': widget_id,
                'widget_image_id': translation.widget_image_id,
                'language_id': translation.language_id,
                'alt_text': translation.alt_text,
                'description': translation.description,
            }
            for translation, widget_id in records
        ]

    @staticmethod
    def sync_image_translations(engagement_id: int, language_id: int, translations_data, user_id=None):
        """Sync image widget translations for an engagement and language."""
        WidgetTranslationService._authorize_for_engagement(engagement_id)

        if not isinstance(translations_data, list):
            raise BusinessException(
                error='Invalid image widget translations payload',
                status_code=HTTPStatus.BAD_REQUEST
            )

        WidgetTranslationService._validate_language_payload_scope(
            translations_data,
            language_id,
            'image widget translations',
        )

        existing_translations = (
            db.session.query(WidgetImageTranslationModel)
            .join(WidgetImageModel, WidgetImageModel.id == WidgetImageTranslationModel.widget_image_id)
            .join(WidgetModel, WidgetModel.id == WidgetImageModel.widget_id)
            .filter(WidgetModel.engagement_id == engagement_id, WidgetImageTranslationModel.language_id == language_id)
            .all()
        )

        existing_ids = {translation.id for translation in existing_translations}
        incoming_ids = {t.get('id') for t in translations_data if t.get('id') and t.get('id') > 0}

        updates = [t for t in translations_data if t.get('id') in existing_ids]
        for update in updates:
            update['updated_by'] = user_id
            update['updated_date'] = datetime.now(timezone.utc)
            update['language_id'] = language_id

        inserts = [t for t in translations_data if not t.get('id') or t.get('id') == -1]
        for insert in inserts:
            insert.pop('id', None)
            insert['language_id'] = language_id
            insert['created_date'] = datetime.now(timezone.utc)

        to_delete = existing_ids - incoming_ids

        if updates:
            db.session.bulk_update_mappings(WidgetImageTranslationModel, updates)
            db.session.commit()
        if to_delete:
            db.session.query(WidgetImageTranslationModel).filter(
                WidgetImageTranslationModel.id.in_(to_delete)
            ).delete(synchronize_session='fetch')
            db.session.commit()
        if inserts:
            db.session.bulk_insert_mappings(WidgetImageTranslationModel, inserts)
            db.session.commit()

        updated_records = WidgetTranslationService.get_image_translations_by_engagement_and_language(
            engagement_id,
            language_id,
        )
        return {
            'summary': {'updated': len(updates), 'created': len(inserts), 'deleted': len(to_delete)},
            'image_widgets': updated_records,
        }

    @staticmethod
    def create_widget_translation(translation_data, pre_populate=True):
        """Create widget translation item."""
        try:
            widget = WidgetModel.find_by_id(translation_data['widget_id'])
            if not widget:
                raise ValueError(WIDGET_NOT_FOUND_ERROR)

            one_of_roles = (
                MembershipType.TEAM_MEMBER.name,
                Role.EDIT_ENGAGEMENT.value
            )
            authorization.check_auth(one_of_roles=one_of_roles, engagement_id=widget.engagement_id)

            language_record = LanguageModel.find_by_id(translation_data['language_id'])
            if not language_record:
                raise ValueError('Language to translate was not found')

            if pre_populate:
                # prepopulate translation with base language data
                WidgetTranslationService._get_default_language_values(widget, translation_data)

            created_widget_translation = WidgetTranslationModel.create_widget_translation(translation_data)
            return WidgetTranslationSchema().dump(created_widget_translation)
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
    def update_widget_translation(widget_id, widget_translation_id: int, translation_data: dict):
        """Update widget translation."""
        widget = WidgetModel.find_by_id(widget_id)
        if not widget:
            raise ValueError(WIDGET_NOT_FOUND_ERROR)

        WidgetTranslationService._verify_widget_translation(widget_translation_id)

        one_of_roles = (
            MembershipType.TEAM_MEMBER.name,
            Role.EDIT_ENGAGEMENT.value
        )
        authorization.check_auth(one_of_roles=one_of_roles, engagement_id=widget.engagement_id)

        updated_widget_translation = WidgetTranslationModel.update_widget_translation(widget_translation_id,
                                                                                      translation_data)
        return WidgetTranslationSchema().dump(updated_widget_translation)

    @staticmethod
    def delete_widget_translation(widget_id, widget_translation_id):
        """Remove widget translation."""
        widget = WidgetModel.find_by_id(widget_id)
        if not widget:
            raise ValueError(WIDGET_NOT_FOUND_ERROR)

        WidgetTranslationService._verify_widget_translation(widget_translation_id)

        one_of_roles = (
            MembershipType.TEAM_MEMBER.name,
            Role.EDIT_ENGAGEMENT.value
        )

        authorization.check_auth(one_of_roles=one_of_roles, engagement_id=widget.engagement_id)

        return WidgetTranslationModel.remove_widget_translation(widget_translation_id)

    @staticmethod
    def _verify_widget_translation(widget_translation_id):
        """Verify if widget translation exists."""
        widget_translation = WidgetTranslationModel.find_by_id(widget_translation_id)
        if not widget_translation:
            raise KeyError('Widget translation' + widget_translation_id + ' does not exist')
        return widget_translation

    @staticmethod
    def _get_default_language_values(widget, translation_data):
        """Populate the default values."""
        widget_type = widget.widget_type_id
        widget_id = widget.id
        translation_data['title'] = widget.title

        if widget_type == WidgetType.Map.value:
            widget_map = WidgetMapModel.get_map(widget_id)
            if widget_map:
                translation_data['map_marker_label'] = widget_map[0].marker_label
                translation_data['map_file_name'] = widget_map[0].file_name

        if widget_type == WidgetType.Poll.value:
            widget_poll = PollModel.get_polls(widget_id)
            if widget_poll:
                translation_data['poll_title'] = widget_poll[0].title
                translation_data['poll_description'] = widget_poll[0].description

        if widget_type == WidgetType.Video.value:
            widget_video = WidgetVideoModel.get_video(widget_id)
            if widget_video:
                translation_data['video_url'] = widget_video[0].video_url
                translation_data['video_description'] = widget_video[0].description

        if widget_type == WidgetType.WHO_IS_LISTENING.value:
            widget_listening = WidgetListeningModel.get_listening(widget_id)
            if widget_listening:
                translation_data['description'] = widget_listening[0].description

        if widget_type == WidgetType.Timeline.value:
            widget_timeline = WidgetTimelineModel.get_timeline(widget_id)
            if widget_timeline:
                translation_data['title'] = widget_timeline[0].title
                translation_data['description'] = widget_timeline[0].description

        return translation_data

    @staticmethod
    def _authorize_for_engagement(engagement_id: int):
        """Authorize update access at the engagement level."""
        one_of_roles = (
            MembershipType.TEAM_MEMBER.name,
            Role.EDIT_ENGAGEMENT.value,
        )
        authorization.check_auth(one_of_roles=one_of_roles, engagement_id=engagement_id)
