"""API endpoints for aggregated engagement content translation resources."""

from http import HTTPStatus

from flask import jsonify, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.services.engagement_details_tab_translation_service import EngagementDetailsTabTranslationService
from api.services.widget_translation_service import WidgetTranslationService
from api.utils.token_info import TokenInfo
from api.utils.util import allowedorigins, cors_preflight


API = Namespace(
    'engagement_content_translation',
    description='Endpoints for aggregated engagement content translations',
)


@cors_preflight('GET, PUT, OPTIONS')
@API.route('/language/<int:language_id>')
class EngagementContentTranslationByLanguage(Resource):
    """Resource for engagement-level tab and widget translations."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(engagement_id, language_id):
        """Fetch all details-tab and widget translations for an engagement and language."""
        try:
            details_tabs = EngagementDetailsTabTranslationService().get_translations_by_engagement_and_language(
                engagement_id,
                language_id,
            )
            widgets = WidgetTranslationService().get_translations_by_engagement_and_language(
                engagement_id,
                language_id,
            )
            timeline_widgets = WidgetTranslationService().get_timeline_translations_by_engagement_and_language(
                engagement_id,
                language_id,
            )
            events_widgets = WidgetTranslationService().get_events_translations_by_engagement_and_language(
                engagement_id,
                language_id,
            )
            documents_widgets = WidgetTranslationService().get_documents_translations_by_engagement_and_language(
                engagement_id,
                language_id,
            )
            image_widgets = WidgetTranslationService().get_image_translations_by_engagement_and_language(
                engagement_id,
                language_id,
            )
            return jsonify(
                {
                    'details_tabs': details_tabs,
                    'widgets': widgets,
                    'timeline_widgets': timeline_widgets,
                    'events_widgets': events_widgets,
                    'documents_widgets': documents_widgets,
                    'image_widgets': image_widgets,
                }
            ), HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return {'message': str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @_jwt.requires_auth
    def put(engagement_id, language_id):
        """Sync details-tab and/or widget translations for an engagement and language."""
        try:
            request_json = request.get_json() or {}
            details_tabs_payload = request_json.get('details_tabs')
            widgets_payload = request_json.get('widgets')
            timeline_widgets_payload = request_json.get('timeline_widgets')
            events_widgets_payload = request_json.get('events_widgets')
            documents_widgets_payload = request_json.get('documents_widgets')
            image_widgets_payload = request_json.get('image_widgets')
            user_id = TokenInfo.get_id()

            response = {}
            if details_tabs_payload is not None:
                response['details_tabs'] = EngagementDetailsTabTranslationService().sync_translations(
                    engagement_id,
                    language_id,
                    details_tabs_payload,
                    user_id=user_id,
                )
            if widgets_payload is not None:
                response['widgets'] = WidgetTranslationService().sync_translations(
                    engagement_id,
                    language_id,
                    widgets_payload,
                    user_id=user_id,
                )
            if timeline_widgets_payload is not None:
                response['timeline_widgets'] = WidgetTranslationService().sync_timeline_translations(
                    engagement_id,
                    language_id,
                    timeline_widgets_payload,
                    user_id=user_id,
                )
            if events_widgets_payload is not None:
                response['events_widgets'] = WidgetTranslationService().sync_events_translations(
                    engagement_id,
                    language_id,
                    events_widgets_payload,
                    user_id=user_id,
                )
            if documents_widgets_payload is not None:
                response['documents_widgets'] = WidgetTranslationService().sync_documents_translations(
                    engagement_id,
                    language_id,
                    documents_widgets_payload,
                    user_id=user_id,
                )
            if image_widgets_payload is not None:
                response['image_widgets'] = WidgetTranslationService().sync_image_translations(
                    engagement_id,
                    language_id,
                    image_widgets_payload,
                    user_id=user_id,
                )

            if not response:
                return {'message': 'No content translation payload provided'}, HTTPStatus.BAD_REQUEST

            return jsonify(response), HTTPStatus.OK
        except BusinessException as err:
            return {'message': err.error}, err.status_code
        except ValueError as err:
            return {'message': str(err)}, HTTPStatus.BAD_REQUEST
