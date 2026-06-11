# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
"""API endpoints for managing a TimelineEventTranslation resource."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.schemas import utils as schema_utils
from api.schemas.timeline_event_translation_schema import TimelineEventTranslationSchema
from api.services.timeline_event_translation_service import TimelineEventTranslationService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace(
    'timeline_event_translations',
    description='Endpoints for TimelineEventTranslation Management',
)


@cors_preflight('GET, POST, PATCH, DELETE, OPTIONS')
@API.route('/<int:timeline_event_translation_id>')
class TimelineEventTranslationResource(Resource):
    """Resource for managing timeline event translations."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(timeline_event_translation_id, **_):
        """Fetch a timeline event translation by id."""
        try:
            timeline_event_translation = (
                TimelineEventTranslationService.get_by_id(
                    timeline_event_translation_id
                )
            )
            return (
                TimelineEventTranslationSchema().dump(timeline_event_translation),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @_jwt.requires_auth
    @cross_origin(origins=allowedorigins())
    def patch(timeline_id, timeline_event_translation_id):
        """Update saved timeline event translation partially."""
        try:
            request_json = request.get_json()
            timeline_event_translation = (
                TimelineEventTranslationService.update_timeline_event_translation(
                    timeline_id, timeline_event_translation_id, request_json
                )
            )
            return (
                TimelineEventTranslationSchema().dump(timeline_event_translation),
                HTTPStatus.OK,
            )
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST

    @staticmethod
    @_jwt.requires_auth
    @cross_origin(origins=allowedorigins())
    def delete(timeline_id, timeline_event_translation_id):
        """Delete a timeline event translation."""
        try:
            success = TimelineEventTranslationService.delete_timeline_event_translation(
                timeline_id, timeline_event_translation_id
            )
            if success:
                return (
                    'Successfully deleted timeline event translation',
                    HTTPStatus.NO_CONTENT,
                )
            raise ValueError('Timeline event translation not found')
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND


@cors_preflight('GET, OPTIONS')
@API.route('/language/<int:language_id>')
class TimelineEventTranslationsByLanguage(Resource):
    """Resource for fetching all event translations for a timeline and language."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(timeline_id, language_id, **_):
        """Fetch all event translations for a timeline widget and language."""
        try:
            translations = TimelineEventTranslationService.get_by_timeline_and_language(
                timeline_id, language_id
            )
            return (
                TimelineEventTranslationSchema(many=True).dump(translations),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET, OPTIONS')
@API.route('/event/<int:timeline_event_id>/language/<int:language_id>')
class TimelineEventTranslationResourceByLanguage(Resource):
    """Resource for timeline event using language_id."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(timeline_event_id, language_id, **_):
        """Fetch a timeline event translation by language_id."""
        try:
            timeline_event_translation = (
                TimelineEventTranslationService.get_timeline_event_translation(
                    timeline_event_id, language_id
                )
            )
            return (
                TimelineEventTranslationSchema().dump(
                    timeline_event_translation[0], many=False
                ),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('POST, OPTIONS')
@API.route('/')
class TimelineEventTranslations(Resource):
    """Resource for managing multiple timeline event translations."""

    @staticmethod
    @_jwt.requires_auth
    @cross_origin(origins=allowedorigins())
    def post(timeline_id):
        """Create a new timeline event translation."""
        try:
            request_json = request.get_json()
            valid_format, errors = schema_utils.validate(
                request_json, 'timeline_event_translation'
            )
            if not valid_format:
                return {
                    'message': schema_utils.serialize(errors)
                }, HTTPStatus.BAD_REQUEST

            # pre-populate is to indicate whether to pre-populate the translation with data in base language
            pre_populate = request_json.get('pre_populate', True)

            timeline_event_translation = (
                TimelineEventTranslationService.create_timeline_event_translation(
                    timeline_id, request_json, pre_populate
                )
            )
            return (
                TimelineEventTranslationSchema().dump(timeline_event_translation),
                HTTPStatus.CREATED,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST
        except BusinessException as err:
            return err.error, err.status_code
