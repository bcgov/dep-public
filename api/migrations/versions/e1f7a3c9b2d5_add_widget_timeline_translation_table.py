"""add_widget_timeline_translation_table

Revision ID: e1f7a3c9b2d5
Revises: d8e4f2b1a9c3
Create Date: 2026-05-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1f7a3c9b2d5'
down_revision = 'd8e4f2b1a9c3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'widget_timeline_translation',
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('widget_timeline_id', sa.Integer(),
                  sa.ForeignKey('widget_timeline.id', ondelete='CASCADE'), nullable=False),
        sa.Column('language_id', sa.Integer(),
                  sa.ForeignKey('language.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.UniqueConstraint('widget_timeline_id', 'language_id', name='unique_widget_timeline_language'),
    )


def downgrade():
    op.drop_table('widget_timeline_translation')
