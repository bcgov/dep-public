"""Add Uploaded File table and association table for engagement files

Revision ID: a518df3ac9e6
Revises: 705bc858c9ac
Create Date: 2026-09-08 16:24:47.093835

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a518df3ac9e6'
down_revision = '705bc858c9ac'
branch_labels = None
depends_on = None


def upgrade():
    status_enum = sa.Enum('PENDING', 'UPLOADED', 'FAILED', name='uploadedfilestatus')

    op.create_table('uploaded_files',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, comment='UUID from object storage'),
    sa.Column('tenant_id', postgresql.INTEGER, nullable=False),
    sa.Column('unique_filename', sa.String(), nullable=False, comment='UUID plus file extension'),
    sa.Column('filename', sa.String(), nullable=False, comment='Human-readable filename'),
    sa.Column('mimetype', sa.String(length=256), nullable=False, comment='MIME type of the file (https://www.iana.org/assignments/media-types/)'),
    sa.Column('path', sa.String(), nullable=False, comment='Path to the file in object storage (including the filename)'),
    sa.Column('size', sa.Integer(), nullable=False, comment='Size of the file in bytes'),
    sa.Column('status', status_enum, nullable=False, comment='Status of the uploaded file'),
    sa.Column('uploaded_at', sa.DateTime(), nullable=True, comment='Timestamp of when the file was uploaded'),

    sa.Column('created_date', sa.DateTime(), nullable=False),
    sa.Column('updated_date', sa.DateTime(), nullable=True),
    sa.Column('created_by', sa.String(length=50), nullable=True),
    sa.Column('updated_by', sa.String(length=50), nullable=True),

    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('unique_filename'),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id']),
    )

    op.create_table('engagement_files',
    sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
    sa.Column('file_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('uploaded_files.id'), nullable=False, comment='Associated uploaded file ID'),
    sa.Column('engagement_id', postgresql.INTEGER, sa.ForeignKey('engagement.id'), nullable=False, comment='Associated engagement ID'),
    sa.Column('widget_id', postgresql.INTEGER, sa.ForeignKey('widget.id'), nullable=True, comment='Associated widget ID, if applicable'),
    sa.Column('removed_at', sa.DateTime(), nullable=True, comment='Timestamp when the file was removed, if applicable'),
    sa.Column('removed_by', sa.String(length=64), nullable=True, comment='User who removed the file, if applicable'),

    sa.Column('created_date', sa.DateTime(), nullable=False),
    sa.Column('updated_date', sa.DateTime(), nullable=True),
    sa.Column('created_by', sa.String(length=50), nullable=True),
    sa.Column('updated_by', sa.String(length=50), nullable=True),
    
    sa.PrimaryKeyConstraint('id'),
    sa.ForeignKeyConstraint(['file_id'], ['uploaded_files.id']),
    sa.ForeignKeyConstraint(['engagement_id'], ['engagement.id']),
    sa.ForeignKeyConstraint(['widget_id'], ['widget.id']),
    )



def downgrade():
    op.drop_table('engagement_files')
    op.drop_table('uploaded_files')
    op.execute("DROP TYPE IF EXISTS uploadedfilestatus")
