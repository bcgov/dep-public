"""Remove CAC form table.

Revision ID: c39ccb80cb0b
Revises: 59138db76b10
Create Date: 2026-04-08 17:30:30.126643

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c39ccb80cb0b'
down_revision = '59138db76b10'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('cac_form')

def downgrade():
    op.create_table('cac_form',
    sa.Column('created_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
    sa.Column('updated_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('engagement_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('tenant_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('understand', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('terms_of_reference', sa.BOOLEAN(), autoincrement=False, nullable=False),
    sa.Column('first_name', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('last_name', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('city', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('email', sa.VARCHAR(length=50), autoincrement=False, nullable=False),
    sa.Column('created_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.Column('updated_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['engagement_id'], ['engagement.id'], name='cac_form_engagement_id_fkey', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], name='cac_form_tenant_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='cac_form_pkey')
    )
