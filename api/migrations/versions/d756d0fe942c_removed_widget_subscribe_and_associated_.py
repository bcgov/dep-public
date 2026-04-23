"""Removed widget_subscribe and associated tables.

Revision ID: d756d0fe942c
Revises: c39ccb80cb0b
Create Date: 2026-04-21 14:16:11.129167

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd756d0fe942c'
down_revision = 'c39ccb80cb0b'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('subscribe_item_translation')
    op.drop_table('subscribe_item')
    op.drop_table('widget_subscribe')


def downgrade():
    op.create_table('widget_subscribe',
    sa.Column('created_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
    sa.Column('updated_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('id', sa.INTEGER(), server_default=sa.text("nextval('widget_subscribe_id_seq'::regclass)"), autoincrement=True, nullable=False),
    sa.Column('type', postgresql.ENUM('EMAIL_LIST', 'SIGN_UP', name='subscribetypes'), autoincrement=False, nullable=False),
    sa.Column('sort_index', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('widget_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('created_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.Column('updated_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['widget_id'], ['widget.id'], name='widget_subscribe_widget_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='widget_subscribe_pkey'),
    postgresql_ignore_search_path=False
    )
    op.create_table('subscribe_item',
    sa.Column('created_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
    sa.Column('updated_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('id', sa.INTEGER(), server_default=sa.text("nextval('subscribe_item_id_seq'::regclass)"), autoincrement=True, nullable=False),
    sa.Column('description', sa.VARCHAR(length=500), autoincrement=False, nullable=True),
    sa.Column('rich_description', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('call_to_action_text', sa.VARCHAR(length=25), autoincrement=False, nullable=True),
    sa.Column('call_to_action_type', sa.VARCHAR(length=25), autoincrement=False, nullable=False),
    sa.Column('sort_index', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('widget_subscribe_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('created_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.Column('updated_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['widget_subscribe_id'], ['widget_subscribe.id'], name='subscribe_item_widget_subscribe_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='subscribe_item_pkey'),
    postgresql_ignore_search_path=False
    )
    op.create_table('subscribe_item_translation',
    sa.Column('created_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
    sa.Column('updated_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('language_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('subscribe_item_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('description', sa.VARCHAR(length=500), autoincrement=False, nullable=True),
    sa.Column('rich_description', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('call_to_action_text', sa.VARCHAR(length=25), autoincrement=False, nullable=True),
    sa.Column('created_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.Column('updated_by', sa.VARCHAR(length=50), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['language_id'], ['language.id'], name='subscribe_item_translation_language_id_fkey'),
    sa.ForeignKeyConstraint(['subscribe_item_id'], ['subscribe_item.id'], name='subscribe_item_translation_subscribe_item_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='subscribe_item_translation_pkey'),
    sa.UniqueConstraint('subscribe_item_id', 'language_id', name='_subscribe_item_language_uc')
    )
