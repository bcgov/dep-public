"""Tenant model class.

Manages the tenants
"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db


class Tenant(BaseModel):
    """Definition of the Tenant entity."""

    __tablename__ = 'tenant'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    short_name = db.Column(db.String(10), nullable=False, unique=True,
                           comment='A small code for the tenant ie GDX , EAO.')
    name = db.Column(db.String(50), comment='Full name of the ministry.ie Env Assessment Office')
    contact_name = db.Column(
        db.String(50), comment='Name of the primary contact', nullable=False, default='Default Contact Name'
    )
    contact_email = db.Column(
        db.String(255), comment='Email of the primary contact', nullable=False, default='Default Contact Email'
    )
    description = db.Column(db.String(300))
    title = db.Column(db.String(30), nullable=False)
    hero_image_url = db.Column(db.String(300), nullable=True)
    hero_image_credit = db.Column(db.String(60), comment='Hero banner image credit', nullable=True)
    hero_image_description = db.Column(db.String(80), comment='Hero banner image description', nullable=True)
    uploaded_files = relationship('UploadedFile', back_populates='tenant')

    @staticmethod
    def find_by_short_name(short_name: str) -> Tenant:
        """Find tenant using short name."""
        return db.session.query(Tenant).filter(Tenant.short_name.ilike(short_name)).one_or_none()

    @staticmethod
    def find_by_id(identifier: int) -> Optional[Tenant]:
        """Find tenant by id."""
        return db.session.query(Tenant).filter(Tenant.id == identifier).one_or_none()

    @staticmethod
    def find_all() -> List[Tenant]:
        """Return all tenants."""
        return db.session.query(Tenant).all()

    def save(self):
        """Save tenant to the database."""
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """Delete tenant from the database."""
        if self.id is None or not Tenant.find_by_id(self.id):
            raise ValueError('Tenant not found.')
        db.session.delete(self)
        db.session.commit()

    def update(self, data: dict):
        """Update tenant with data."""
        if self.id is None or not Tenant.find_by_id(self.id):
            raise ValueError('Tenant not found.')
        for key, value in data.items():
            setattr(self, key, value)
        db.session.commit()
