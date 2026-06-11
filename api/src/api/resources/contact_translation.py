"""API endpoints for managing a ContactTranslation resource."""

from http import HTTPStatus

from flask import request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from api.exceptions.business_exception import BusinessException
from api.schemas import utils as schema_utils
from api.schemas.contact_translation_schema import ContactTranslationSchema
from api.services.contact_translation_service import ContactTranslationService
from api.utils.util import allowedorigins, cors_preflight


API = Namespace(
    'contact_translations',
    description='Endpoints for ContactTranslation Management',
)


@cors_preflight('GET, POST, PATCH, DELETE, OPTIONS')
@API.route('/<int:contact_translation_id>')
class ContactTranslationResource(Resource):
    """Resource for managing contact translations."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(contact_translation_id, **_):
        """Fetch a contact translation by id."""
        try:
            contact_translation = (
                ContactTranslationService.get_by_id(contact_translation_id)
            )
            return (
                ContactTranslationSchema().dump(contact_translation),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def patch(contact_translation_id):
        """Update saved contact translation partially."""
        try:
            request_json = request.get_json()
            contact_translation = (
                ContactTranslationService.update_contact_translation(
                    contact_translation_id, request_json
                )
            )
            return (
                ContactTranslationSchema().dump(contact_translation),
                HTTPStatus.OK,
            )
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST
        except BusinessException as err:
            return str(err), err.status_code

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def delete(contact_translation_id):
        """Delete a contact translation."""
        try:
            success = ContactTranslationService.delete_contact_translation(
                contact_translation_id
            )
            if success:
                return (
                    'Successfully deleted contact translation',
                    HTTPStatus.NO_CONTENT,
                )
            raise ValueError('Contact translation not found')
        except KeyError as err:
            return str(err), HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.NOT_FOUND
        except BusinessException as err:
            return str(err), err.status_code


@cors_preflight('GET, OPTIONS')
@API.route('/contact/<int:contact_id>/language/<int:language_id>')
class ContactTranslationResourceByLanguage(Resource):
    """Resource for contact translation using language_id."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get(contact_id, language_id, **_):
        """Fetch a contact translation by language_id."""
        try:
            contact_translation = (
                ContactTranslationService.get_contact_translation(
                    contact_id, language_id
                )
            )
            if not contact_translation:
                return {}, HTTPStatus.NOT_FOUND
            return (
                ContactTranslationSchema().dump(contact_translation),
                HTTPStatus.OK,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except BusinessException as err:
            return str(err), err.status_code


@cors_preflight('POST, OPTIONS')
@API.route('/')
class ContactTranslations(Resource):
    """Resource for managing multiple contact translations."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def post():
        """Create a new contact translation."""
        try:
            request_json = request.get_json()
            valid_format, errors = schema_utils.validate(
                request_json, 'contact_translation'
            )
            if not valid_format:
                return {
                    'message': schema_utils.serialize(errors)
                }, HTTPStatus.BAD_REQUEST

            contact_translation = (
                ContactTranslationService.create_contact_translation(
                    request_json
                )
            )
            return (
                ContactTranslationSchema().dump(contact_translation),
                HTTPStatus.CREATED,
            )
        except (KeyError, ValueError) as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR
        except ValidationError as err:
            return str(err.messages), HTTPStatus.BAD_REQUEST
        except BusinessException as err:
            return str(err), err.status_code
