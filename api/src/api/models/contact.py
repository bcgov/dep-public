"""Contact model class.

Manages the contact
"""
from __future__ import annotations
from typing import Optional

from api.utils.datetime import utc_now

from .base_model import BaseModel
from .db import db


class Contact(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the Contact entity."""

    __tablename__ = 'contact'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50))
    title = db.Column(db.String(50))
    email = db.Column(db.String(50))
    phone_number = db.Column(db.String(50), nullable=True)
    address = db.Column(db.String(150))
    bio = db.Column(db.String(500), comment='A biography or short biographical profile of someone.')
    avatar_filename = db.Column(db.String(), unique=False, nullable=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenant.id'), nullable=True)

    @classmethod
    def get_contacts(cls) -> list[Contact]:
        """Get contacts."""
        query = db.session.query(Contact)
        query = cls._add_tenant_filter(query)
        return query.order_by(Contact.name).all()

    @classmethod
    def create_contact(cls, contact) -> Contact:
        """Create contact."""
        new_contact = Contact(
            name=contact.get('name', None),
            title=contact.get('title', None),
            email=contact.get('email', None),
            phone_number=contact.get('phone_number', None),
            address=contact.get('address', None),
            bio=contact.get('bio', None),
            created_date=utc_now(),
            updated_date=utc_now(),
            created_by=contact.get('created_by', None),
            updated_by=contact.get('updated_by', None),
            avatar_filename=contact.get('avatar_filename', None),
        )
        new_contact.save()

        return new_contact

    @classmethod
    def update_contact(cls, contact_data: dict) -> Optional[Contact or None]:
        """Update engagement."""
        contact_id = contact_data.get('id', None)
        query = Contact.query.filter_by(id=contact_id)
        contact: Contact = query.first()
        if not contact:
            return None
        contact_data['updated_date'] = utc_now()
        query.update(contact_data)
        db.session.commit()
        return contact
