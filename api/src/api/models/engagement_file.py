"""DB model for files uploaded to the application."""


from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base_model import BaseModel


class EngagementFile(BaseModel):
    """Represents a file association within an engagement."""

    __tablename__ = 'engagement_files'
    id = Column(Integer, primary_key=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey(
        'uploaded_files.id'), nullable=False, comment='Associated uploaded file ID')
    engagement_id = Column(Integer, ForeignKey(
        'engagement.id'), nullable=False, comment='Associated engagement ID')
    widget_id = Column(Integer, ForeignKey(
        'widget.id'), nullable=True, comment='Associated widget ID, if applicable')
    removed_at = Column(DateTime, nullable=True,
                        comment='Timestamp when the file was removed, if applicable')
    removed_by = Column(String(64), nullable=True,
                        comment='User who removed the file, if applicable')

    widget = relationship('Widget', back_populates='engagement_files')
    engagement = relationship('Engagement', back_populates='file_assignments')
    uploaded_file = relationship(
        'UploadedFile', back_populates='engagement_associations')
