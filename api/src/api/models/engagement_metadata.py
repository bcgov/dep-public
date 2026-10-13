"""
The EngagementMetadata model represents a unit of metadata for an Engagement.

Metadata is stored as a key-value pair, where the key is a MetadataTaxon and
the value is a string. MetadataTaxa are used to group metadata by type, and
determine how it is displayed in the UI.
"""
from __future__ import annotations

import enum

from sqlalchemy.orm import relationship, validates

from .base_model import BaseModel
from .db import db, transactional


class EngagementMetadata(BaseModel):
    """A unit of metadata for an Engagement. Can be used to store arbitrary data."""

    __tablename__ = 'engagement_metadata'
    id = db.Column(db.Integer, primary_key=True,
                   nullable=False, autoincrement=True)
    engagement_id = db.Column(db.Integer,
                              db.ForeignKey('engagement.id', ondelete='CASCADE'), nullable=True, index=True)
    engagement = db.relationship('Engagement', backref='metadata')
    taxon_id = db.Column(db.Integer,
                         db.ForeignKey('engagement_metadata_taxa.id', ondelete='CASCADE'), nullable=False, index=True)
    taxon = db.relationship('MetadataTaxon', backref='entries')
    value = db.Column(db.Text, index=True, nullable=False)

    @property
    def tenant(self):
        """Extracts the tenant details for taxon."""
        return self.taxon.tenant if self.taxon else None

    @validates('id')
    def validate_id(self, _, new_id):
        """Prevent primary key and foreign keys from being updated after creation."""
        if self.id and self.id != new_id:
            raise ValueError('Cannot change own ID')
        return new_id

    @validates('engagement_id')
    def validate_engagement_id(self, _, new_engagement_id):
        """Prevent update of engagement id."""
        if self.engagement_id and self.engagement_id != new_engagement_id:
            raise ValueError('Cannot change engagement_id')
        return new_engagement_id

    def __repr__(self) -> str:
        """Return a string representation of the EngagementMetadata."""
        if not self:
            return '<EngagementMetadata: None>'
        if (not self.engagement and not self.taxon):
            return f'<EngagementMetadata: {self.value}>'
        if not self.taxon:
            return f'<EngagementMetadata for e#{self.engagement_id}: ???={self.value}>'
        if not self.engagement:
            return f'<EngagementMetadata for taxon #{self.taxon_id}: {self.taxon.name} = {self.value}'
        return (f'<EngagementMetadata for eng#{self.engagement_id}: '
                f'{self.taxon.name} = {self.value}>')


class MetadataTaxonDataType(str, enum.Enum):
    """The data types that can be stored in a metadata property."""

    TEXT = 'text'
    LONG_TEXT = 'long_text'
    NUMBER = 'number'
    DATE = 'date'
    TIME = 'time'
    DATETIME = 'datetime'
    BOOLEAN = 'boolean'
    URL = 'url'
    EMAIL = 'email'
    PHONE = 'phone'
    GEO_AREA = 'geo_area'
    OTHER = 'other'

    @classmethod
    # pylint: disable=no-member
    def has_value(cls, value: str) -> bool:
        """Return True if the value is a valid data type."""
        return value in cls._value2member_map_


class MetadataTaxonFilterType(str, enum.Enum):
    """The filter types that can be applied to a metadata property."""

    CHIPS_ALL = 'chips_all'
    CHIPS_ANY = 'chips_any'


