"""Normalize object storage URLs to object keys.

Previously, widget_image.image_url, widget_documents.url (for uploaded files),
and tenant.hero_image_url stored full S3 URLs
(e.g. https://host/bucket/my-file.png). Going forward only the object key
(e.g. my-file.png) is stored; URLs are constructed dynamically at read time
using the S3_BUCKET / S3_HOST environment variables.

This migration strips the bucket+host prefix from any rows that still contain
a full URL, leaving only the object key.  The downgrade puts them back using
the values of those env vars at the time it is run.

Revision ID: 8e50e47b7d32
Revises: d756d0fe942c
Create Date: 2026-04-29 00:00:00.000000
"""
import os

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8e50e47b7d32'
down_revision = 'd756d0fe942c'
branch_labels = None
depends_on = None


def _url_prefix() -> str | None:
    """Return the full URL prefix that was previously prepended to object keys.

    Returns None when S3_HOST or S3_BUCKET are not configured, in which case
    nothing needs to be migrated (no full URLs could have been stored).
    """
    host = os.getenv('S3_HOST')
    bucket = os.getenv('S3_BUCKET')
    if not host or not bucket:
        return None
    return f'https://{host}/{bucket}/'


def upgrade():
    prefix = _url_prefix()
    if not prefix:
        return

    conn = op.get_bind()

    # ---- widget_image.image_url ----------------------------------------
    conn.execute(
        sa.text(
            """
            UPDATE widget_image
            SET    image_url = SUBSTRING(image_url FROM :prefix_len)
            WHERE  image_url LIKE :prefix_pattern
            """
        ),
        {
            'prefix_len': len(prefix) + 1,   # 1-based SUBSTRING index
            'prefix_pattern': prefix + '%',
        },
    )

    # ---- widget_documents.url (uploaded files only) --------------------
    conn.execute(
        sa.text(
            """
            UPDATE widget_documents
            SET    url = SUBSTRING(url FROM :prefix_len)
            WHERE  is_uploaded = TRUE
              AND  url LIKE :prefix_pattern
            """
        ),
        {
            'prefix_len': len(prefix) + 1,
            'prefix_pattern': prefix + '%',
        },
    )

    # ---- tenant.hero_image_url -----------------------------------------
    conn.execute(
        sa.text(
            """
            UPDATE tenant
            SET    hero_image_url = SUBSTRING(hero_image_url FROM :prefix_len)
            WHERE  hero_image_url LIKE :prefix_pattern
            """
        ),
        {
            'prefix_len': len(prefix) + 1,
            'prefix_pattern': prefix + '%',
        },
    )


def downgrade():
    prefix = _url_prefix()
    if not prefix:
        return

    conn = op.get_bind()

    # Prepend the prefix back to any rows that do NOT already start with https://
    conn.execute(
        sa.text(
            """
            UPDATE widget_image
            SET    image_url = :prefix || image_url
            WHERE  image_url IS NOT NULL
              AND  image_url NOT LIKE 'https://%'
              AND  image_url <> ''
            """
        ),
        {'prefix': prefix},
    )

    conn.execute(
        sa.text(
            """
            UPDATE widget_documents
            SET    url = :prefix || url
            WHERE  is_uploaded = TRUE
              AND  url IS NOT NULL
              AND  url NOT LIKE 'https://%'
              AND  url <> ''
            """
        ),
        {'prefix': prefix},
    )

    conn.execute(
        sa.text(
            """
            UPDATE tenant
            SET    hero_image_url = :prefix || hero_image_url
            WHERE  hero_image_url IS NOT NULL
              AND  hero_image_url NOT LIKE 'https://%'
              AND  hero_image_url <> ''
            """
        ),
        {'prefix': prefix},
    )
