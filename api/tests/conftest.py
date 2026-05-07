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
"""Common setup and fixtures for the pytest suite used by this service."""
import time
from random import random

import copy
import pytest
from flask_migrate import Migrate, upgrade
from sqlalchemy import event, text
import sqlalchemy.orm

from api import create_app, setup_jwt_manager
from api.auth import jwt as _jwt
from api.models import db as _db
from tests.utilities.factory_utils import factory_staff_user_model, factory_user_group_membership_model
from tests.utilities.factory_scenarios import TestJwtClaims, TestUserInfo
from api.utils.enums import CompositeRoleId


@pytest.fixture(scope='session')
def app():
    """Return a session-wide application configured in TEST mode."""
    _app = create_app('testing')

    return _app


@pytest.fixture(scope='function')
def app_request():
    """Return a session-wide application configured in TEST mode."""
    _app = create_app('testing')

    return _app


@pytest.fixture()
def notify_mock(monkeypatch):
    """Mock send_email."""
    monkeypatch.setattr('api.utils.notification.send_email', lambda *args, **kwargs: None)


@pytest.fixture(scope='session')
def client(app):  # pylint: disable=redefined-outer-name
    """Return a session-wide Flask test client."""
    return app.test_client()


@pytest.fixture(scope='session')
def jwt():
    """Return a session-wide jwt manager."""
    return _jwt


@pytest.fixture(scope='session')
def client_ctx(app):  # pylint: disable=redefined-outer-name
    """Return session-wide Flask test client."""
    with app.test_client() as _client:
        yield _client


@pytest.fixture(scope='session')
def db(app):  # pylint: disable=redefined-outer-name, invalid-name
    """Return a session-wide initialised database.

    Drops schema, and recreate.
    """
    with app.app_context():
        drop_schema_sql = """DROP SCHEMA public CASCADE;
                             CREATE SCHEMA public;
                             GRANT ALL ON SCHEMA public TO postgres;
                             GRANT ALL ON SCHEMA public TO public;
                          """

        sess = _db.session()
        sess.execute(drop_schema_sql)
        sess.commit()

        # ############################################
        # There are 2 approaches, an empty database, or the same one that the app will use
        #     create the tables
        #     _db.create_all()
        # or
        # Use Alembic to load all of the DB revisions including supporting lookup data
        # This is the path we'll use in auth_api!!

        # even though this isn't referenced directly, it sets up the internal configs that upgrade needs
        Migrate(app, _db)
        upgrade()

        return _db


@pytest.fixture(scope='function')
def session(app, db):  # pylint: disable=redefined-outer-name, invalid-name
    """Return a function-scoped session."""
    with app.app_context():
        conn = db.engine.connect()
        txn = conn.begin()

        session_factory = sqlalchemy.orm.sessionmaker(bind=conn)
        sess = sqlalchemy.orm.scoped_session(session_factory)

        # establish  a SAVEPOINT just before beginning the test
        # (http://docs.sqlalchemy.org/en/latest/orm/session_transaction.html#using-savepoint)
        sess.begin_nested()

        @event.listens_for(sess(), 'after_transaction_end')
        def restart_savepoint(sess2, trans):  # pylint: disable=unused-variable
            # Detecting whether this is indeed the nested transaction of the test
            if trans.nested and not trans._parent.nested:  # pylint: disable=protected-access
                # Handle where test DOESN'T session.commit(),
                sess2.expire_all()
                sess.begin_nested()

        db.session = sess

        sql = text('select 1')
        sess.execute(sql)

        yield sess

        # Cleanup
        sess.remove()
        # This instruction rollsback any commit that were executed in the tests.
        txn.rollback()
        conn.close()


@pytest.fixture(scope='function')
def client_id():
    """Return a unique client_id that can be used in tests."""
    _id = random.SystemRandom().getrandbits(0x58)
    #     _id = (base64.urlsafe_b64encode(uuid.uuid4().bytes)).replace('=', '')

    return f'client-{_id}'


@pytest.fixture(scope='session', autouse=True)
def auto(docker_services, app):
    """Spin up a keycloak instance and initialize jwt."""
    if app.config['USE_TEST_KEYCLOAK_DOCKER']:
        docker_services.start('keycloak')
        docker_services.wait_for_service('keycloak', 8081)

    setup_jwt_manager(app, _jwt)

    if app.config['USE_DOCKER_MOCK']:
        docker_services.start('proxy')
        time.sleep(10)


@pytest.fixture(scope='session')
def docker_compose_files(pytestconfig):
    """Get the docker-compose.yml absolute path."""
    import os
    return [
        os.path.join(str(pytestconfig.rootdir), 'tests/docker', 'docker-compose.yml')
    ]


@pytest.fixture()
def auth_mock(monkeypatch):
    """Mock check_auth."""
    pass


@pytest.fixture
def setup_super_admin_user_and_claims(jwt):
    """Set up a user with the super-admin role."""
    staff_info = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_info)
    factory_user_group_membership_model(str(user.external_id))
    claims = copy.deepcopy(TestJwtClaims.system_admin_role.value)
    claims['sub'] = str(user.external_id)

    return user, claims


# Fixture for setting up user and claims for an admin user
@pytest.fixture
def setup_admin_user_and_claims(jwt):
    """Set up a user with the staff admin role."""
    staff_info = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_info)
    factory_user_group_membership_model(str(user.external_id))
    claims = copy.deepcopy(TestJwtClaims.staff_admin_role.value)
    claims['sub'] = str(user.external_id)

    return user, claims


# Fixture for setting up user and claims for a reviewer
@pytest.fixture
def setup_reviewer_and_claims(jwt):
    """Set up a user with the reviewer role."""
    staff_info = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_info)
    factory_user_group_membership_model(str(user.external_id), group_id=CompositeRoleId.REVIEWER.value)
    claims = copy.deepcopy(TestJwtClaims.reviewer_role.value)
    claims['sub'] = str(user.external_id)

    return user, claims


# Fixture for setting up user and claims for a team member
@pytest.fixture
def setup_team_member_and_claims(jwt):
    """Set up a user with the team member role."""
    staff_info = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_info)
    factory_user_group_membership_model(str(user.external_id), group_id=CompositeRoleId.TEAM_MEMBER.value)
    claims = copy.deepcopy(TestJwtClaims.team_member_role.value)
    claims['sub'] = str(user.external_id)

    return user, claims


# Fixture for setting up user and claims for a user with no role
@pytest.fixture
def setup_unprivileged_user_and_claims(jwt):
    """Set up a user with the no role."""
    staff_info = dict(TestUserInfo.user_staff_1)
    user = factory_staff_user_model(user_info=staff_info)
    claims = copy.deepcopy(TestJwtClaims.no_role.value)
    claims['sub'] = str(user.external_id)

    return user, claims
