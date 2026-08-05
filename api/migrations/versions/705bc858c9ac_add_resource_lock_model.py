"""add resource lock model

Revision ID: 705bc858c9ac
Revises: e572f7d709c5
Create Date: 2026-08-04 11:13:15.284614

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '705bc858c9ac'
down_revision = 'e572f7d709c5'
branch_labels = None
depends_on = None

ACTIVE_LOCK_WHERE = 'released_at IS NULL'


def upgrade():
    op.create_table('resource_lock',
                    sa.Column('created_date', sa.DateTime(), nullable=False),
                    sa.Column('updated_date', sa.DateTime(), nullable=True),
                    sa.Column('id', sa.Integer(),
                              autoincrement=True, nullable=False),
                    sa.Column('lock_scope', sa.String(
                        length=255), nullable=False),
                    sa.Column('resource_type', sa.String(
                        length=50), nullable=False),
                    sa.Column('resource_id', sa.Integer(), nullable=False),
                    sa.Column('section_key', sa.String(
                        length=100), nullable=True),
                    sa.Column('language_id', sa.Integer(), nullable=True),
                    sa.Column('owner_user_sub', sa.String(
                        length=50), nullable=False),
                    sa.Column('owner_display_name', sa.String(
                        length=255), nullable=True),
                    sa.Column('owner_session_id',
                              postgresql.UUID(), nullable=False),
                    sa.Column('lock_token', postgresql.UUID(), nullable=False),
                    sa.Column('acquired_at', sa.DateTime(), nullable=False),
                    sa.Column('heartbeat_at', sa.DateTime(), nullable=False),
                    sa.Column('expires_at', sa.DateTime(), nullable=False),
                    sa.Column('released_at', sa.DateTime(), nullable=True),
                    sa.Column('release_reason', sa.String(
                        length=32), nullable=True),
                    sa.Column('created_by', sa.String(
                        length=50), nullable=True),
                    sa.Column('updated_by', sa.String(
                        length=50), nullable=True),
                    sa.CheckConstraint("release_reason IS NULL OR release_reason IN ('explicit','expired_takeover','logout','navigation','force_takeover')",
                                       name='ck_resource_lock_release_reason'),
                    sa.CheckConstraint('expires_at >= acquired_at',
                                       name='ck_resource_lock_expires_ge_acquired'),
                    sa.CheckConstraint('heartbeat_at >= acquired_at',
                                       name='ck_resource_lock_heartbeat_ge_acquired'),
                    sa.CheckConstraint('released_at IS NULL OR released_at >= acquired_at',
                                       name='ck_resource_lock_released_ge_acquired'),
                    sa.ForeignKeyConstraint(
                        ['language_id'], ['language.id'], ondelete='SET NULL'),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('lock_token')
                    )
    op.create_index('ix_resource_lock_active_expires_at', 'resource_lock', [
                    'expires_at'], unique=False, postgresql_where=sa.text(ACTIVE_LOCK_WHERE))
    op.create_index('ix_resource_lock_active_resource', 'resource_lock', [
                    'resource_type', 'resource_id'], unique=False, postgresql_where=sa.text(ACTIVE_LOCK_WHERE))
    op.create_index('ix_resource_lock_owner_released', 'resource_lock', [
                    'owner_user_sub', 'released_at'], unique=False)
    op.create_index('uix_resource_lock_active_scope', 'resource_lock', [
                    'lock_scope'], unique=True, postgresql_where=sa.text(ACTIVE_LOCK_WHERE))


def downgrade():
    op.drop_index('uix_resource_lock_active_scope', table_name='resource_lock',
                  postgresql_where=sa.text(ACTIVE_LOCK_WHERE))
    op.drop_index('ix_resource_lock_owner_released',
                  table_name='resource_lock')
    op.drop_index('ix_resource_lock_active_resource',
                  table_name='resource_lock', postgresql_where=sa.text(ACTIVE_LOCK_WHERE))
    op.drop_index('ix_resource_lock_active_expires_at',
                  table_name='resource_lock', postgresql_where=sa.text(ACTIVE_LOCK_WHERE))
    op.drop_table('resource_lock')
