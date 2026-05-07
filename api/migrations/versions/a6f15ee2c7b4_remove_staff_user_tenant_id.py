"""Remove redundant tenant_id from staff_users.

Revision ID: a6f15ee2c7b4
Revises: 9d2d16f5f3aa
Create Date: 2026-05-04 16:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a6f15ee2c7b4'
down_revision = '9d2d16f5f3aa'
branch_labels = None
depends_on = None


def upgrade():
    _drop_matching_foreign_keys('staff_users', 'tenant_id', 'tenant')
    with op.batch_alter_table('staff_users', schema=None) as batch_op:
        batch_op.drop_column('tenant_id')


def downgrade():
    with op.batch_alter_table('staff_users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tenant_id', sa.Integer(), nullable=True))

    op.create_foreign_key(None, 'staff_users', 'tenant', ['tenant_id'], ['id'])


def _drop_matching_foreign_keys(table_name, local_column, referred_table):
    """Drop FK constraints for a specific local column and referenced table."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    foreign_keys = inspector.get_foreign_keys(table_name)

    for foreign_key in foreign_keys:
        name = foreign_key.get('name')
        constrained_columns = foreign_key.get('constrained_columns') or []
        current_referred_table = foreign_key.get('referred_table')

        if (
            name
            and local_column in constrained_columns
            and current_referred_table == referred_table
        ):
            op.drop_constraint(name, table_name, type_='foreignkey')
