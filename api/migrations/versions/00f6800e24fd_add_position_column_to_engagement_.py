"""Add position column to engagement metadata.

Revision ID: 00f6800e24fd
Revises: aa69ec09c68a
Create Date: 2026-10-23 15:29:41.223372

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '00f6800e24fd'
down_revision = 'aa69ec09c68a'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('engagement_metadata', sa.Column('position', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('engagement_metadata', 'position')
