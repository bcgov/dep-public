"""Add wildcard settings to metadata taxa.

Revision ID: 9e18a4c02d7f
Revises: 00f6800e24fd
Create Date: 2026-10-27 09:54:43.000000

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = '9e18a4c02d7f'
down_revision = '00f6800e24fd'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'engagement_metadata_taxa',
        sa.Column('wildcard_enabled', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.add_column(
        'engagement_metadata_taxa',
        sa.Column('wildcard_name', sa.String(length=64), nullable=True),
    )
    # One-time upgrade existing required Region taxa to have wildcard enabled by default
    op.execute(
        "UPDATE engagement_metadata_taxa SET wildcard_enabled = true WHERE name = 'Region'"
        " AND is_required = true AND wildcard_name IS NULL;"
    )
    # One-time upgrade existing required Region taxa to have wildcard name set to 'Province-wide' by default
    op.execute(
        "UPDATE engagement_metadata_taxa SET wildcard_name = 'Province-wide' WHERE name = 'Region'"
        " AND is_required = true AND wildcard_name IS NULL;"
    )


def downgrade():
    op.drop_column('engagement_metadata_taxa', 'wildcard_name')
    op.drop_column('engagement_metadata_taxa', 'wildcard_enabled')
