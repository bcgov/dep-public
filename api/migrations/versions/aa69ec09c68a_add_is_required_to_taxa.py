"""Add is_required column to engagement_metadata_taxa table.

Revision ID: aa69ec09c68a
Revises: 7f2232da5a87
Create Date: 2026-10-05 14:54:53.868073

"""
import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = 'aa69ec09c68a'
down_revision = '7f2232da5a87'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('engagement_metadata_taxa', sa.Column('is_required', sa.Boolean(), nullable=False, server_default=sa.false()))
    # Mark existing 'Region' and 'Category' taxa as required
    op.execute(
        "UPDATE engagement_metadata_taxa SET is_required = TRUE WHERE name IN ('Region', 'Category');"
        "UPDATE engagement_metadata_taxa SET data_type = 'geo_area' WHERE name = 'Region';"
        "UPDATE engagement_metadata_taxa SET data_type = 'text' WHERE name = 'Category';"
    )
    # For each tenant, create 'Region' and 'Category' taxa if they do not exist
    tenant_entries = op.get_bind().execute("SELECT id FROM tenant").fetchall()
    for tenant in tenant_entries:
        tenant_id = tenant[0]
        for required_taxon in (['Region', 'geo_area', 'chips_all'], ['Category', 'text', 'chips_any']):
            next_available_position = op.get_bind().execute(
                f"SELECT COALESCE(MAX(position), 0) + 1 FROM engagement_metadata_taxa WHERE tenant_id = '{tenant_id}'"
            ).scalar()
            op.execute(
                f"INSERT INTO engagement_metadata_taxa (name, data_type, filter_type, is_required, tenant_id, freeform, include_freeform, position, created_date) "
                f"SELECT '{required_taxon[0]}', '{required_taxon[1]}', '{required_taxon[2]}', TRUE, '{tenant_id}', FALSE, FALSE, {next_available_position}, NOW() "
                f"WHERE NOT EXISTS (SELECT 1 FROM engagement_metadata_taxa WHERE name = '{required_taxon[0]}' AND tenant_id = '{tenant_id}')"
            )

def downgrade():
    op.drop_column('engagement_metadata_taxa', 'is_required')