"""WidgetImageTranslation model class.

Manages the image widget translations
"""
from __future__ import annotations
from sqlalchemy.sql.schema import ForeignKey
from .base_model import BaseModel
from .db import db


class WidgetImageTranslation(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the Image widget translation entity."""

    __tablename__ = 'widget_image_translation'
    __table_args__ = (
        db.UniqueConstraint('widget_image_id', 'language_id', name='unique_widget_image_language'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    widget_image_id = db.Column(db.Integer, ForeignKey('widget_image.id', ondelete='CASCADE'), nullable=False)
    language_id = db.Column(db.Integer, ForeignKey('language.id', ondelete='CASCADE'), nullable=False)
    alt_text = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text(), nullable=True)
