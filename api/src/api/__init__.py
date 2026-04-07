"""The App Initiation file.

This module is for the initiation of the flask app.
"""

import builtins
import os
import warnings

import secure
from flask import Flask, current_app, g, request
from flask_cors import CORS

from api.auth import jwt
from api.config import get_named_config
from api.models import db, ma, migrate
from api.models.tenant import Tenant as TenantModel
from api.services.staff_user_service import StaffUserService
from api.services.user_group_membership_service import UserGroupMembershipService
from api.utils import constants
from api.utils.cache import cache
from api.utils.roles import Role
from api.utils.logging_masker import setup_logging_masking


# Store reference to original print function
_original_print = builtins.print


class PrintDeprecationWarning(DeprecationWarning):
    """Custom warning category for deprecated print() usage."""


def _deprecated_print(*args, **kwargs):
    """
    Issue a deprecation warning when print() is used.

    Using print() bypasses the logging masking system and may expose sensitive data.
    Use logging instead: current_app.logger.info(), logger.debug(), etc.
    """
    warnings.warn(
        'print() is deprecated in this application. '
        'Use logging instead (e.g., current_app.logger.info()) to ensure '
        'sensitive data is automatically masked. '
        'See api/utils/logging_masker.py for details.',
        PrintDeprecationWarning,
        stacklevel=2
    )
    # Still call original print to not break existing code during transition
    _original_print(*args, **kwargs)


# Replace built-in print with deprecated version
builtins.print = _deprecated_print

# Security Response headers
csp = (
    secure.ContentSecurityPolicy()
    .default_src("'self'")
    .script_src("'self' 'unsafe-inline'")
    .style_src("'self' 'unsafe-inline'")
    .img_src("'self' data:")
    .object_src("'self'")
    .connect_src("'self'")
)

hsts = secure.StrictTransportSecurity().include_subdomains().preload().max_age(31536000)
referrer = secure.ReferrerPolicy().no_referrer()
cache_value = secure.CacheControl().no_store().max_age(0)
xfo_value = secure.XFrameOptions().deny()
secure_headers = secure.Secure(
    csp=csp,
    hsts=hsts,
    referrer=referrer,
    cache=cache_value,
    xfo=xfo_value
)


def create_app(run_mode=os.getenv('ENV', 'prod')):
    """Create flask app."""
    from api.resources import API_BLUEPRINT  # pylint: disable=import-outside-toplevel

    # Flask app initialize
    app = Flask(__name__)

    # Configure app from config.py
    app.config.from_object(get_named_config(run_mode))

    # Replace built-in print with deprecated version AFTER config loads
    # (config.py prints during initialization before logging is set up)
    warnings.filterwarnings('default', category=PrintDeprecationWarning)
    builtins.print = _deprecated_print

    # Set up logging with sensitive data masking
    # Automatically masks passwords, tokens, API keys, database credentials
    # Applied to both Flask app logger and root logger for full coverage
    setup_logging_masking(app.logger)
    setup_logging_masking()

    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)

    # Register blueprints
    app.register_blueprint(API_BLUEPRINT)

    # Setup jwt for keycloak
    if os.getenv('ENV', 'production') != 'testing':
        setup_jwt_manager(app, jwt)

    # Database connection initialize
    db.init_app(app)

    # Database migrate initialize
    migrate.init_app(app, db)

    # Marshmallow initialize
    ma.init_app(app)

    @app.before_request
    def set_origin():
        g.origin_url = request.environ.get('HTTP_ORIGIN', 'localhost')

    build_cache(app)

    @app.before_request
    def set_tenant_id():
        """Set Tenant ID Globally."""
        tenant_short_name = request.headers.get(constants.TENANT_ID_HEADER, None)
        if not tenant_short_name:
            # Remove tenant_id and tenant_name attributes from g
            if hasattr(g, 'tenant_id'):
                del g.tenant_id

            if hasattr(g, 'tenant_name'):
                del g.tenant_name
            return
        key = tenant_short_name.upper()
        tenant = cache.get(f'tenant_{key}')
        cache_miss = not tenant
        if cache_miss:
            tenant: TenantModel = TenantModel.find_by_short_name(tenant_short_name)
            if not tenant:
                return
            key = tenant.short_name.upper()
            cache.set(f'tenant_{key}', tenant)
        g.tenant_id = tenant.id
        g.tenant_name = key

    @app.after_request
    def set_secure_headers(response):
        """Set CORS headers for security."""
        secure_headers.framework.flask(response)
        response.headers.add('Cross-Origin-Resource-Policy', '*')
        response.headers['Cross-Origin-Opener-Policy'] = '*'
        response.headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
        return response

    # Return App for run in run.py file
    return app


def build_cache(app):
    """Build cache."""
    cache.init_app(app)
    with app.app_context():
        cache.clear()
        try:
            from api.services.tenant_service import TenantService  # pylint: disable=import-outside-toplevel
            TenantService.build_all_tenant_cache()
        except Exception as e:  # NOQA # pylint:disable=broad-except
            current_app.logger.error('Error on caching ')
            current_app.logger.error(e)


def setup_jwt_manager(app_context, jwt_manager):
    """Use flask app to configure the JWTManager to work for a particular Realm."""

    def get_roles(token_info) -> list:
        """
        Get user roles based on token info.

        Uses UserGroupMembershipService to retrieve user roles within a tenant.
        """
        role_access_path = app_context.config['JWT_CONFIG']['ROLE_CLAIM']
        roles_from_token = []
        # TODO Needs to be modified once the actual role for super admin is finalized
        current_token_info = token_info.copy()
        for key in role_access_path.split('.'):
            # Navigate deeper at each step via reassignment
            current_token_info = current_token_info.get(key, None)
            if current_token_info is None:
                app_context.logger.warning('Unable to find role info in Keycloak data.')
                break
            # Check if the obtained value is a list and can be extended
            if isinstance(current_token_info, list):
                roles_from_token.extend(current_token_info)
                break
            app_context.logger.warning('Role info from keycloak is not a list!')
            break

        # Any roles from keycloak that should be available in the API.
        # For now, we only want to know if a user is a super admin;
        # everything else is handled in-app by the UserGroupMembershipService...
        keycloak_forwarded_roles = [Role.SUPER_ADMIN.value]
        # ... so any extraneous roles are discarded
        user_roles = list(set(roles_from_token).intersection(keycloak_forwarded_roles))

        # Retrieve user by external ID from token info
        user = StaffUserService.get_user_by_external_id(token_info['sub'])

        # Retrieve user roles within a tenant using UserGroupMembershipService
        additional_user_roles, _ = UserGroupMembershipService.get_user_roles_within_tenant(
            token_info['sub'], g.tenant_id)
        if user and additional_user_roles:
            # Add additional user roles to user_roles list
            user_roles.extend(additional_user_roles)
        else:
            app_context.logger.warning('Unable to find an active user within the tenant.')
        if not user_roles:
            app_context.logger.warning('Unable to find a role for the user within the tenant.')
        return user_roles

    app_context.config['JWT_ROLE_CALLBACK'] = get_roles
    jwt_manager.init_app(app_context)
