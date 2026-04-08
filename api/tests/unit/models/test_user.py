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
"""Tests for the Org model.

Test suite to ensure that the User model routines are working as expected.
"""

from faker import Faker

from api.models.staff_user import StaffUser as StaffUserModel


fake = Faker()


def test_user_creation(session):
    """Assert that an user can be created and fetched."""
    name = fake.name()
    user = StaffUserModel(id=2, first_name=name, external_id='2')
    session.add(user)
    session.commit()
    assert user.id is not None
    user_in_db = StaffUserModel.find_by_id(user.id)
    assert user_in_db.first_name == name


def test_get_user_by_external_id(session):
    """Assert that an user can be created and fetched."""
    name = fake.name()
    user = StaffUserModel(id=2, first_name=name, external_id='2')
    session.add(user)
    session.commit()
    assert user.id is not None
    user_in_db = StaffUserModel.get_user_by_external_id(user.external_id)
    assert user_in_db.first_name == name
    assert user_in_db.id == user.id


def test_create_user_from_dict(session):
    """Assert that an user can be created and fetched."""
    first_name = fake.name()
    external_id = str(fake.random_number(digits=5))
    user_dict = {
        'first_name': first_name,
        'middle_name': fake.name(),
        'last_name': fake.name(),
        'email_address': fake.email(),
        'external_id': external_id,
    }
    new_user = StaffUserModel.create_user(user_dict)
    assert type(new_user) is StaffUserModel
    assert new_user.external_id == external_id
    assert new_user.first_name == first_name


def test_update_user_from_dict_invalid_user(session):
    """Assert that update_user returns none."""
    invalid_id = fake.random_number(digits=5)
    new_user = StaffUserModel.update_user(invalid_id, {})
    assert new_user is None


def test_update_user_from_dict_valid(session):
    """Assert that an user can be created and fetched."""
    first_name = fake.name()
    external_id = str(fake.random_number(digits=5))
    old_email = fake.email()
    user_dict = {
        'first_name': first_name,
        'middle_name': fake.name(),
        'last_name': fake.name(),
        'email_address': old_email,
        'external_id': external_id,
    }
    new_user = StaffUserModel.create_user(user_dict)
    assert new_user.email_address == old_email
    new_email = fake.email()
    updated_user = StaffUserModel.update_user(new_user.id, {'email_address': new_email})
    assert updated_user.email_address == new_email

