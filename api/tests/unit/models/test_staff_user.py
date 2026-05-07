"""Tests for the StaffUser model schema."""

from sqlalchemy import inspect

from api.models.db import db


def test_staff_users_table_does_not_include_tenant_id(session):  # pylint:disable=unused-argument
    """Assert the migrated staff_users table no longer includes tenant_id."""
    inspector = inspect(db.engine)
    columns = {column['name'] for column in inspector.get_columns('staff_users')}

    assert 'tenant_id' not in columns
