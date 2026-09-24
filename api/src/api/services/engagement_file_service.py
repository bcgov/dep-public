"""Service for managing engagement-file associations."""

from typing import Optional, Union

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

    def get_engagement_file(self, engagement_id: int, file_id: int):
        """Retrieve a specific engagement-file association."""
        return self.db_session.query(EngagementFile).filter(
            EngagementFile.engagement_id == engagement_id,
            EngagementFile.file_id == file_id,
        ).first()

    def get_engagement_files(self, engagement_id: str, include_deleted: bool = False):
        """Retrieve all files associated with a specific engagement."""
        query = self.db_session.query(EngagementFile)
        query = query.filter_by(engagement_id=engagement_id)
        if not include_deleted:
            query = query.filter(UploadedFile.deleted_at.is_(None))
        query = query.join(
            UploadedFile, EngagementFile.file_id == UploadedFile.id)
        engagement_files = query.order_by(func.lower(UploadedFile.filename))
        return engagement_files.all()

    def retire_file(self, engagement_id: int, file_id: str, widget_id: Optional[int] = None):
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

    def unlink_file(self, engagement_file: Union[EngagementFile, str], engagement_id: Optional[int] = None):
        """
        Remove a file from its place within an engagement or engagement widget.

        This does *not* remove the engagement-file association from the database;
        it instead renders the file unused within the engagement context.
        """
        if isinstance(engagement_file, str):
            if engagement_id is None:
                raise ValueError(
                    'engagement_id must be provided when passing file by ID.')
            file_id = engagement_file
            engagement_file = self.db_session.query(EngagementFile).filter(
                EngagementFile.engagement_id == engagement_id,
                EngagementFile.file_id == file_id,
                EngagementFile.removed_at.is_(None),
            ).first()
        else:
            file_id = engagement_file.file_id
        assert isinstance(
            engagement_file, EngagementFile), 'File must be an EngagementFile instance after retrieval.'
        engagement_id = int(engagement_file.engagement_id)
        file = engagement_file.uploaded_file
        # Ensure all usage of the file within the engagement context is properly handled before retiring it.
        for engagement in file.banner_usages:
            engagement.banner_file_id = None
        for widget in file.document_widgets:
            self.db_session.delete(widget)
        for widget in file.image_widgets:
            self.db_session.delete(widget)
        self.db_session.flush()

        # Finally, retire the file association within the engagement context.
        return self.retire_file(engagement_id, file_id, engagement_file.widget_id)
