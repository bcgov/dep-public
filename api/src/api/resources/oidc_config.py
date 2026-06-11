"""A simple endpoint to serve the OpenID Connect configuration for the web application."""

from flask import jsonify
from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from api.utils.roles import Role
from api.utils.util import allowedorigins, cors_preflight
from api.config import Config

API = Namespace(
    'oidc_config',
    description='Endpoints for fetching OpenID Connect configuration',
)

jwt_config = Config().JWT
keycloak_config = Config().KC

PUBLIC_CONFIG = {
    # Do not overpopulate this dict with sensitive information
    # as it will be intentionally exposed to the public
    'KEYCLOAK_URL': keycloak_config['BASE_URL'],
    'KEYCLOAK_REALM': keycloak_config['REALMNAME'],
    'KEYCLOAK_CLIENT': jwt_config['AUDIENCE'],
    'KEYCLOAK_ADMIN_ROLE': Role.SUPER_ADMIN.value,
}


@cors_preflight('GET,OPTIONS')
@API.route('/')
class OIDCConfigAsJson(Resource):
    """Resource for OpenID Connect configuration."""

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get():
        """Fetch OpenID Connect configuration."""
        return jsonify(PUBLIC_CONFIG), 200


@cors_preflight('GET,OPTIONS')
@API.route('/config.js')
class OIDCConfigAsJs(Resource):
    """Resource for OpenID Connect configuration in JavaScript format."""

    js_prefix = 'globalThis._env_ = globalThis._env_ || {};\n'
    js_template = "globalThis._env_.{VAR_NAME} = '{VAR_VALUE}';\n"

    @staticmethod
    @cross_origin(origins=allowedorigins())
    def get():
        """Fetch OpenID Connect configuration."""
        js_content = OIDCConfigAsJs.js_prefix
        for key, value in PUBLIC_CONFIG.items():
            js_content += OIDCConfigAsJs.js_template.format(
                VAR_NAME='REACT_APP_' + key, VAR_VALUE=value
            )
        return js_content, 200, {'Content-Type': 'application/javascript'}
