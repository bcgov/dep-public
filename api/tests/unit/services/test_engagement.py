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
"""Tests for the Engagement service.

Test suite to ensure that the Engagement service routines are working as expected.
"""
import pytest
from unittest.mock import patch
from werkzeug.exceptions import Forbidden

from api.constants.engagement_status import Status
from faker import Faker

from api.models import db
from api.models.engagement import Engagement
from api.utils.roles import Role
from api.services import authorization
from api.services.engagement_service import EngagementService
from tests.utilities.factory_scenarios import TestEngagementInfo, TestJwtClaims
from tests.utilities.factory_utils import (
    factory_engagement_model, factory_staff_user_model, factory_user_group_membership_model, patch_token_info,
    set_global_tenant)

fake = Faker()
date_format = '%Y-%m-%d'


def test_create_engagement(session, monkeypatch):  # pylint:disable=unused-argument
    """Assert that an Org can be created."""
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id), user.tenant_id)
    engagement_data = TestEngagementInfo.engagement1
    saved_engagament = EngagementService().create_engagement(engagement_data)
    # fetch the engagement with id and assert
    fetched_engagement = EngagementService().get_engagement(saved_engagament.id)
    assert fetched_engagement.get('id') == saved_engagament.id
    assert fetched_engagement.get('name') == engagement_data.get('name')
    assert fetched_engagement.get('description') == engagement_data.get('description')
    assert fetched_engagement.get('start_date')  # TODO address date format and assert
    assert fetched_engagement.get('end_date')


def test_create_engagement_with_survey_block(session, monkeypatch):  # pylint:disable=unused-argument
    """Assert that an Org can be created."""
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id), user.tenant_id)
    engagement_data = TestEngagementInfo.engagement2
    saved_engagament = EngagementService().create_engagement(engagement_data)
    # fetch the engagement with id and assert
    fetched_engagement = EngagementService().get_engagement(saved_engagament.id)
    assert fetched_engagement.get('id') == saved_engagament.id
    assert fetched_engagement.get('name') == engagement_data.get('name')
    assert fetched_engagement.get('description') == engagement_data.get('description')
    assert fetched_engagement.get('start_date')  # TODO address date format and assert
    assert fetched_engagement.get('end_date')


def test_patch_engagement(session, monkeypatch):  # pylint:disable=unused-argument
    """Assert that an Org can be created."""
    with patch.object(authorization, 'check_auth', return_value=True):
        saved_engagament_record = factory_engagement_model()
        saved_engagement_dict = {
            'id': saved_engagament_record.id,
            'name': saved_engagament_record.name,
            'start_date': saved_engagament_record.start_date,
            'end_date': saved_engagament_record.end_date,
            'description': saved_engagament_record.description,
            'created_date': saved_engagament_record.created_date,
            'status_id': saved_engagament_record.status_id,
        }

        engagement_edits = {
            'id': saved_engagament_record.id,
            'name': fake.name(),
            'start_date': fake.date(),
            'end_date': fake.date(),
            'description': fake.text(),
            'created_date': fake.date(),
        }

        updated_engagement_record = EngagementService().edit_engagement(engagement_edits)

        # Assert that only edited fields have changed
        assert updated_engagement_record.status_id == saved_engagement_dict.get('status_id')
        assert updated_engagement_record.name == engagement_edits.get('name')
        assert updated_engagement_record.start_date.strftime(date_format) == engagement_edits.get('start_date')
        assert updated_engagement_record.end_date.strftime(date_format) == engagement_edits.get('end_date')
        assert updated_engagement_record.description == engagement_edits.get('description')
        assert updated_engagement_record.created_date.strftime(date_format) == engagement_edits.get('created_date')


def test_delete_success(session, mocker, monkeypatch):
    """Assert that an engagement can be deleted."""
    monkeypatch.setenv('ENV', 'dev')
    eng = factory_engagement_model(status=Status.Draft.value)
    db.session.add(eng)
    db.session.commit()
    eid = eng.id
    mocker.patch.object(authorization, 'check_auth', return_value=True)
    result = EngagementService.delete(eid)
    assert Engagement.find_by_id(eid) is None
    assert isinstance(result, dict) and result.get('id') == eid


def test_delete_failure_engagement_published(session, mocker, monkeypatch):
    """Assert that an engagement cannot be deleted if it is published."""
    monkeypatch.setenv('ENV', 'dev')
    eng = factory_engagement_model(status=Status.Published.value)
    db.session.add(eng)
    db.session.commit()
    eid = eng.id
    mocker.patch.object(authorization, 'check_auth', return_value=True)
    try:
        EngagementService.delete(eid)
        assert False, 'Expected ValueError was not raised'
    except ValueError as err:
        assert str(err) == 'Cannot delete an engagement that is published'


def test_delete_failure_production_environment(db, monkeypatch, mocker):
    """Engagement delete should be blocked in production (403 Forbidden)."""
    monkeypatch.setenv('ENV', 'prod')
    mocker.patch.object(authorization, 'check_auth', return_value=True)

    with pytest.raises(Forbidden) as excinfo:
        EngagementService.delete(123)  # Does not get to db, value irrelevant

    desc = str(excinfo.value.description)
    expected = ("You don't have the permission to access the requested resource. "
                'It is either read-protected or not readable by the server.')

    assert expected in desc


def test_get_scope_options_super_admin_unrestricted():
    """Assert that super admin can list all tenant engagements."""
    scope_options = EngagementService._get_scope_options({Role.SUPER_ADMIN.value}, has_team_access=False)

    assert scope_options.restricted is False
    assert scope_options.include_assigned is False


def test_get_scope_options_super_admin_overrides_team_access():
    """Assert super admin remains unrestricted even when team access filter is requested."""
    scope_options = EngagementService._get_scope_options({Role.SUPER_ADMIN.value}, has_team_access=True)

    assert scope_options.restricted is False
