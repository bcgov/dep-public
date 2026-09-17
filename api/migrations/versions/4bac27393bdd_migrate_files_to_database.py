"""Migrate files to use Uploaded File table

Revision ID: 4bac27393bdd
Revises: a518df3ac9e6
Create Date: 2026-09-08 16:26:12.436794

"""
import os
import uuid
from datetime import datetime, timezone
from mimetypes import MimeTypes

import requests
import sqlalchemy as sa
from alembic import op
from aws_requests_auth.aws_auth import AWSRequestsAuth
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '4bac27393bdd'
down_revision = 'a518df3ac9e6'
branch_labels = None
depends_on = None

s3_auth = AWSRequestsAuth(
    aws_access_key=os.getenv('S3_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY'),
    aws_host=os.getenv('S3_HOST'),
    aws_region=os.getenv('S3_REGION'),
    aws_service=os.getenv('S3_SERVICE')
)

bucket = os.getenv('S3_BUCKET')

mimetypes = MimeTypes()
# Old versions of mimetypes may not recognize certain file types, so add them manually
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/avif', '.avif')
mimetypes.add_type('application/msword', '.doc')
mimetypes.add_type(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx')
mimetypes.add_type('application/vnd.ms-excel', '.xls')
mimetypes.add_type(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx')


def lookup_file_by_name(file_name: str):
    if not s3_auth.aws_access_key or not s3_auth.aws_secret_access_key or not bucket:
        raise RuntimeError(
            "S3 bucket is not configured! Please set S3_AWS_ACCESS_KEY, S3_AWS_SECRET_KEY, and S3_BUCKET")
    if not file_name:
        return None, None, None

    request_url = f"https://{s3_auth.aws_host}/{bucket}/{file_name}"
    request_details = {"auth": s3_auth, "headers": {"Host": s3_auth.aws_host}}

    response = requests.head(request_url, **request_details)
    if response.status_code != 200:
        return None, None, None

    content_length = response.headers.get("Content-Length")
    content_length = int(content_length) if content_length else None

    if not content_length:
        # Retry with a GET request if the HEAD request didn't return a content length
        response = requests.get(request_url, **request_details)
        content_length = response.headers.get(
            "Content-Length", len(response.content))

    # Get file last modified time from the response headers
    last_modified = response.headers.get("Last-Modified")
    last_modified = datetime.strptime(
        last_modified, "%a, %d %b %Y %H:%M:%S %Z").replace(tzinfo=timezone.utc) if last_modified else None

    mimetype = response.headers.get("Content-Type")
    # If the object store doesn't know the correct MIME type, try to
    # automatically determine the MIME type based on the file extension
    mimetype_guess = mimetypes.guess_type(file_name)[0]
    # application/octet-stream is the default MIME type for unknown file types
    if mimetype == "application/octet-stream" and mimetype_guess:
        mimetype = mimetype_guess
    return content_length, mimetype, last_modified


def parse_uuid(input_id: str) -> uuid.UUID:
    # Parse ID back into a UUID
    try:
        _id = uuid.UUID(input_id)
    except ValueError:
        _id = uuid.uuid4()
    return _id


INSERT_STATEMENT = (
    """
    INSERT INTO uploaded_files (
        id, 
        tenant_id,
        filename,
        unique_filename,
        mimetype,
        path,
        size,
        status,
        uploaded_at,
        created_date,
        updated_date
    )
    VALUES (
        :id,
        :tenant_id,
        :filename,
        :unique_filename,
        :mimetype,
        :path,
        :size,
        :status,
        :uploaded_at,
        :created_date,
        :updated_date
    )
    RETURNING id
    """
)


def upgrade():  # NOSONAR - ignore S3776 (function complexity)
    op.add_column('engagement', sa.Column('banner_file_id',
                  postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('engagement_banner_file_id_fkey',
                          'engagement', 'uploaded_files', ['banner_file_id'], ['id'])
    op.add_column('widget_documents', sa.Column(
        'file_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('widget_documents_file_id_fkey',
                          'widget_documents', 'uploaded_files', ['file_id'], ['id'])
    op.add_column('widget_image', sa.Column(
        'file_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('widget_image_file_id_fkey',
                          'widget_image', 'uploaded_files', ['file_id'], ['id'])
    # Migrate existing file references to the new Uploaded File table
    connection = op.get_bind()
    # Engagements
    engagements = connection.execute(
        sa.text("SELECT id, tenant_id, banner_filename FROM engagement")).fetchall()
    for engagement in engagements:
        file_size, mimetype, last_modified = lookup_file_by_name(
            engagement.banner_filename)
        if file_size:
            _id, extension = os.path.splitext(engagement.banner_filename)
            result = connection.execute(
                sa.text(INSERT_STATEMENT),
                {
                    "id": str(parse_uuid(_id)),
                    "tenant_id": engagement.tenant_id,
                    "filename": "Hero Banner" + extension,
                    "unique_filename": engagement.banner_filename,
                    "mimetype": mimetype,
                    "path": f"/{engagement.banner_filename}",
                    "size": file_size,
                    "status": "UPLOADED",
                    "uploaded_at": last_modified or datetime.now(timezone.utc),
                    "created_date": datetime.now(timezone.utc),
                    "updated_date": datetime.now(timezone.utc)
                }
            )
            file_id = result.fetchone()[0]
            connection.execute(
                sa.text(
                    """
                    UPDATE engagement 
                    SET banner_file_id = :file_id 
                    WHERE id = :engagement_id
                    """
                ),
                {"file_id": file_id, "engagement_id": engagement.id}
            )
            connection.execute(
                sa.text(
                    """
                    INSERT INTO engagement_files (file_id, engagement_id, created_date, updated_date) 
                    VALUES (:file_id, :engagement_id, :created_date, :updated_date)
                    """
                ),
                {
                    "file_id": file_id,
                    "engagement_id": engagement.id,
                    "created_date": datetime.now(timezone.utc),
                    "updated_date": datetime.now(timezone.utc)
                }
            )
    # Document Widget Files
    widget_documents = connection.execute(sa.text(
        """
        SELECT
            widget_documents.id,
            widget_documents.title,
            widget_documents.url,
            widget_documents.widget_id,
            widget.engagement_id,
            engagement.tenant_id
        FROM widget_documents
        JOIN widget ON widget.id = widget_documents.widget_id
        JOIN engagement ON engagement.id = widget.engagement_id
        WHERE widget_documents.type = 'file'
        """
    )).fetchall()
    for widget_document in widget_documents:
        file_size, mimetype, last_modified = lookup_file_by_name(
            widget_document.url)
        if file_size:
            _id, extension = os.path.splitext(widget_document.url)
            result = connection.execute(
                sa.text(INSERT_STATEMENT),
                {
                    "id": str(parse_uuid(_id)),
                    "tenant_id": widget_document.tenant_id,
                    "filename": (widget_document.title or "Document") + extension,
                    "unique_filename": widget_document.url,
                    "mimetype": mimetype,
                    "path": f"/{widget_document.url}",
                    "size": file_size,
                    "status": "UPLOADED",
                    "uploaded_at": last_modified or datetime.now(timezone.utc),
                    "created_date": datetime.now(timezone.utc),
                    "updated_date": datetime.now(timezone.utc)
                }
            )
            file_id = result.fetchone()[0]
            connection.execute(
                sa.text(
                    """
                    UPDATE widget_documents
                    SET file_id = :file_id, url = NULL
                    WHERE id = :widget_document_id
                    """
                ),
                {"file_id": file_id, "widget_document_id": widget_document.id}
            )
            connection.execute(
                sa.text(
                    """
                    INSERT INTO engagement_files (file_id, engagement_id, widget_id, created_date, updated_date) 
                    VALUES (:file_id, :engagement_id, :widget_id, :created_date, :updated_date)
                    """
                ),
                {
                    "file_id": file_id,
                    "engagement_id": widget_document.engagement_id,
                    "widget_id": widget_document.widget_id,
                    "created_date": datetime.now(timezone.utc),
                    "updated_date": datetime.now(timezone.utc)
                }
            )
    # Image Widgets
    widget_images = connection.execute(sa.text(
        """
        SELECT id, widget_id, image_url
        FROM widget_image
        """
    )).fetchall()
    for widget_image in widget_images:
        widget = connection.execute(sa.text(
            """
            SELECT widget.id, widget.engagement_id, tenant_id, title
            FROM widget
            JOIN engagement ON engagement.id = widget.engagement_id
            WHERE widget.id = :widget_id
            """), {"widget_id": widget_image.widget_id}).fetchone()
        file_size, mimetype, last_modified = lookup_file_by_name(
            widget_image.image_url)
        if file_size:
            _id, extension = os.path.splitext(widget_image.image_url)
            result = connection.execute(
                sa.text(INSERT_STATEMENT),
                {
                    "id": str(parse_uuid(_id)),
                    "tenant_id": widget.tenant_id,
                    "filename": (widget.title or "Image Widget Content") + extension,
                    "unique_filename": widget_image.image_url,
                    "mimetype": mimetype,
                    "path": f"/{widget_image.image_url}",
                    "size": file_size,
                    "status": "UPLOADED" if file_size else "FAILED",
                    "uploaded_at": last_modified or datetime.now(timezone.utc),
                    "created_date": datetime.now(timezone.utc),
                    "updated_date": datetime.now(timezone.utc)
                }
            )
            file_id = result.fetchone()[0]
            connection.execute(
                sa.text(
                    """
                    UPDATE widget_image
                    SET file_id = :file_id 
                    WHERE id = :widget_image_id
                    """
                ),
                {"file_id": file_id, "widget_image_id": widget_image.id}
            )
            connection.execute(
                sa.text(
                    """
                    INSERT INTO engagement_files (file_id, engagement_id, widget_id, created_date, updated_date)
                    VALUES (:file_id, :engagement_id, :widget_id, :created_date, :updated_date)
                    """
                ),
                {
                    "file_id": file_id,
                    "engagement_id": widget.engagement_id,
                    "widget_id": widget.id,
                    "created_date": datetime.now(timezone.utc),
                    "updated_date": datetime.now(timezone.utc)
                }
            )
    # Make widget image column non-nullable after migrating data
    op.alter_column('widget_image', 'file_id', nullable=False)
    # Remove old file reference columns (except document, which still uses the url column)
    op.drop_column('engagement', 'banner_filename')
    op.drop_column('widget_image', 'image_url')


def downgrade():
    op.add_column('widget_image', sa.Column('image_url', sa.VARCHAR(
        length=255), autoincrement=False, nullable=True))
    op.add_column('engagement', sa.Column('banner_filename',
                  sa.VARCHAR(), autoincrement=False, nullable=True))
    # Repopulate image_url, url and banner_filename from the unique_filename field
    connection = op.get_bind()
    widget_images = connection.execute(sa.text(
        """
        SELECT widget_image.id, file_id, unique_filename
        FROM widget_image 
        JOIN uploaded_files ON widget_image.file_id = uploaded_files.id
        """
    )).fetchall()
    for widget_image in widget_images:
        connection.execute(
            sa.text(
                """
                UPDATE widget_image
                SET image_url = :image_url
                WHERE id = :widget_image_id
                """
            ),
            {"image_url": widget_image.unique_filename,
                "widget_image_id": widget_image.id}
        )
    engagement_banners = connection.execute(sa.text(
        "SELECT engagement.id, banner_file_id, unique_filename FROM engagement JOIN uploaded_files ON engagement.banner_file_id = uploaded_files.id")).fetchall()
    for engagement_banner in engagement_banners:
        connection.execute(
            sa.text(
                """
                UPDATE engagement
                SET banner_filename = :banner_filename
                WHERE id = :engagement_id
                """
            ),
            {"banner_filename": engagement_banner.unique_filename,
                "engagement_id": engagement_banner.id}
        )
    for widget_document in connection.execute(sa.text(
        """
        SELECT widget_documents.id, file_id, unique_filename
        FROM widget_documents 
        JOIN uploaded_files ON widget_documents.file_id = uploaded_files.id
        """
    )).fetchall():
        connection.execute(
            sa.text(
                """
                UPDATE widget_documents
                SET url = :url
                WHERE id = :widget_document_id
                """
            ),
            {"url": widget_document.unique_filename,
                "widget_document_id": widget_document.id}
        )
    op.execute("DELETE FROM engagement_files")
    op.drop_constraint('engagement_banner_file_id_fkey',
                       'engagement', type_='foreignkey')
    op.drop_constraint('widget_documents_file_id_fkey',
                       'widget_documents', type_='foreignkey')
    op.drop_constraint('widget_image_file_id_fkey',
                       'widget_image', type_='foreignkey')
    op.execute("DELETE FROM uploaded_files")
    op.alter_column('widget_image', 'file_id', nullable=False)
    op.drop_column('widget_image', 'file_id')
    op.drop_column('widget_documents', 'file_id')
    op.drop_column('engagement', 'banner_file_id')
