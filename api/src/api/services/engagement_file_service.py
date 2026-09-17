"""Service for managing engagement-file associations."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from api.models import EngagementFile, UploadedFile


class EngagementFileService:
    """Service for managing engagement-file associations."""

    def __init__(self, db_session: Session):
        """Initialize the service with persistent resources."""
        self.db_session = db_session

    def get_engagement_files(self, engagement_id: str):
        """Retrieve all files associated with a specific engagement."""
        query = self.db_session.query(EngagementFile)
        query = query.filter_by(engagement_id=engagement_id)
        query = query.join(
            UploadedFile, EngagementFile.file_id == UploadedFile.id)
        engagement_files = query.order_by(func.lower(UploadedFile.filename))
        return engagement_files.all()
