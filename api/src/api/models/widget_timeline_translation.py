"""WidgetTimelineTranslation model class.

Manages the timeline widget translations
"""
from __future__ import annotations

from sqlalchemy.sql.schema import ForeignKey

from .base_model import BaseModel
from .db import db


class WidgetTimelineTranslation(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the Timeline widget translation entity."""

    __tablename__ = 'widget_timeline_translation'
    __table_args__ = (
        db.UniqueConstraint('widget_timeline_id', 'language_id', name='unique_widget_timeline_language'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    widget_timeline_id = db.Column(db.Integer, ForeignKey('widget_timeline.id', ondelete='CASCADE'), nullable=False)
    language_id = db.Column(db.Integer, ForeignKey('language.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text(), nullable=True)
