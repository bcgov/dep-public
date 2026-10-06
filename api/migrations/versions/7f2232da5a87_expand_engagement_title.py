"""Increase engagement title length from 50 to 75 characters.

Revision ID: 7f2232da5a87
Revises: 5a890e7514a2
Create Date: 2026-10-02 11:34:29.461168

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '7f2232da5a87'
down_revision = '5a890e7514a2'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('engagement', 'name',
                    existing_type=sa.VARCHAR(length=50),
                    type_=sa.String(length=75),
                    existing_nullable=True)
    op.alter_column('engagement_translation', 'name',
                    existing_type=sa.VARCHAR(length=50),
                    type_=sa.String(length=75),
                    existing_nullable=True)


def downgrade():
    op.alter_column('engagement_translation', 'name',
                    existing_type=sa.String(length=75),
                    type_=sa.VARCHAR(length=50),
                    existing_nullable=True)
    op.alter_column('engagement', 'name',
                    existing_type=sa.String(length=75),
                    type_=sa.VARCHAR(length=50),
                    existing_nullable=True)
