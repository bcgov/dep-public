"""Add filter scope to metadata taxa.

Revision ID: b7c41d9e2a15
Revises: 9e18a4c02d7f
Create Date: 2026-10-28 09:00:00.000000

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'b7c41d9e2a15'
down_revision = '9e18a4c02d7f'
branch_labels = None
depends_on = None


def upgrade():
    # Existing filters were only ever offered on the public search, so they keep the 'public' scope.
    op.add_column(
        'engagement_metadata_taxa',
        sa.Column('filter_scope', sa.String(length=16), nullable=False, server_default='public'),
    )


def downgrade():
    op.drop_column('engagement_metadata_taxa', 'filter_scope')
