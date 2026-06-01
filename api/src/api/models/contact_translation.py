"""Contact translation model class.

Manages the translations for Contacts.
"""

from __future__ import annotations

from sqlalchemy import UniqueConstraint
from sqlalchemy.sql.schema import ForeignKey

from .base_model import BaseModel
from .db import db


class ContactTranslation(BaseModel):
    """Contact Translation table."""

    __tablename__ = 'contact_translation'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    language_id = db.Column(
        db.Integer, ForeignKey('language.id'), nullable=False
    )
    contact_id = db.Column(
        db.Integer,
        ForeignKey('contact.id', ondelete='CASCADE'),
        nullable=False,
    )
    name = db.Column(db.String(50), nullable=True)
    title = db.Column(db.String(50), nullable=True)
    address = db.Column(db.String(150), nullable=True)
    bio = db.Column(db.String(500), nullable=True)

    # A Contact has only one version in a particular language
    __table_args__ = (
        UniqueConstraint(
            'contact_id',
            'language_id',
            name='_contact_language_uc',
        ),
    )

    @staticmethod
    def get_by_contact_and_language(contact_id=None, language_id=None):
        """Get contact translation by contact ID and language ID."""
        query = db.session.query(ContactTranslation)
        if contact_id:
            query = query.filter_by(contact_id=contact_id)
        if language_id:
            query = query.filter_by(language_id=language_id)
        return query.first()

    @classmethod
    def create_contact_translation(cls, data: dict):
        """Create a new contact translation."""
        contact_translation = cls(
            contact_id=data['contact_id'],
            language_id=data['language_id'],
            name=data.get('name'),
            title=data.get('title'),
            address=data.get('address'),
            bio=data.get('bio'),
        )
        contact_translation.save()
        return contact_translation

    @classmethod
    def update_contact_translation(cls, translation_id, data):
        """Update an existing contact translation."""
        translation = cls.find_by_id(translation_id)
        if translation:
            for key, value in data.items():
                if key != 'id' and hasattr(translation, key):
                    setattr(translation, key, value)
            translation.save()
        return translation
