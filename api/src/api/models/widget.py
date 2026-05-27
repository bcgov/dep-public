"""Widget model class widget.

Manages the widget
"""
from __future__ import annotations
from typing import Optional

from sqlalchemy.sql.schema import ForeignKey

from api.utils.datetime import utc_now

from .widget_item import WidgetItem
from .base_model import BaseModel
from .db import db


class Widget(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the Widget entity."""

    __tablename__ = 'widget'
    __table_args__ = (
        db.UniqueConstraint(
            'location',
            'engagement_id',
            'engagement_details_tab_id',
            name='unique_widget_location_tab'
        ),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    widget_type_id = db.Column(db.Integer, ForeignKey('widget_type.id', ondelete='RESTRICT'), nullable=False)
    engagement_id = db.Column(db.Integer, ForeignKey('engagement.id', ondelete='CASCADE'))
    engagement_details_tab_id = db.Column(db.Integer, ForeignKey('engagement_details_tabs.id', ondelete='CASCADE'))
    title = db.Column(db.String(100), comment='Custom title for the widget.')
    items = db.relationship('WidgetItem', backref='widget', cascade='all, delete', order_by='WidgetItem.sort_index')
    location = db.Column(db.Integer, nullable=False)

    @classmethod
    def get_widget_by_id(cls, widget_id):
        """Get widgets by widget_id."""
        return db.session.query(Widget)\
            .join(WidgetItem, Widget.id == WidgetItem.widget_id, isouter=True)\
            .filter(Widget.id == widget_id)\
            .first()

    @classmethod
    def get_widgets_by_engagement_id(cls, engagement_id):
        """Get widgets by engagement_id."""
        return db.session.query(Widget)\
            .join(WidgetItem, Widget.id == WidgetItem.widget_id, isouter=True)\
            .filter(Widget.engagement_id == engagement_id)\
            .order_by(Widget.location.asc())\
            .all()

    @classmethod
    def create_widget(cls, widget) -> Widget:
        """Create widget."""
        new_widget = cls.__create_new_widget_entity(widget)
        db.session.add(new_widget)
        db.session.commit()
        return new_widget

    @staticmethod
    def __create_new_widget_entity(widget):
        """Create new widget entity."""
        return Widget(
            widget_type_id=widget.get('widget_type_id', None),
            engagement_id=widget.get('engagement_id', None),
            created_date=utc_now(),
            updated_date=utc_now(),
            created_by=widget.get('created_by', None),
            updated_by=widget.get('updated_by', None),
            title=widget.get('title', None),
            location=widget.get('location', None),
            engagement_details_tab_id=widget.get('engagement_details_tab_id', None),
        )

    @classmethod
    def create_all_widgets(cls, widgets: list) -> list[Widget]:
        """Save widgets."""
        new_widgets = [cls.__create_new_widget_entity(widget) for widget in widgets]
        db.session.add_all(new_widgets)
        db.session.commit()
        return new_widgets

    @classmethod
    def remove_widget(cls, engagement_id, widget_id,) -> Widget:
        """Remove widget from engagement."""
        widget = Widget.query.filter_by(id=widget_id, engagement_id=engagement_id).delete()
        db.session.commit()
        return widget

    @classmethod
    def update_widgets(cls, update_mappings: list) -> None:
        """Update widgets.."""
        db.session.bulk_update_mappings(Widget, update_mappings)
        db.session.commit()

    @classmethod
    def update_widget(cls, engagement_id, widget_id, widget_data: dict) -> Optional[Widget]:
        """Update widget."""
        query = Widget.query.filter_by(id=widget_id, engagement_id=engagement_id)
        widget: Widget = query.first()
        if not widget:
            return None
        widget_data['updated_date'] = utc_now()
        query.update(widget_data)
        db.session.commit()
        return widget
