"""Helper for token decoding."""
from flask import current_app, g

from api.utils.roles import Role
from api.utils.user_context import UserContext, user_context


class TokenInfo:
    """Token info."""

    @staticmethod
    @user_context
    def get_id(**kwargs):
        """Get the user identifier."""
        try:
            user_from_context: UserContext = kwargs['user_context']
            return user_from_context.sub
        except AttributeError:
            return None

    @staticmethod
    def get_user_data():
        """Get the user data."""
        token_info = g.jwt_oidc_token_info
        user_data = {
            'external_id': token_info.get('sub', None),
            'first_name': token_info.get('given_name', None),
            'last_name': token_info.get('family_name', None),
            'email_address': token_info.get('email', None),
            'username': token_info.get('preferred_username', None),
            'identity_provider': token_info.get('identity_provider', ''),
            'roles': TokenInfo.get_user_roles(),
        }
        return user_data

    @staticmethod
    def get_user_roles():
        """Get the user roles from token."""
        if not hasattr(g, 'jwt_oidc_token_info') or not g.jwt_oidc_token_info:
            return []
        valid_roles = {item.value for item in Role}
        token_roles = current_app.config['JWT_ROLE_CALLBACK'](
            g.jwt_oidc_token_info)
        return valid_roles.intersection(token_roles)
