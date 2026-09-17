"""DB model for files uploaded to the application."""

from enum import Enum

from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base_model import BaseModel


class UploadedFileStatus(Enum):
    """Enumeration for the status of an uploaded file."""

    PENDING = 'pending'  # The file has been authorized but not yet uploaded
    UPLOADED = 'uploaded'  # The file has been successfully uploaded
    FAILED = 'failed'  # Something went wrong or timed out during the upload process


class UploadedFile(BaseModel):
    """Represent a file uploaded to the application."""

    __tablename__ = 'uploaded_files'
    id = Column(UUID(as_uuid=True), primary_key=True,
                comment='UUID from object storage')
    tenant_id = Column(Integer, ForeignKey(
        'tenant.id'), nullable=False, comment='Tenant ID associated with the file')
    filename = Column(String, nullable=False,
                      comment='Human-readable filename')
    unique_filename = Column(String, nullable=False,
                             unique=True, comment='UUID plus file extension')
    path = Column(String, nullable=False,
                  comment='Path to the file in object storage (including the filename)')
    mimetype = Column(String(256), nullable=False,
                      comment='MIME type of the file (https://www.iana.org/assignments/media-types/)')
    size = Column(Integer, nullable=False, comment='Size of the file in bytes')
    status = Column(SQLAlchemyEnum(UploadedFileStatus),
                    nullable=False, comment='Status of the uploaded file')
    uploaded_at = Column(DateTime, nullable=True,
                         comment='Timestamp of when the file was uploaded')

    # Relation objects
    tenant = relationship('Tenant', back_populates='uploaded_files')
    engagement_associations = relationship(
        'EngagementFile', back_populates='uploaded_file')
