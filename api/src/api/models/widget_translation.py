"""Widget translation model class.

Manages the widget language translation for all generic widget types.

A single row covers one of three cases:
  - Widget-level translation (widget_events_id IS NULL, widget_documents_id IS NULL)
  - Per-event translation (widget_events_id IS NOT NULL)
  - Per-document translation (widget_documents_id IS NOT NULL)
"""
from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy import Index, text
from sqlalchemy.sql.schema import ForeignKey

from .base_model import BaseModel
from .db import db


class WidgetTranslation(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the Widget translation entity."""

    __tablename__ = 'widget_translation'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    widget_id = db.Column(db.Integer, ForeignKey('widget.id', ondelete='CASCADE'), nullable=False)
    language_id = db.Column(db.Integer, ForeignKey('language.id', ondelete='CASCADE'), nullable=False)
    # Generic widget-level fields
    title = db.Column(db.String(255), comment='Custom title for the widget.')
    description = db.Column(db.Text(), comment='Generic description (WhoIsListening, Timeline).')
    # Map-specific
    map_marker_label = db.Column(db.String(30))
    map_file_name = db.Column(db.Text())
    # Poll-specific
    poll_title = db.Column(db.String(255))
    poll_description = db.Column(db.String(2048))
    # Video-specific
    video_url = db.Column(db.String(255))
    video_description = db.Column(db.Text())
    # Sub-item FKs (mutually exclusive; both NULL for widget-level rows)
    widget_events_id = db.Column(
        db.Integer,
        ForeignKey('widget_events.id', ondelete='CASCADE'),
        nullable=True,
    )
    widget_documents_id = db.Column(
        db.Integer,
        ForeignKey('widget_documents.id', ondelete='CASCADE'),
        nullable=True,
    )

    __table_args__ = (
        # Widget-level rows: unique per (widget, language) when no sub-item FK is set
        Index(
            'uix_widget_translation_widget_language',
            'widget_id', 'language_id',
            unique=True,
            postgresql_where=text('widget_events_id IS NULL AND widget_documents_id IS NULL'),
        ),
        # Per-event rows: unique per (event entry, language)
        Index(
            'uix_widget_translation_events_language',
            'widget_events_id', 'language_id',
            unique=True,
            postgresql_where=text('widget_events_id IS NOT NULL'),
        ),
        # Per-document rows: unique per (document item, language)
        Index(
            'uix_widget_translation_documents_language',
            'widget_documents_id', 'language_id',
            unique=True,
            postgresql_where=text('widget_documents_id IS NOT NULL'),
        ),
    )

    # ------------------------------------------------------------------
    # Query helpers
    # ------------------------------------------------------------------

    @classmethod
    def find_by_engagement_and_language(cls, engagement_id: int, language_id: int):
        """Return widget-level translation rows for an engagement and language.

        Excludes per-event and per-document sub-item rows.
        """
        # local import to avoid circular dependency
        from .widget import Widget  # pylint: disable=import-outside-toplevel
        return (
            cls.query
            .join(Widget, Widget.id == cls.widget_id)
            .filter(
                Widget.engagement_id == engagement_id,
                cls.language_id == language_id,
                cls.widget_events_id.is_(None),
                cls.widget_documents_id.is_(None),
            )
            .all()
        )

    @classmethod
    def find_events_by_engagement_and_language(cls, engagement_id: int, language_id: int):
        """Return per-event translation rows for an engagement and language."""
        # local import to avoid circular dependency
        from .widget import Widget  # pylint: disable=import-outside-toplevel
        return (
            cls.query
            .join(Widget, Widget.id == cls.widget_id)
            .filter(
                Widget.engagement_id == engagement_id,
                cls.language_id == language_id,
                cls.widget_events_id.isnot(None),
            )
            .order_by(Widget.location.asc(), Widget.id.asc(), cls.widget_events_id.asc())
            .all()
        )

    @classmethod
    def find_documents_by_engagement_and_language(cls, engagement_id: int, language_id: int):
        """Return per-document translation rows for an engagement and language."""
        # local import to avoid circular dependency
        from .widget import Widget  # pylint: disable=import-outside-toplevel
        return (
            cls.query
            .join(Widget, Widget.id == cls.widget_id)
            .filter(
                Widget.engagement_id == engagement_id,
                cls.language_id == language_id,
                cls.widget_documents_id.isnot(None),
            )
            .order_by(Widget.location.asc(), Widget.id.asc(), cls.widget_documents_id.asc())
            .all()
        )

    @classmethod
    def get_translation_by_widget_id_and_language_id(cls, widget_id=None, language_id=None):
        """Get widget-level translation by widget_id and/or language_id."""
        query = cls.query.filter(
            cls.widget_events_id.is_(None),
            cls.widget_documents_id.is_(None),
        )
        if widget_id is not None:
            query = query.filter_by(widget_id=widget_id)
        if language_id is not None:
            query = query.filter_by(language_id=language_id)
        return query.all()

    # ------------------------------------------------------------------
    # Bulk DML helpers (used by sync methods in the service)
    # ------------------------------------------------------------------

    @classmethod
    def bulk_insert_widget_translations(cls, rows: list) -> None:
        """Bulk-insert translation rows."""
        db.session.bulk_insert_mappings(cls, rows)
        db.session.commit()

    @classmethod
    def bulk_update_widget_translations(cls, rows: list) -> None:
        """Bulk-update translation rows by primary key."""
        db.session.bulk_update_mappings(cls, rows)
        db.session.commit()

    @classmethod
    def delete_translations_by_ids(cls, translation_ids: Iterable[int]) -> None:
        """Delete multiple translation rows by ID."""
        db.session.query(cls).filter(cls.id.in_(translation_ids)).delete(synchronize_session=False)
        db.session.commit()

    # ------------------------------------------------------------------
    # Single-row CRUD
    # ------------------------------------------------------------------

    @classmethod
    def create_widget_translation(cls, translation) -> WidgetTranslation:
        """Create a single widget translation row."""
        obj = WidgetTranslation(
            widget_id=translation.get('widget_id'),
            language_id=translation.get('language_id'),
            title=translation.get('title'),
            description=translation.get('description'),
            map_marker_label=translation.get('map_marker_label'),
            map_file_name=translation.get('map_file_name'),
            poll_title=translation.get('poll_title'),
            poll_description=translation.get('poll_description'),
            video_url=translation.get('video_url'),
            video_description=translation.get('video_description'),
            widget_events_id=translation.get('widget_events_id'),
            widget_documents_id=translation.get('widget_documents_id'),
        )
        db.session.add(obj)
        db.session.commit()
        return obj

    @classmethod
    def remove_widget_translation(cls, widget_translation_id) -> WidgetTranslation:
        """Delete a widget translation by ID."""
        widget_translation = WidgetTranslation.query.filter_by(id=widget_translation_id).delete()
        db.session.commit()
        return widget_translation

    @classmethod
    def update_widget_translation(cls, widget_translation_id, translation: dict) -> Optional[WidgetTranslation]:
        """Update a widget translation by ID."""
        query = WidgetTranslation.query.filter_by(id=widget_translation_id)
        widget_translation: WidgetTranslation = query.first()
        if not widget_translation:
            return None
        query.update(translation)
        db.session.commit()
        return widget_translation
