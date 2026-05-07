# Copyright © 2019 Province of British Columbia
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

"""Tests to verify the user membership operations.

Test-Suite to ensure that the user membership endpoints are working as expected.
"""
from http import HTTPStatus
from unittest.mock import patch

import pytest

from api.exceptions.business_exception import BusinessException
from api.models.membership import Membership as MembershipModel
from api.services.staff_user_membership_service import StaffUserMembershipService
from api.utils.enums import ContentType, MembershipStatus, UserStatus
from tests.utilities.factory_utils import (  # noqa: E501
    factory_auth_header, factory_engagement_model, factory_membership_model, factory_staff_user_model,
    factory_user_group_membership_model)


@pytest.mark.parametrize(
    'side_effect, expected_status',
    [
        (KeyError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
        (ValueError('Test error'), HTTPStatus.INTERNAL_SERVER_ERROR),
    ],
)
def test_reassign_user_reviewer_team_member(mocker, client, jwt, session, setup_admin_user_and_claims, side_effect, expected_status):  # noqa: E501
    """Assert that returns bad request if bad request body."""
    user = factory_staff_user_model()
    eng = factory_engagement_model()
    factory_user_group_membership_model(str(user.external_id))
    current_membership = factory_membership_model(user_id=user.id, engagement_id=eng.id)  # noqa: E501
    assert current_membership.status == MembershipStatus.ACTIVE.value

    assert user.status_id == UserStatus.ACTIVE.value
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    rv = client.put(
        f'/api/user/{user.id}/roles?role=TEAM_MEMBER', headers=headers, content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK

    memberships = MembershipModel.find_by_user_id(user.id)
    assert len(memberships) == 1
    assert memberships[0].status == MembershipStatus.REVOKED.value

    with patch.object(StaffUserMembershipService, 'reassign_user', side_effect=side_effect):
        rv = client.put(
            f'/api/user/{user.id}/roles?role=TEAM_MEMBER', headers=headers, content_type=ContentType.JSON.value
        )
    assert rv.status_code == expected_status

    with patch.object(
        StaffUserMembershipService,
        'reassign_user',
        side_effect=BusinessException('Test error', status_code=HTTPStatus.INTERNAL_SERVER_ERROR),
    ):
        rv = client.put(
            f'/api/user/{user.id}/roles?role=TEAM_MEMBER', headers=headers, content_type=ContentType.JSON.value
        )
    assert rv.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
