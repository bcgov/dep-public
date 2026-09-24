"""Added deleted_at and deleted_by to uploaded_file model.

Also updated the comment for the tenant_id column.

Revision ID: 5a890e7514a2
Revises: 4bac27393bdd
Create Date: 2026-09-21 13:36:14.307310

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = '5a890e7514a2'
down_revision = '4bac27393bdd'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('uploaded_files', sa.Column('deleted_at', sa.DateTime(
    ), nullable=True, comment='Timestamp of when the file was deleted'))
    op.add_column('uploaded_files', sa.Column('deleted_by', sa.String(
        length=64), nullable=True, comment='IDIR identity of the user who deleted the file'))
    op.alter_column('uploaded_files', 'tenant_id',
                    existing_type=sa.INTEGER(),
                    comment='Tenant ID associated with the file',
                    existing_nullable=False)


def downgrade():
    op.alter_column('uploaded_files', 'tenant_id',
                    existing_type=sa.INTEGER(),
                    comment=None,
                    existing_comment='Tenant ID associated with the file',
                    existing_nullable=False)
    op.drop_column('uploaded_files', 'deleted_by')
    op.drop_column('uploaded_files', 'deleted_at')
