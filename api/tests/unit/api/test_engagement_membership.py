"""
Tests to verify the EngagementMembership API endpoints.

Test-Suite to ensure that the /engagements/{engagement_id}/memberships endpoint is working as expected.
"""
import json
from http import HTTPStatus
from unittest.mock import MagicMock, patch

from api.constants.membership_type import MembershipType
from api.exceptions.business_exception import BusinessException
from api.services.membership_service import MembershipService
from api.utils.enums import CompositeRoleId, ContentType, MembershipStatus
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_model, factory_membership_model, factory_staff_user_model,
    factory_user_group_membership_model)


memberships_url = '/api/engagements/{}/members'


def test_create_engagement_membership_team_member(client, jwt, session, setup_admin_user_and_claims):
    """Assert that a team member engagement membership can be created."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    factory_user_group_membership_model(str(staff_user.external_id), group_id=CompositeRoleId.TEAM_MEMBER.value)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    mock_add_user_to_role_keycloak_response = MagicMock()
    mock_add_user_to_role_keycloak_response.status_code = HTTPStatus.NO_CONTENT

    data = {'user_id': staff_user.external_id}

    rv = client.post(
        memberships_url.format(engagement.id),
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('engagement_id') == engagement.id
    assert rv.json.get('user_id') == staff_user.id
    assert rv.json.get('type') == MembershipType.TEAM_MEMBER
    assert rv.json.get('status') == MembershipStatus.ACTIVE.value

    with patch.object(MembershipService, 'create_membership',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR)):
        rv = client.post(
            memberships_url.format(engagement.id),
            data=json.dumps(data),
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_create_engagement_membership_reviewer(client, jwt, session, setup_admin_user_and_claims):
    """Assert that a reviewer engagement membership can be created."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    factory_user_group_membership_model(str(staff_user.external_id), group_id=CompositeRoleId.REVIEWER.value)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    mock_add_user_to_role_keycloak_response = MagicMock()
    mock_add_user_to_role_keycloak_response.status_code = HTTPStatus.NO_CONTENT

    data = {'user_id': staff_user.external_id}

    rv = client.post(
        memberships_url.format(engagement.id),
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK
    assert rv.json.get('engagement_id') == engagement.id
    assert rv.json.get('user_id') == staff_user.id
    assert rv.json.get('type') == MembershipType.REVIEWER
    assert rv.json.get('status') == MembershipStatus.ACTIVE.value


def test_create_engagement_membership_unauthorized(client, jwt, session,
                                                   setup_unprivileged_user_and_claims):
    """Assert that creating an engagement membership without proper authorization fails."""
    user, claims = setup_unprivileged_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    headers = factory_auth_header(jwt=jwt, claims=claims)
    data = {'user_id': staff_user.external_id}

    rv = client.post(
        memberships_url.format(engagement.id),
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.FORBIDDEN


def test_revoke_membership(client, jwt, session,
                           setup_admin_user_and_claims):
    """Test that a membership can be revoked."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    membership = factory_membership_model(user_id=staff_user.id, engagement_id=engagement.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    data = {
        'action': 'revoke'
    }

    rv = client.patch(
        f'/api/engagements/{engagement.id}/members/{membership.user_id}/status',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK


def test_reinstate_membership(client, jwt, session,
                              setup_admin_user_and_claims):
    """Test that a membership can be reinstated."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    membership = factory_membership_model(
        user_id=staff_user.id,
        engagement_id=engagement.id,
        status=MembershipStatus.REVOKED.value
    )
    headers = factory_auth_header(jwt=jwt, claims=claims)
    data = {
        'action': 'reinstate'
    }

    rv = client.patch(
        f'/api/engagements/{engagement.id}/members/{membership.user_id}/status',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK


def test_update_membership_status_invalid_action(client, jwt, session,
                                                 setup_admin_user_and_claims):
    """Test that an invalid action cannot be performed on a membership."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    membership = factory_membership_model(user_id=staff_user.id, engagement_id=engagement.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    data = {
        'action': 'invalid'
    }

    rv = client.patch(
        f'/api/engagements/{engagement.id}/members/{membership.user_id}/status',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.BAD_REQUEST


def test_revoke_already_revoked_membership(client, jwt, session,
                                           setup_admin_user_and_claims):
    """Test that an already revoked membership cannot be revoked again."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    membership = factory_membership_model(
        user_id=staff_user.id,
        engagement_id=engagement.id,
        status=MembershipStatus.REVOKED.value
    )
    headers = factory_auth_header(jwt=jwt, claims=claims)
    data = {
        'action': 'revoke'
    }

    rv = client.patch(
        f'/api/engagements/{engagement.id}/members/{membership.user_id}/status',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.BAD_REQUEST


def reinstate_already_active_membership(client, jwt, session,
                                        setup_admin_user_and_claims):
    """Test that an already active membership cannot be activated again."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    membership = factory_membership_model(user_id=staff_user.id, engagement_id=engagement.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)
    data = {
        'action': 'reinstate'
    }

    rv = client.patch(
        f'/api/engagements/{engagement.id}/members/{membership.user_id}/status',
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.BAD_REQUEST


def test_get_membership(client, jwt, session,
                        setup_admin_user_and_claims):
    """Test that a membership can be fetched."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    membership = factory_membership_model(user_id=staff_user.id, engagement_id=engagement.id)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    rv = client.get(
        f'/api/engagements/{engagement.id}/members',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK
    assert rv.json[0].get('engagement_id') == membership.engagement_id

    with patch.object(MembershipService, 'get_memberships',
                      side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR)):
        rv = client.get(
            f'/api/engagements/{engagement.id}/members',
            headers=headers,
            content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_get_all_engagements_by_user(client, jwt, session, setup_admin_user_and_claims):
    """Test that all engagements can be fetched for a member."""
    user, claims = setup_admin_user_and_claims
    engagement = factory_engagement_model()
    staff_user = factory_staff_user_model()
    factory_user_group_membership_model(str(staff_user.external_id), group_id=CompositeRoleId.TEAM_MEMBER.value)
    headers = factory_auth_header(jwt=jwt, claims=claims)

    mock_add_user_to_role_keycloak_response = MagicMock()
    mock_add_user_to_role_keycloak_response.status_code = HTTPStatus.NO_CONTENT

    data = {'user_id': staff_user.external_id}

    rv = client.post(
        memberships_url.format(engagement.id),
        data=json.dumps(data),
        headers=headers,
        content_type=ContentType.JSON.value
    )
    assert rv.status_code == HTTPStatus.OK

    rv = client.get(
        f'/api/engagements/all/members/{staff_user.external_id}',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK
    assert rv.json[0].get('engagement_id') == engagement.id
