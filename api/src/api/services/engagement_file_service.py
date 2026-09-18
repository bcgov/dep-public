"""Service for managing engagement-file associations."""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from api.models import EngagementFile, UploadedFile
from api.utils.datetime import utc_now
from api.utils.token_info import TokenInfo


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

    def retire_file(self, engagement_id: int, file_id, widget_id: Optional[int] = None):
        """Mark the active engagement-file association for a replaced file as removed."""
        query = self.db_session.query(EngagementFile).filter(
            EngagementFile.engagement_id == engagement_id,
            EngagementFile.file_id == file_id,
            EngagementFile.removed_at.is_(None),
        )
        if widget_id is None:
            query = query.filter(EngagementFile.widget_id.is_(None))
        else:
            query = query.filter(EngagementFile.widget_id == widget_id)

        return query.update(
            {
                'removed_at': utc_now(),
                'removed_by': TokenInfo.get_id(),
            },
            synchronize_session=False,
        )
