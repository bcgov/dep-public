"""Add is_featured flag to engagement.

Revision ID: c8d5e1f3a7b2
Revises: b7c41d9e2a15
Create Date: 2026-11-04 11:00:00.000000

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c8d5e1f3a7b2'
down_revision = 'b7c41d9e2a15'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'engagement',
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_column('engagement', 'is_featured')
