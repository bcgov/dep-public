# Copyright © 2021 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
All the configuration for the Digital Engagement Platform API.

Wherever possible, the configuration is loaded from the environment. The aim is
to have this be the "single source of truth" for configuration in the API,
wherever feasible. If you are adding a setting or config option that cannot be
configured in a user-facing GUI, please make sure it loads its value from here,
and create an entry for it in the sample .env file.
"""

import os

from typing import Union
from dotenv import find_dotenv, load_dotenv

from api.utils.constants import TestKeyConfig
from api.utils.util import is_truthy

# Search in increasingly higher folders for a .env file, then load it,
# appending any variables we find to the current environment.
load_dotenv(find_dotenv())
# remove all env variables with no text (allows for entries to be unset easily)
os.environ = {k: v for k, v in os.environ.items() if v}


def get_named_config(environment: Union[str, None]) -> 'Config':
    """
    Retrieve a configuration object by name. Used by the Flask app factory.

    :param config_name: The name of the configuration.
    :return: The requested configuration object.
    :raises: KeyError if the requested configuration is not found.
    """
    config_mapping = {
        'dev': DevConfig,
        'development': DevConfig,
        'test': DevConfig,
        'default': ProdConfig,
        'staging': ProdConfig,
        'prod': ProdConfig,
        'production': ProdConfig,
        'testing': TestConfig,
        'docker': DockerConfig,
    }
    try:
        print(f'Loading configuration: {environment}...')
        return config_mapping.get(environment or 'prod', ProdConfig)()
    except KeyError as e:
        raise KeyError(f'Configuration "{environment}" not found.') from e


def env_truthy(env_var, default: Union[bool, str] = False):
    """
    Return True if the environment variable is set to a truthy value.

    Accepts a default value, which is returned if the environment variable is
    not set.
    """
    return is_truthy(os.getenv(env_var, str(default)))


class Config:  # pylint: disable=too-few-public-methods
    """
    Base configuration that sets reasonable defaults for all other configs.

    New configurations should inherit from this one where possible.
    Reference: https://flask.palletsprojects.com/en/3.0.x/config/
    """

    def __init__(self) -> None:
        """
        Initialize the configuration object.

        Performs more advanced configuration logic that is not possible
        in the normal class definition.
        """
        # apply configs to _Config in the format that flask_jwt_oidc expects
        # this flattens the JWT_CONFIG dict into individual attributes
        for key, value in self.JWT_CONFIG.items():
            setattr(self, f'JWT_OIDC_{key}', value)

        # Enable live reload and interactive API debugger for developers
        os.environ['FLASK_DEBUG'] = str(self.DEBUG)

    @property
    # pylint: disable=invalid-name
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """
        Dynamically fetch the SQLAlchemy Database URI based on the DB config.

        This avoids having to redefine the URI after setting the DB access
        credentials in subclasses. Can be overridden by env variables.
        """
        return os.environ.get(
            'SQLALCHEMY_DATABASE_URI',
            f'postgresql://'
            f'{self.DB_CONFIG.get("USER")}:{self.DB_CONFIG.get("PASSWORD")}@'
            f'{self.DB_CONFIG.get("HOST")}:{self.DB_CONFIG.get("PORT")}/'
            f'{self.DB_CONFIG.get("NAME")}'
        )

    # If enabled, Exceptions are propagated up, instead of being handled
    # by the the app’s error handlers. Enable this for tests.
    TESTING = env_truthy('FLASK_TESTING', default=False)

    # If enabled, the interactive debugger will be shown for any
    # unhandled Exceptions, and the server will be reloaded when code changes.
    DEBUG = env_truthy('FLASK_DEBUG', default=False)

    # SQLAlchemy settings
    # Echoes the SQL queries generated - useful for debugging
    SQLALCHEMY_ECHO = env_truthy('SQLALCHEMY_ECHO')
    # Disable modification tracking for performance
    SQLALCHEMY_TRACK_MODIFICATIONS = env_truthy('SQLALCHEMY_TRACK_MODIFICATIONS')

    # Used for session management. Randomized by default for security, but
    # should be set to a fixed value in production to avoid invalidating sessions.
    SECRET_KEY = os.getenv('SECRET_KEY', os.urandom(24))

    # A temporary writable location to unzip shapefile uploads.
    # This folder will be REMOVED after every shapefile conversion.
    SHAPEFILE_UPLOAD_FOLDER = os.getenv('SHAPEFILE_UPLOAD_FOLDER', '/tmp/uploads')

    # The maximum number of characters allowed in a slug.
    SLUG_MAX_CHARACTERS = int(os.getenv('SLUG_MAX_CHARACTERS', '100'))

    # Single tenant environment mode - disables certain checks for user
    # permissions and tenant access. When enabled, all users are assumed to
    # have access to all tenants. Will probably cause bugs if enabled.
    IS_SINGLE_TENANT_ENVIRONMENT = env_truthy('IS_SINGLE_TENANT_ENVIRONMENT')

    # Whether to attempt to start a Keycloak Docker container for testing.
    USE_TEST_KEYCLOAK_DOCKER = env_truthy('USE_TEST_KEYCLOAK_DOCKER')
    # TODO: What does this do? Why is it required?
    USE_DOCKER_MOCK = env_truthy('USE_DOCKER_MOCK')

    # Timezone in Victoria, BC
    LEGISLATIVE_TIMEZONE = os.getenv('LEGISLATIVE_TIMEZONE', 'America/Vancouver')

    # Used to create the default tenant when setting up the database.
    # Also used for some test cases.
    DEFAULT_TENANT_SHORT_NAME = os.getenv('DEFAULT_TENANT_SHORT_NAME', 'DEFAULT')
    DEFAULT_TENANT_NAME = os.getenv('DEFAULT_TENANT_NAME', 'Default Tenant')
    DEFAULT_TENANT_DESCRIPTION = os.getenv(
        'DEFAULT_TENANT_DESCRIPTION',
        'The default tenant for DEP. Used for testing and development.'
    )

    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')

    # CORS_MAX_AGE defines the maximum age (in seconds) for Cross-Origin Resource Sharing (CORS) settings.
    # This value is used to indicate how long the results of a preflight request (OPTIONS) can be cached
    # by the client, reducing the frequency of preflight requests for the specified HTTP methods.
    # Adjust this value based on security considerations.
    CORS_MAX_AGE = os.getenv('CORS_MAX_AGE', None)  # Default: 0 seconds

    # If enabled, Emails will be send onlt to the internal email address set in constant INTERNAL_EMAIL_DOMAIN
    # such as `@gov.bc.ca` . Mainly used for dev and test environments.
    SEND_EMAIL_INTERNAL_ONLY = env_truthy('SEND_EMAIL_INTERNAL_ONLY', default=False)

    DEFAULT_LANGUAGE = os.getenv('DEFAULT_LANGUAGE', 'en')

    EPIC_CONFIG = {
        'ENABLED': env_truthy('EPIC_INTEGRATION_ENABLED'),
        'JWT_OIDC_ISSUER': os.getenv('EPIC_JWT_OIDC_ISSUER'),
        'URL': os.getenv('EPIC_URL'),
        'MILESTONE': os.getenv('EPIC_MILESTONE'),
        'KEYCLOAK_SERVICE_ACCOUNT_ID': os.getenv('EPIC_SERVICE_ACCOUNT_ID'),
        'KEYCLOAK_SERVICE_ACCOUNT_SECRET': os.getenv('EPIC_SERVICE_ACCOUNT_SECRET'),
        'KEYCLOAK_CLIENT_ID': os.getenv('EPIC_KC_CLIENT_ID'),
    }

    # Keycloak configuration
    KEYCLOAK_CONFIG = KC = {
        'BASE_URL': os.getenv('KEYCLOAK_BASE_URL', ''),
        'REALMNAME': os.getenv('KEYCLOAK_REALMNAME', 'standard'),
        'SERVICE_ACCOUNT_ID': (
            os.getenv('KEYCLOAK_ADMIN_CLIENT_ID')
            or os.getenv('ENGAGEMENT_ADMIN_CLIENT_ID')
        ),
        'SERVICE_ACCOUNT_SECRET': (
            os.getenv('KEYCLOAK_ADMIN_CLIENT_SECRET')
            or os.getenv('ENGAGEMENT_ADMIN_CLIENT_SECRET')
        ),
        'ADMIN_USERNAME': (
            os.getenv('KEYCLOAK_ADMIN_CLIENT_ID')
            or os.getenv('ENGAGEMENT_ADMIN_CLIENT_ID')
        ),
        'ADMIN_SECRET': (
            os.getenv('KEYCLOAK_ADMIN_CLIENT_SECRET')
            or os.getenv('ENGAGEMENT_ADMIN_CLIENT_SECRET')
        ),
        'CONNECT_TIMEOUT': int(os.getenv('KEYCLOAK_CONNECT_TIMEOUT', '60')),
    }

    # JWT OIDC Settings (for Keycloak)
    JWT_CONFIG = JWT = {
        'ISSUER': (
            _issuer := os.getenv(
                'JWT_OIDC_ISSUER',
                f'{KC["BASE_URL"]}/realms/{KC["REALMNAME"]}'
            )),
        'WELL_KNOWN_CONFIG': os.getenv(
            'JWT_OIDC_WELL_KNOWN_CONFIG',
            f'{_issuer}/.well-known/openid-configuration',
        ),
        'JWKS_URI': os.getenv('JWT_OIDC_JWKS_URI', f'{_issuer}/protocol/openid-connect/certs'),
        'ALGORITHMS': os.getenv('JWT_OIDC_ALGORITHMS', 'RS256'),
        'AUDIENCE': os.getenv('JWT_OIDC_AUDIENCE', 'account'),
        'CACHING_ENABLED': str(env_truthy('JWT_OIDC_CACHING_ENABLED', True)),
        'JWKS_CACHE_TIMEOUT': int(os.getenv('JWT_OIDC_JWKS_CACHE_TIMEOUT', '300')),
        'ROLE_CLAIM': os.getenv('JWT_OIDC_ROLE_CLAIM', 'client_roles'),
    }

    # PostgreSQL configuration
    DB_CONFIG = DB = {
        'USER': os.getenv('DATABASE_USERNAME', ''),
        'PASSWORD': os.getenv('DATABASE_PASSWORD', ''),
        'NAME': os.getenv('DATABASE_NAME', ''),
        'HOST': os.getenv('DATABASE_HOST', ''),
        'PORT': os.getenv('DATABASE_PORT', '5432'),
    }

    # Configuration for AWS S3, used for file storage
    S3_CONFIG = S3 = {
        'BUCKET': os.getenv('S3_BUCKET'),
        'ACCESS_KEY_ID': os.getenv('S3_ACCESS_KEY_ID'),
        'SECRET_ACCESS_KEY': os.getenv('S3_SECRET_ACCESS_KEY'),
        'HOST': os.getenv('S3_HOST'),
        'REGION': os.getenv('S3_REGION'),
        'SERVICE': os.getenv('S3_SERVICE'),
    }

    # The following are the paths used in the email templates. They do not
    # determine the actual paths used in the application. They are used to
    # construct the links in the emails sent to users.
    PATH_CONFIG = PATHS = {
        'SITE': os.getenv('SITE_URL'),
        'SURVEY': os.getenv('SURVEY_PATH', '/surveys/submit/{survey_id}/{token}/{lang}'),
        'USER_MANAGEMENT': os.getenv('USER_MANAGEMENT_PATH', '/manage/users/{id}/details'),
        'SUBMISSION': os.getenv(
            'SUBMISSION_PATH', '/engagements/{engagement_id}/edit/{token}/{lang}'
        ),
        'SUBSCRIBE': os.getenv(
            'SUBSCRIBE_PATH', '/engagements/{engagement_id}/subscribe/{token}/{lang}'
        ),
        'UNSUBSCRIBE': os.getenv(
            'UNSUBSCRIBE_PATH', '/engagements/{engagement_id}/unsubscribe/{participant_id}/{lang}'
        ),
        'ENGAGEMENT': {
            'VIEW': os.getenv('ENGAGEMENT_PATH', '/engagements/{engagement_id}/view/{lang}'),
            'SLUG': os.getenv('ENGAGEMENT_PATH_SLUG', '/{slug}/{lang}'),
            'DASHBOARD': os.getenv(
                'ENGAGEMENT_DASHBOARD_PATH', '/engagements/{engagement_id}/comments/public/{lang}'
            ),
            'DASHBOARD_SLUG': os.getenv(
                'ENGAGEMENT_DASHBOARD_PATH_SLUG', '/{slug}/comments/public/{lang}'
            ),
        }
    }

    # The API endpoint used to send emails to participants.
    NOTIFICATIONS_EMAIL_ENDPOINT = os.getenv('NOTIFICATIONS_EMAIL_ENDPOINT')
    # The secret key used for encryption when sending emails to participants.
    EMAIL_SECRET_KEY = os.getenv('EMAIL_SECRET_KEY', os.urandom(24))
    # Templates for sending users various notifications by email.
    EMAIL_TEMPLATES = {
        # The time of day when engagements get closed. This should match the
        # value in cron/config/crontab
        'CLOSING_TIME': os.getenv('ENGAGEMENT_END_TIME', '5 PM'),
        # This only applies when using GC Notify instead of CHES
        'FROM_ADDRESS': os.getenv('EMAIL_FROM_ADDRESS'),
        'ENVIRONMENT': os.getenv('EMAIL_ENVIRONMENT'),
        'SUBSCRIBE': {
            'ID': os.getenv('SUBSCRIBE_EMAIL_TEMPLATE_ID'),
            'SUBJECT': os.getenv('SUBSCRIBE_EMAIL_SUBJECT',
                                 'Confirm your subscription'),
        },
        'REJECTED': {
            'ID': os.getenv('REJECTED_EMAIL_TEMPLATE_ID'),
            'SUBJECT': os.getenv('REJECTED_EMAIL_SUBJECT',
                                 'Your comment on {engagement_name} needs to be edited'),
        },
        'CLOSED_ENGAGEMENT_REJECTED': {
            'ID': os.getenv('CLOSED_ENGAGEMENT_REJECTED_EMAIL_TEMPLATE_ID'),
            'SUBJECT': os.getenv('CLOSED_ENGAGEMENT_REJECTED_EMAIL_SUBJECT',
                                 'Your comment on {engagement_name} has been rejected'),
        },
        'VERIFICATION': {
            'ID': os.getenv('VERIFICATION_EMAIL_TEMPLATE_ID'),
            'SUBJECT': os.getenv('VERIFICATION_EMAIL_SUBJECT',
                                 '{engagement_name} - Access link'),
        },
        'SUBMISSION_RESPONSE': {
            'ID': os.getenv('SUBMISSION_RESPONSE_EMAIL_TEMPLATE_ID'),
            'SUBJECT': os.getenv('SUBMISSION_RESPONSE_EMAIL_SUBJECT',
                                 'DEP: Your feedback was successfully submitted'),
        },
        'CLOSEOUT': {
            'ID': os.getenv('CLOSEOUT_EMAIL_TEMPLATE_ID'),
            'SUBJECT': os.getenv('CLOSEOUT_EMAIL_SUBJECT',
                                 'The public commenting period for {engagement_name} is now closed.'),
        },
        'ACCESS_REQUEST': {
            'ID': os.getenv('ACCESS_REQUEST_EMAIL_TEMPLATE_ID'),
            'SUBJECT': os.getenv('ACCESS_REQUEST_EMAIL_SUBJECT',
                                 'DEP: New User Access Request'),
            'DEST_EMAIL_ADDRESS': os.getenv('ACCESS_REQUEST_EMAIL_ADDRESS'),
        }
    }

    # Configuration for the CDOGS API
    CDOGS_CONFIG = {
        'ACCESS_TOKEN': os.getenv('CDOGS_ACCESS_TOKEN'),
        'BASE_URL': os.getenv('CDOGS_BASE_URL'),
        'SERVICE_CLIENT': os.getenv('CDOGS_SERVICE_CLIENT'),
        'SERVICE_CLIENT_SECRET': os.getenv('CDOGS_SERVICE_CLIENT_SECRET'),
        'TOKEN_URL': os.getenv('CDOGS_TOKEN_URL'),
    }

    PROPAGATE_EXCEPTIONS = True


class DevConfig(Config):  # pylint: disable=too-few-public-methods
    """Dev Config."""

    # Default to using the debugger for development
    USE_DEBUG = env_truthy('USE_DEBUG', True)


class TestConfig(TestKeyConfig, Config):  # pylint: disable=too-few-public-methods
    """
    The configuration used when running the test suite.

    Extends TestKeyConfig, which contains some large constant keys that are used
    in the tests. It is stored in a separate file to avoid clutter.
    TestKeyConfig, in turn, extends the default Config class from above.
    """

    def __init__(self) -> None:
        """
        Initialize the object.

        This method is called when an object is created. It sets up the initial
        state of the object.

        """
        super().__init__()

        # Override Keycloak variables here
        self.KC['ADMIN_USERNAME'] = os.getenv(
            'KEYCLOAK_TEST_ADMIN_CLIENTID',
            self.KC['ADMIN_USERNAME']
        )
        self.KC['ADMIN_SECRET'] = os.getenv(
            'KEYCLOAK_TEST_ADMIN_SECRET',
            self.KC['ADMIN_SECRET']
        )
        self.KC['BASE_URL'] = os.getenv('KEYCLOAK_TEST_BASE_URL', self.KC['BASE_URL'])
        self.KC['REALMNAME'] = os.getenv('KEYCLOAK_TEST_REALMNAME', self.KC['REALMNAME'])

    # Propagate exceptions up to the test runner
    TESTING = env_truthy('TESTING', default=True)

    # explicitly disable the debugger; we want the tests to fail if an
    # unhandled exception occurs
    USE_DEBUG = False

    # JWT OIDC Settings for the test environment
    JWT_OIDC_TEST_MODE = True  # enables the test mode for flask_jwt_oidc
    JWT_OIDC_TEST_AUDIENCE = os.getenv('JWT_OIDC_TEST_AUDIENCE')
    JWT_OIDC_TEST_CLIENT_SECRET = os.getenv('JWT_OIDC_TEST_CLIENT_SECRET')
    JWT_OIDC_TEST_ISSUER = os.getenv('JWT_OIDC_TEST_ISSUER')
    JWT_OIDC_TEST_ALGORITHMS = os.getenv('JWT_OIDC_TEST_ALGORITHMS')

    # Override the DB config to use the test database, if one is configured
    DB_CONFIG = {
        'USER': os.getenv('DATABASE_TEST_USERNAME', Config.DB.get('USER')),
        'PASSWORD': os.getenv('DATABASE_TEST_PASSWORD', Config.DB.get('PASSWORD')),
        'NAME': os.getenv('DATABASE_TEST_NAME', Config.DB.get('NAME')),
        'HOST': os.getenv('DATABASE_TEST_HOST', Config.DB.get('HOST')),
        'PORT': os.getenv('DATABASE_TEST_PORT', Config.DB.get('PORT')),
    }
    IS_SINGLE_TENANT_ENVIRONMENT = False


class DockerConfig(Config):  # pylint: disable=too-few-public-methods
    """Configuration for deployment using Docker."""

    # Override DB config to use the docker database, if one is configured
    DB_CONFIG = {
        'USER': os.getenv('DATABASE_DOCKER_USERNAME', Config.DB.get('USER')),
        'PASSWORD': os.getenv('DATABASE_DOCKER_PASSWORD', Config.DB.get('PASSWORD')),
        'NAME': os.getenv('DATABASE_DOCKER_NAME', Config.DB.get('NAME')),
        'HOST': os.getenv('DATABASE_DOCKER_HOST', Config.DB.get('HOST')),
        'PORT': os.getenv('DATABASE_DOCKER_PORT', Config.DB.get('PORT')),
    }


class ProdConfig(Config):  # pylint: disable=too-few-public-methods
    """Production Config."""
