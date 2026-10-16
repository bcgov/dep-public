"""Engagement details tab model class.

Database operations for engagement details tabs. Tabs are received by the API as an array
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.sql.schema import ForeignKey

from .base_model import BaseModel
from .db import db


class EngagementDetailsTab(BaseModel):
    """Definition of the Engagement details tab entity."""

    __tablename__ = 'engagement_details_tabs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    engagement_id = db.Column(db.Integer, ForeignKey('engagement.id', ondelete='CASCADE'))
    label = db.Column(db.String(20), nullable=False)
    slug = db.Column(db.String(20), nullable=False)
    heading = db.Column(db.String(60), nullable=False)
    body = db.Column(db.JSON, nullable=False)
    sort_index = db.Column(db.Integer, nullable=False)

    @classmethod
    def find_by_engagement_id(cls, engagement_id) -> list[EngagementDetailsTab]:
        """Get all tabs for an engagement."""
        return db.session.query(cls)\
            .filter(cls.engagement_id == engagement_id)\
            .order_by(cls.sort_index.asc())\
            .all()

    @classmethod
    def bulk_insert_details_tabs(cls, insert_mappings: list):
        """Insert multiple engagement details tabs and return the created records."""
        records = [cls(**mapping) for mapping in insert_mappings]
        db.session.add_all(records)
        db.session.commit()
        return records

    @classmethod
    def bulk_update_details_tabs(cls, update_mappings: list) -> None:
        """Update multiple engagement details tabs."""
        db.session.bulk_update_mappings(cls, update_mappings)
        db.session.commit()

    @classmethod
    def update_details_tab(cls, engagement_id, tab_id, tab_data: dict) -> Optional[EngagementDetailsTab]:
        """Update a single engagement details tab."""
        query = cls.query.filter_by(id=tab_id, engagement_id=engagement_id)
        tab = query.first()
        if not tab:
            return None
        tab_data['updated_date'] = datetime.now(timezone.utc)
        query.update(tab_data)
        db.session.commit()
        db.session.refresh(tab)
        return tab

    @classmethod
    def delete_tabs_by_ids(cls, tab_ids: set) -> None:
        """Delete multiple tabs by ID."""
        db.session.query(cls).filter(cls.id.in_(tab_ids)).delete(synchronize_session=False)
        db.session.commit()

    @classmethod
    def delete_details_tab(cls, engagement_id, tab_id) -> int:
        """Delete a single tab."""
        deleted_count = cls.query.filter_by(id=tab_id, engagement_id=engagement_id).delete()
        db.session.commit()
        return deleted_count
