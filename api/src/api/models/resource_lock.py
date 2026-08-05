"""Resource lock model class.

Generic lock table used to coordinate editing access across resources and sections.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import CheckConstraint, Index, and_, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from api.utils.datetime import utc_now

from .base_model import BaseModel
from .db import db

ACTIVE_LOCK_WHERE = 'released_at IS NULL'
SQL_QUOTE = chr(39)


class ResourceLock(BaseModel):
    """Definition of the resource lock entity."""

    __tablename__ = 'resource_lock'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    lock_scope = db.Column(db.String(255), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.Integer, nullable=False)
    section_key = db.Column(db.String(100), nullable=True)
    language_id = db.Column(db.Integer, db.ForeignKey(
        'language.id', ondelete='SET NULL'), nullable=True)

    owner_user_sub = db.Column(db.String(50), nullable=False)
    owner_display_name = db.Column(db.String(255), nullable=True)
    # Store as a native Postgres UUID while keeping Python value handling string-compatible.
    owner_session_id = db.Column(PG_UUID(as_uuid=False), nullable=False)

    # Store as a native Postgres UUID while keeping Python value handling string-compatible.
    lock_token = db.Column(PG_UUID(as_uuid=False), unique=True, nullable=False)

    acquired_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    heartbeat_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    released_at = db.Column(db.DateTime, nullable=True)
    release_reason = db.Column(db.String(32), nullable=True)

    __table_args__ = (
        # Basic integrity constraints.
        CheckConstraint(
            'heartbeat_at >= acquired_at',
            name='ck_resource_lock_heartbeat_ge_acquired',
        ),
        CheckConstraint(
            'expires_at >= acquired_at',
            name='ck_resource_lock_expires_ge_acquired',
        ),
        CheckConstraint(
            'released_at IS NULL OR released_at >= acquired_at',
            name='ck_resource_lock_released_ge_acquired',
        ),
        CheckConstraint(
            (
                'release_reason IS NULL OR release_reason IN '
                f'({SQL_QUOTE}explicit{SQL_QUOTE},'
                f'{SQL_QUOTE}expired_takeover{SQL_QUOTE},'
                f'{SQL_QUOTE}logout{SQL_QUOTE},'
                f'{SQL_QUOTE}navigation{SQL_QUOTE},'
                f'{SQL_QUOTE}force_takeover{SQL_QUOTE})'
            ),
            name='ck_resource_lock_release_reason',
        ),
        # A scope can have at most one active lock.
        Index(
            'uix_resource_lock_active_scope',
            'lock_scope',
            unique=True,
            postgresql_where=text(ACTIVE_LOCK_WHERE),
        ),
        # Supports lock status reads by resource in editor screens.
        Index(
            'ix_resource_lock_active_resource',
            'resource_type',
            'resource_id',
            postgresql_where=text(ACTIVE_LOCK_WHERE),
        ),
        # Enables efficient queries for active locks that are near/at expiry.
        Index(
            'ix_resource_lock_active_expires_at',
            'expires_at',
            postgresql_where=text(ACTIVE_LOCK_WHERE),
        ),
        # Enables listing lock activity for a specific user.
        Index('ix_resource_lock_owner_released',
              'owner_user_sub', 'released_at'),
    )

    @classmethod
    def find_active_by_scope(cls, lock_scope: str) -> Optional['ResourceLock']:
        """Return the active lock for a scope, if one exists."""
        return cls.query.filter_by(lock_scope=lock_scope, released_at=None).first()

    @classmethod
    def find_active_by_resource(cls, resource_type: str, resource_id: int) -> list['ResourceLock']:
        """Return active locks for a specific resource."""
        return cls.query.filter_by(
            resource_type=resource_type,
            resource_id=resource_id,
            released_at=None,
        ).all()

    @classmethod
    def find_unexpired_by_token(cls, lock_token: str) -> Optional['ResourceLock']:
        """Return an unexpired lock row by lock token, if still active."""
        return cls.query.filter(
            and_(
                cls.lock_token == lock_token,
                cls.released_at.is_(None),
                cls.expires_at > utc_now(),
            )
        ).first()

    @classmethod
    def find_by_token(cls, lock_token: str) -> Optional['ResourceLock']:
        """Return lock row by lock token."""
        return cls.query.filter_by(lock_token=lock_token).first()

    @classmethod
    def release_by_token(cls, lock_token: str, release_reason: Optional[str] = None) -> Optional['ResourceLock']:
        """Mark lock as released and persist release metadata."""
        lock = cls.find_by_token(lock_token)
        if not lock:
            return None

        if lock.released_at:
            return lock

        lock.released_at = utc_now()
        lock.release_reason = release_reason
        lock.commit()
        return lock
