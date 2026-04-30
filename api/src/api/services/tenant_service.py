"""Service for tenant."""

from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from api.models.tenant import Tenant as TenantModel
from api.schemas.tenant import TenantSchema
from api.services import authorization
from api.services.object_storage_service import ObjectStorageService
from api.utils.roles import Role
from ..utils.cache import cache

NOT_FOUND_MSG = 'Tenant not found.'


class TenantService:
    """Tenant management service."""

    _object_storage = ObjectStorageService()

    @classmethod
    def _normalize_hero_image_url(cls, data: dict):
        if 'hero_image_url' in data:
            data['hero_image_url'] = cls._object_storage.get_object_key(data.get('hero_image_url'))
        return data

    @classmethod
    def build_all_tenant_cache(cls):
        """Build cache for all tenant values."""
        try:
            tenants = TenantModel.query.all()
            for tenant in tenants:
                key = tenant.short_name.upper()
                cache.set(f'tenant_{key}', tenant)
        except SQLAlchemyError as e:
            current_app.logger.info('Error on building cache {}', e)

    @classmethod
    def get(cls, tenant_id):
        """Get a tenant by id."""
        tenant = TenantModel.find_by_short_name(tenant_id)
        if not tenant:
            raise ValueError(NOT_FOUND_MSG, cls, tenant_id)
        return TenantSchema().dump(tenant)

    @classmethod
    def get_all(cls):
        """Get all tenants."""
        tenants = TenantModel.query.order_by(TenantModel.name.asc()).all()
        return TenantSchema().dump(tenants, many=True)

    @classmethod
    def create(cls, data: dict):
        """Create a new tenant."""
        one_of_roles = (
            Role.SUPER_ADMIN.value,
        )
        authorization.check_auth(one_of_roles=one_of_roles)
        normalized_data = cls._normalize_hero_image_url(dict(data))
        tenant = TenantModel(**normalized_data)
        try:
            tenant.save()
        except SQLAlchemyError as e:
            current_app.logger.error('Error creating tenant {}', e)
            raise ValueError('Error creating tenant.') from e
        return TenantSchema().dump(tenant)

    @classmethod
    def update(cls, tenant_id: str, data: dict):
        """Update an existing tenant."""
        one_of_roles = (
            Role.SUPER_ADMIN.value,
        )
        authorization.check_auth(one_of_roles=one_of_roles)
        tenant = TenantModel.find_by_short_name(tenant_id)
        if not tenant:
            raise ValueError(NOT_FOUND_MSG, cls, tenant_id)
        try:
            tenant.update(cls._normalize_hero_image_url(dict(data)))
        except SQLAlchemyError as e:
            current_app.logger.error('Error updating tenant {}', e)
            raise ValueError('Error updating tenant.') from e
        return TenantSchema().dump(tenant)

    @classmethod
    def delete(cls, tenant_id: str):
        """Delete an existing tenant."""
        one_of_roles = (
            Role.SUPER_ADMIN.value,
        )
        authorization.check_auth(one_of_roles=one_of_roles)
        tenant = TenantModel.find_by_short_name(tenant_id)
        if not tenant:
            raise ValueError(NOT_FOUND_MSG, cls, tenant_id)
        try:
            tenant.delete()
        except SQLAlchemyError as e:
            current_app.logger.error('Error deleting tenant {}', e)
            raise ValueError('Error deleting tenant.') from e
        return {'status': 'success', 'message': 'Tenant deleted successfully'}
