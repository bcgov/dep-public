# Copyright © 2021 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
API endpoints for managing a tenant's metadata taxa.

This determines what taxa are available for a tenant's normal users to select when creating a new
engagement. This API is located at /api/tenants/<tenant_id>/metadata/taxa
"""

from functools import wraps
from http import HTTPStatus
from typing import Callable

from flask import abort, g, request
from flask_cors import cross_origin
from flask_restx import Namespace, Resource, fields
from marshmallow.exceptions import ValidationError

from api.auth import auth_methods
from api.models.tenant import Tenant
from api.services.metadata_taxon_service import MetadataTaxonService
from api.utils.roles import Role
from api.utils.tenant_validator import require_role
from api.utils.util import allowedorigins, cors_preflight


MANAGE_METADATA_ROLE = [Role.MANAGE_METADATA.value]
TAXON_NOT_FOUND_MSG = 'Metadata taxon was not found'

API = Namespace('metadata_taxa', description='Endpoints for managing the taxa '
                "that organize a tenant's metadata. Admin-level users only.",
                authorizations=auth_methods)

taxon_service = MetadataTaxonService()


taxon_modify_model = API.model('MetadataTaxon', taxon_model_dict := {
    'name': fields.String(required=False, description='The name of the taxon'),
    'description': fields.String(required=False, description='The taxon description'),
    'freeform': fields.Boolean(required=False, description='Whether the taxon is freeform'),
    'data_type': fields.String(required=False, description='The data type for the taxon'),
    'one_per_engagement': fields.Boolean(required=False, description='Whether the taxon is limited'
                                         ' to one entry per engagement'),
    'preset_values': fields.List(fields.String(), required=False,
                                 description='The preset values for the taxon'),
    'filter_type': fields.String(required=False, description='The filter type for the taxon (if any)'),
    'include_freeform': fields.Boolean(required=False, description='Whether to include freeform '
                                       'values in the user-facing filter options')
})

taxon_return_model = API.model('MetadataTaxonReturn', {
    'id': fields.Integer(required=True, description='The id of the taxon'),
    'tenant_id': fields.Integer(required=True, description='The tenant id'),
    'position': fields.Integer(required=False,
                               description="The taxon's position within the tenant"),
    'is_required': fields.Boolean(required=False, description='Whether the taxon is required'),
    **taxon_model_dict
})

taxon_filter_model = API.model('MetadataTaxonFilter', {
    'taxon_id': fields.Integer(required=True, description='The id of the taxon'),
    'name': fields.String(required=False, description='The name of the taxon'),
    'values': fields.List(fields.String, required=True, description='The values to filter by'),
    'filter_type': fields.String(required=True, description='The filter type')
})

taxon_ids_model = API.model('TaxonIDs', {
    'taxon_ids': fields.List(fields.Integer, required=True, description='A list of taxon ids')
})


responses = {
    HTTPStatus.UNAUTHORIZED.value: 'No known user logged in',
    HTTPStatus.BAD_REQUEST.value: 'Invalid request',
    HTTPStatus.FORBIDDEN.value: 'Not authorized to access taxa for tenant',
    HTTPStatus.NOT_FOUND.value: 'Tenant not found',
    HTTPStatus.INTERNAL_SERVER_ERROR.value: 'Internal server error'
}


def ensure_tenant_access():
    """
    Provide access to the tenant as a DB model for the decorated function.

    This does not provide security; that is handled by @require_role.
    """
    def wrapper(f: Callable):
        @wraps(f)
        def decorated_function(*args, **func_kwargs):
            tenant_short_name = g.tenant_name
            tenant = Tenant.find_by_short_name(tenant_short_name)
            if not tenant:
                abort(HTTPStatus.NOT_FOUND,
                      f'Tenant with id {tenant_short_name} not found')
            func_kwargs['tenant'] = tenant
            return f(*args, **func_kwargs)
        return decorated_function
    return wrapper


@cors_preflight('GET,POST,PATCH,OPTIONS')
@API.route('/taxa')  # /engagment_metadata/taxa
@API.doc(security=['apikey', 'tenant'], responses=responses)
class MetadataTaxa(Resource):
    """Resource for managing engagement metadata taxa."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.marshal_list_with(taxon_return_model)
    @ensure_tenant_access()
    def get(tenant: Tenant):
        """Fetch a list of metadata taxa for the current tenant."""
        tenant_taxa = taxon_service.get_by_tenant(tenant.id)
        return tenant_taxa, HTTPStatus.OK

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.expect(taxon_modify_model)
    # type: ignore
    @API.marshal_with(taxon_return_model, code=HTTPStatus.CREATED)
    @ensure_tenant_access()
    @require_role(MANAGE_METADATA_ROLE)
    def post(tenant: Tenant):
        """Create a new metadata taxon for a tenant and return it."""
        request_json = request.get_json(force=True)
        try:
            metadata_taxon = taxon_service.create(tenant.id, request_json)
            return metadata_taxon, HTTPStatus.CREATED
        except ValidationError as err:
            return err.messages, HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.expect(taxon_ids_model)
    @API.marshal_list_with(taxon_return_model)
    @ensure_tenant_access()
    @require_role(MANAGE_METADATA_ROLE)
    def patch(tenant: Tenant):
        """Reorder the tenant's metadata taxa."""
        request_json = request.get_json(force=True)
        try:
            taxon_ids = request_json['taxon_ids']
            taxon_service.reorder_tenant(tenant.id, taxon_ids)
            return taxon_service.get_by_tenant(tenant.id), HTTPStatus.OK
        except ValidationError as err:
            return err.messages, HTTPStatus.BAD_REQUEST
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