class MetadataTaxon(BaseModel):
    """
    A taxon to group metadata by.

    Taxa determine the type of data that can be stored in a property, and how it is displayed.
    """

    __tablename__ = 'engagement_metadata_taxa'

    id = db.Column(db.Integer, primary_key=True,
                   unique=True, autoincrement=True)
    tenant_id = db.Column(db.Integer,
                          db.ForeignKey('tenant.id', ondelete='CASCADE'),
                          nullable=False, index=True)
    tenant = relationship('Tenant', backref='metadata_taxa')
    name = db.Column(db.String(64), nullable=True)
    is_required = db.Column(db.Boolean, nullable=False, default=False)
    description = db.Column(db.String(256), nullable=True)
    freeform = db.Column(db.Boolean, nullable=False, default=False)
    data_type = db.Column(db.String(64), nullable=True, default='text')
    one_per_engagement = db.Column(db.Boolean)
    position = db.Column(db.Integer, nullable=False, index=True)
    filter_type = db.Column(db.String(64), nullable=True)
    # Whether to include freeform values from engagements in the user-facing filter options
    include_freeform = db.Column(db.Boolean, nullable=False, default=False)

    def __init__(self, **kwargs) -> None:
        """Initialize a new instance of the MetadataTaxon class."""
        super().__init__(**kwargs)
        if not self.data_type:
            self.data_type = 'text'
        if not self.position:
            # find other taxa in this tenant and set position to the next highest
            max_position = MetadataTaxon.query.filter_by(
                tenant_id=self.tenant_id).count()
            self.position = max_position + 1

    @validates('id')
    def validate_id(self, _, new_id):
        """Prevent primary key and foreign keys from being updated after creation."""
        if self.id and self.id != new_id:
            raise ValueError('Cannot change own ID')
        return new_id

    @validates('tenant_id')
    def validate_tenant_id(self, _, new_tenant_id):
        """Prevent update of tenant id."""
        if self.tenant_id and self.tenant_id != new_tenant_id:
            raise ValueError('Cannot change tenant_id')
        return new_tenant_id

    def __repr__(self) -> str:
        """Return a string representation of the EngagementMetadata."""
        if not self:
            return '<MetadataTaxon: None>'
        return f'<MetadataTaxon #{self.id}: {self.name}>'

    @property
    def preset_values(self) -> list[str]:
        """Get preset values - any metadata entries with no specific engagement."""
        return [entry.value for entry in self.entries if entry.engagement_id is None]

    @preset_values.setter
    @transactional()
    def preset_values(self, values: list[str]) -> None:
        # Update preset values to match the provided list
        for entry in self.entries:
            if entry.engagement_id is None and entry.value not in values:
                entry.delete()
        for value in values:
            if value not in self.preset_values:
                entry = EngagementMetadata(taxon_id=self.id, value=value)
                entry.save()

    @transactional()
    def move_to_position(self, new_position: int) -> None:
        """
        Move this taxon to a specific position within the same tenant.

        Update positions of other taxa accordingly.
        """
        tenant_id = self.tenant_id
        current_position = self.position
        # the affected range of positions
        start, end = sorted([current_position, new_position])
        # Create a query that selects the affected taxa in the tenant
        affected_taxa = MetadataTaxon.query.filter(
            MetadataTaxon.tenant_id == tenant_id,
            MetadataTaxon.position.between(start, end)
        ).all()
        # Determine the direction of the position update
        position_delta = -1 if new_position > current_position else 1
        # Update positions for each affected taxon
        for taxon in affected_taxa:
            if taxon.id != self.id:
                taxon.position += position_delta

        # Finally, update the position of the current taxon
        self.position = new_position
        db.session.commit()

    @transactional()
    def delete(self) -> None:
        """Remove the taxon, updating the positions of subsequent taxa within the same tenant."""
        if self is not None:
            subsequent_taxa = MetadataTaxon.query.filter(
                MetadataTaxon.tenant_id == self.tenant_id,
                MetadataTaxon.position > self.position).all()

            for taxon in subsequent_taxa:
                taxon.position -= 1

            super().delete()

    @classmethod
    @transactional()
    def reorder_taxa(cls, tenant_id: int, taxon_order: list[int]) -> None:
        """
        Reorder all taxa within a specific tenant based on a provided list of taxon IDs.

        Setting their positions accordingly.
        """
        for index, taxon_id in enumerate(taxon_order):
            taxon = cls.query.filter_by(
                tenant_id=tenant_id, id=taxon_id).first()
            if taxon:
                taxon.position = index
