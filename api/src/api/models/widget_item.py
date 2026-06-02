"""WidgetItem model class.

Manages the widget_item
"""
from __future__ import annotations

from sqlalchemy.sql.schema import ForeignKey

from api.utils.datetime import utc_now

from .base_model import BaseModel
from .db import db


class WidgetItem(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the WidgetItem entity."""

    __tablename__ = 'widget_item'
    __table_args__ = (
        db.UniqueConstraint('widget_data_id', 'widget_id', name='unique_widget_data'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    widget_data_id = db.Column(
        db.Integer,
        nullable=False,
        comment='A dynamic foreign key that could be to any table where the widget data is hosted.'
    )
    widget_id = db.Column(db.Integer, ForeignKey('widget.id', ondelete='CASCADE'))
    sort_index = db.Column(db.Integer, nullable=False, default=1)

    @classmethod
    def get_widget_item_by_id(cls, widget_item_id):
        """Get widget item by id."""
        return db.session.query(WidgetItem)\
            .filter(WidgetItem.id == widget_item_id)\
            .first()

    @classmethod
    def get_widget_items_by_widget_id(cls, widget_id):
        """Get widgets by widget_id."""
        return db.session.query(WidgetItem)\
            .filter(WidgetItem.widget_id == widget_id)\
            .order_by(WidgetItem.sort_index.asc())\
            .all()

    @classmethod
    def delete_widget_items(cls, widget_item_ids: list) -> WidgetItem:
        """Create widget_item."""
        db.session\
            .query(WidgetItem)\
            .filter(WidgetItem.id.in_(widget_item_ids))\
            .delete(synchronize_session='fetch')
        db.session.commit()
        return widget_item_ids

    @classmethod
    def create_widget_item(cls, widget_item) -> WidgetItem:
        """Create widget_item."""
        new_widget = cls.__create_new_widget_item_entity(widget_item)
        db.session.add(new_widget)
        db.session.commit()
        return new_widget

    @staticmethod
    def __create_new_widget_item_entity(widget_item):
        """Create new widget_item entity."""
        return WidgetItem(
            widget_id=widget_item.get('widget_id', None),
            widget_data_id=widget_item.get('widget_data_id', None),
            created_date=utc_now(),
            updated_date=utc_now(),
            created_by=widget_item.get('created_by', None),
            updated_by=widget_item.get('updated_by', None),
        )

    @classmethod
    def create_all_widget_items(cls, widgets: list) -> list[WidgetItem]:
        """Save widgets."""
        new_widgets = [cls.__create_new_widget_item_entity(widget_item) for widget_item in widgets]
        db.session.add_all(new_widgets)
        db.session.commit()
        return new_widgets

    @classmethod
    def update_widget_items_bulk(cls, update_mappings: list) -> list[WidgetItem]:
        """Save widget items sorting."""
        db.session.bulk_update_mappings(WidgetItem, update_mappings)
        db.session.commit()
        return update_mappings
