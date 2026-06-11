"""Event item translation model class.

Manages the translations for Event Items.
"""

from __future__ import annotations

from sqlalchemy import UniqueConstraint
from sqlalchemy.sql.schema import ForeignKey

from .event_item import EventItem
from .base_model import BaseModel
from .db import db


class EventItemTranslation(BaseModel):
    """Event Items Translation table."""

    __tablename__ = 'event_item_translation'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    language_id = db.Column(
        db.Integer, ForeignKey('language.id'), nullable=False
    )
    event_item_id = db.Column(
        db.Integer,
        ForeignKey('event_item.id', ondelete='CASCADE'),
        nullable=False,
    )
    event_name = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(500))
    location_name = db.Column(db.String(50), nullable=True)
    location_address = db.Column(
        db.String(100), comment='The address of the location', nullable=True
    )
    url = db.Column(db.String(500))
    url_label = db.Column(
        db.String(100), comment='Label to show for href links'
    )

    # An Event item has only one version in a particular language
    __table_args__ = (
        UniqueConstraint(
            'event_item_id',
            'language_id',
            name='_event_item_language_uc',
        ),
    )

    @staticmethod
    def get_by_item_and_language(event_item_id=None, language_id=None):
        """
        Get event item translation by item ID and language ID.

        :param event_item_id (int): ID of the event item
        :param language_id (int): ID of the language
        :return: list: List of EventItemTranslation objects
        """
        query = EventItemTranslation.query
        if event_item_id is not None:
            query = query.filter_by(event_item_id=event_item_id)
        if language_id is not None:
            query = query.filter_by(language_id=language_id)

        event_item_translation_records = query.all()
        return event_item_translation_records

    @staticmethod
    def get_by_event_and_language(widget_events_id: int, language_id: int):
        """Get all event item translations for an event in a specific language."""
        return (
            EventItemTranslation.query
            .join(EventItem, EventItem.id == EventItemTranslation.event_item_id)
            .filter(
                EventItem.widget_events_id == widget_events_id,
                EventItemTranslation.language_id == language_id,
            )
            .all()
        )

    @classmethod
    def create_event_item_translation(cls, data):
        """
        Insert a new EventItemTranslation record.

        :param data: Dictionary containing the fields for EventItemTranslation
        :return: EventItemTranslation instance
        """
        event_item_translation = EventItemTranslation(
            event_item_id=data['event_item_id'],
            language_id=data['language_id'],
            event_name=data.get(
                'event_name'
            ),
            description=data.get(
                'description'
            ),
            location_name=data.get(
                'location_name'
            ),
            location_address=data.get(
                'location_address'
            ),
            url=data.get(
                'url'
            ),
            url_label=data.get(
                'url_label'
            )
        )
        event_item_translation.save()
        return event_item_translation

    @classmethod
    def update_event_item_translation(cls, translation_id, data):
        """
        Update an existing EventItemTranslation record.

        :param translation_id: ID of the EventItemTranslation to update
        :param data: Dictionary of fields to update
        :return: Updated EventItemTranslation instance
        """
        event_item_translation = cls.find_by_id(translation_id)
        if event_item_translation:
            for key, value in data.items():
                setattr(event_item_translation, key, value)
            event_item_translation.save()
        return event_item_translation

    @classmethod
    def delete_event_item_translation(cls, translation_id):
        """
        Delete an EventItemTranslation record.

        :param translation_id: ID of the EventItemTranslation to delete
        :return: None
        """
        event_item_translation = cls.find_by_id(translation_id)
        if event_item_translation:
            event_item_translation.delete()
            return True
        return False
