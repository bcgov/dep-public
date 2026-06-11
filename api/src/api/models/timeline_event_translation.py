"""Timeline Event Translation model class.

Manages the translatin for timeline events
"""

from __future__ import annotations

from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy import UniqueConstraint
from .base_model import BaseModel
from .db import db


class TimelineEventTranslation(BaseModel):
    """Definition of the TimelineEventTranslation entity."""

    __tablename__ = 'timeline_event_translation'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    language_id = db.Column(
        db.Integer, ForeignKey('language.id'), nullable=False
    )
    timeline_event_id = db.Column(
        db.Integer,
        ForeignKey('timeline_event.id', ondelete='CASCADE'),
        nullable=False,
    )
    description = db.Column(db.Text(), nullable=True)
    time = db.Column(db.String(255), nullable=True)

    # A TimelineEvent item has only one version in a particular language
    __table_args__ = (
        UniqueConstraint(
            'timeline_event_id',
            'language_id',
            name='_timeline_event_language_uc',
        ),
    )

    @classmethod
    def get_by_timeline_and_language(cls, timeline_id: int, language_id: int):
        """Return all event translations for a WidgetTimeline record and language."""
        from .timeline_event import TimelineEvent  # pylint: disable=import-outside-toplevel
        return (
            cls.query
            .join(TimelineEvent, TimelineEvent.id == cls.timeline_event_id)
            .filter(
                TimelineEvent.timeline_id == timeline_id,
                cls.language_id == language_id,
            )
            .all()
        )

    @staticmethod
    def get_by_event_and_language(timeline_event_id=None, language_id=None):
        """
        Get timeline event translation by event ID and language ID.

        :param timeline_event_id (int): ID of the timeline event
        :param language_id (int): ID of the language
        :return: list: List of TimelineEventTranslation objects
        """
        query = TimelineEventTranslation.query
        if timeline_event_id is not None:
            query = query.filter_by(timeline_event_id=timeline_event_id)
        if language_id is not None:
            query = query.filter_by(language_id=language_id)

        timeline_event_translation_records = query.all()
        return timeline_event_translation_records

    @classmethod
    def create_timeline_event_translation(cls, data):
        """
        Insert a new TimelineEventTranslation record.

        :param data: Dictionary containing the fields for TimelineEventTranslation
        :return: TimelineEventTranslation instance
        """
        timeline_event_translation = TimelineEventTranslation(
            timeline_event_id=data['timeline_event_id'],
            language_id=data['language_id'],
            description=data.get(
                'description'
            ),
            time=data.get(
                'time'
            )
        )
        timeline_event_translation.save()
        return timeline_event_translation

    @classmethod
    def update_timeline_event_translation(cls, translation_id, data):
        """
        Update an existing TimelineEventTranslation record.

        :param translation_id: ID of the TimelineEventTranslation to update
        :param data: Dictionary of fields to update
        :return: Updated TimelineEventTranslation instance
        """
        timeline_event_translation = cls.find_by_id(translation_id)
        if timeline_event_translation:
            for key, value in data.items():
                setattr(timeline_event_translation, key, value)
            timeline_event_translation.save()
        return timeline_event_translation

    @classmethod
    def delete_timeline_event_translation(cls, translation_id):
        """
        Delete a TimelineEventTranslation record.

        :param translation_id: ID of the TimelineEventTranslation to delete
        :return: None
        """
        timeline_event_translation = cls.find_by_id(translation_id)
        if timeline_event_translation:
            timeline_event_translation.delete()
            return True
        return False
