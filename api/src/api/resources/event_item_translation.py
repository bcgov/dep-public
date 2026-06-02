# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
"""API endpoints for managing an EventItemTranslation resource."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.auth import jwt as _jwt
from api.exceptions.business_exception import BusinessException
from api.schemas import utils as schema_utils
from api.schemas.event_item_translation_schema import EventItemTranslationSchema
from api.services.event_item_translation_service import EventItemTranslationService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace(
    'event_item_translations',
    description='Endpoints for EventItemTranslation Management',
)


@cors_preflight('GET, POST, PATCH, DELETE, OPTIONS')
@API.route('/<int:event_item_translation_id>')
class EventItemTranslationResource(Resource):
    """Resource for managing event item translations."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(event_item_translation_id, **_):
        """Fetch an event item translation by id."""
        try:
            event_item_translation = (
                EventItemTranslationService.get_by_id(
                    event_item_translation_id
                )
            )
            return (
                EventItemTranslationSchema().dump(event_item_translation),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @_jwt.requires_auth
    @cross_origin(origins=allowedorigins())
    def patch(event_id, event_item_translation_id):
        """Update saved event item translation partially."""
        try:
            request_json = request.get_json()
            event_item_translation = (
                EventItemTranslationService.update_event_item_translation(
                    event_id, event_item_translation_id, request_json
                )
            )
            return (
                EventItemTranslationSchema().dump(event_item_translation),
                HTTPStatus.OK,
            )
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST

    @staticmethod
    @_jwt.requires_auth
    @cross_origin(origins=allowedorigins())
    def delete(event_id, event_item_translation_id):
        """Delete an event item translation."""
        try:
            success = EventItemTranslationService.delete_event_item_translation(
                event_id, event_item_translation_id
            )
            if success:
                return (
                    'Successfully deleted event item translation',
                    HTTPStatus.NO_CONTENT,
                )
            raise ValueError('Event item translation not found')
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND


@cors_preflight('GET, OPTIONS')
@API.route('/item/<int:event_item_id>/language/<int:language_id>')
class EventItemTranslationResourceByLanguage(Resource):
    """Resource for event item using language_id."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(event_item_id, language_id, **_):
        """Fetch an event item translation by language_id."""
        try:
            event_item_translation = (
                EventItemTranslationService.get_event_item_translation(
                    event_item_id, language_id
                )
            )
            return (
                EventItemTranslationSchema().dump(
                    event_item_translation[0], many=False
                ),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET, OPTIONS')
@API.route('/language/<int:language_id>')
class EventItemTranslationsResourceByLanguage(Resource):
    """Resource for all event item translations for an event and language."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(event_id, language_id, **_):
        """Fetch all event item translations for an event by language_id."""
        try:
            event_item_translations = (
                EventItemTranslationService.get_event_item_translations(
                    event_id, language_id
                )
            )
            return (
                EventItemTranslationSchema().dump(
                    event_item_translations, many=True
                ),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('POST, OPTIONS')
@API.route('/')
class EventItemTranslations(Resource):
    """Resource for managing multiple event item translations."""

    @staticmethod
    @_jwt.requires_auth
    @cross_origin(origins=allowedorigins())
    def post(event_id):
        """Create a new event item translation."""
        try:
            request_json = request.get_json()
            valid_format, errors = schema_utils.validate(
                request_json, 'event_item_translation'
            )
            if not valid_format:
                return {
                    'message': schema_utils.serialize(errors)
                }, HTTPStatus.BAD_REQUEST
            # Option to pre-populate with default values, default True
            pre_populate = request_json.get('pre_populate', True)

            event_item_translation = (
                EventItemTranslationService.create_event_item_translation(
                    event_id, request_json, pre_populate
                )
            )
            return (
                EventItemTranslationSchema().dump(event_item_translation),
                HTTPStatus.CREATED,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST
        except BusinessException as err:
            return err.error, err.status_code