responses[HTTPStatus.NOT_FOUND.value] = 'Metadata taxon or tenant not found'


@cors_preflight('GET,PATCH,DELETE,OPTIONS')
# /engagement_metadata/taxon/<taxon_id>
@API.route('/taxon/<taxon_id>')
@API.doc(security=['apikey', 'tenant'], responses=responses)
class MetadataTaxon(Resource):
    """Resource for managing a single metadata taxon."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @ensure_tenant_access()
    @require_role(MANAGE_METADATA_ROLE)
    @API.marshal_with(taxon_return_model)
    def get(tenant: Tenant, taxon_id: int):
        """Fetch a single metadata taxon matching the provided id."""
        metadata_taxon = taxon_service.get_by_id(taxon_id)
        if not metadata_taxon or metadata_taxon['tenant_id'] != tenant.id:
            return TAXON_NOT_FOUND_MSG, HTTPStatus.NOT_FOUND
        return metadata_taxon, HTTPStatus.OK

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @API.expect(taxon_modify_model)
    @API.marshal_with(taxon_return_model)
    @ensure_tenant_access()
    @require_role(MANAGE_METADATA_ROLE)
    def patch(tenant: Tenant, taxon_id: int):
        """Update a metadata taxon."""
        metadata_taxon = taxon_service.get_by_id(taxon_id)
        if not metadata_taxon or metadata_taxon['tenant_id'] != tenant.id:
            return TAXON_NOT_FOUND_MSG, HTTPStatus.NOT_FOUND
        patch = {**request.get_json(), 'tenant_id': tenant.id}
        return taxon_service.update(taxon_id, patch), HTTPStatus.OK

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @ensure_tenant_access()
    @require_role(MANAGE_METADATA_ROLE)
    @API.doc(responses={**responses, HTTPStatus.NO_CONTENT.value: 'Taxon deleted'})
    def delete(tenant: Tenant, taxon_id: int):
        """Delete a metadata taxon."""
        try:
            metadata_taxon = taxon_service.get_by_id(taxon_id)
            if not metadata_taxon or metadata_taxon['tenant_id'] != tenant.id:
                return TAXON_NOT_FOUND_MSG, HTTPStatus.NOT_FOUND
            taxon_service.delete(taxon_id)
            return {}, HTTPStatus.NO_CONTENT
        except ValueError as err:
            return str(err), HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET,OPTIONS')
# /engagement_metadata/taxa/filters
@API.route('/taxa/filters/')
@API.doc(security=['tenant'], responses=responses)
class MetadataFilterOptions(Resource):
    """
    Resource for getting filter options for a tenant's metadata taxa.

    This resource is read-only and does not require any specific roles.
    """

    @staticmethod
    @cross_origin(origins=allowedorigins())
    @ensure_tenant_access()
    @API.marshal_list_with(taxon_filter_model)
    def get(tenant: Tenant):
        """Fetch the filter options for a tenant."""
        return taxon_service.get_filter_options(tenant.id), HTTPStatus.OK
