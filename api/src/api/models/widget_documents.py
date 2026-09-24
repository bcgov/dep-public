"""Widget Documents model class.

Manages the Widget Documents
"""
from __future__ import annotations

from typing import List

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql.schema import ForeignKey

from .base_model import BaseModel
from .db import db


class WidgetDocuments(BaseModel):  # pylint: disable=too-few-public-methods
    """Widget Documents table."""

    __tablename__ = 'widget_documents'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(50))
    type = db.Column(db.String(50), comment='File or Folder identifier')
    parent_document_id = db.Column(
        db.Integer, ForeignKey('widget_documents.id'))
    url = db.Column(db.String(2000), nullable=True)
    file_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        'uploaded_files.id'), nullable=True)
    # defines the sorting within the specific widget.Not the overall sorting.
    sort_index = db.Column(db.Integer, nullable=True, default=1)
    widget_id = db.Column(db.Integer, ForeignKey(
        'widget.id', ondelete='CASCADE'), nullable=True)
    is_uploaded = db.Column(db.Boolean, nullable=True, default=False)
    file = db.relationship('UploadedFile', backref='document_widgets')
    children = db.relationship('WidgetDocuments', backref=db.backref(
        'parent_document', remote_side=[id]))

    @classmethod
    def get_all_by_widget_id(cls, widget_id) -> List[WidgetDocuments]:
        """Get a survey."""
        docs = db.session.query(WidgetDocuments) \
            .filter(WidgetDocuments.widget_id == widget_id) \
            .order_by(WidgetDocuments.sort_index, WidgetDocuments.id) \
            .all()
        return docs

    @classmethod
    def edit_widget_document(cls, widget_id, document_id, widget_document_data: dict) -> WidgetDocuments:
        """Update document."""
        widget_document_query = db.session.query(WidgetDocuments) \
            .filter(WidgetDocuments.widget_id == widget_id, WidgetDocuments.id == document_id)
        widget_document: WidgetDocuments = widget_document_query.first()
        if not widget_document:
            return None
        widget_document_query.update(widget_document_data)
        db.session.commit()
        return widget_document

    @classmethod
    def remove_widget_document(cls, widget_id, document_id) -> List[WidgetDocuments]:
        """Remove document from a document widget.

        Using an 'or' condition to handle nested deletion of files within the folder.
        """
        query = db.session.query(WidgetDocuments) \
            .filter(WidgetDocuments.widget_id == widget_id,
                    sa.or_(WidgetDocuments.id == document_id, WidgetDocuments.parent_document_id == document_id))
        widget_documents = query.all()
        query.delete()
        db.session.commit()
        return widget_documents

    @classmethod
    def update_documents(cls, update_mappings: list) -> None:
        """Update documents.."""
        db.session.bulk_update_mappings(WidgetDocuments, update_mappings)
        db.session.commit()
