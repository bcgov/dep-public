"""Service for handling file uploads to various resources."""

from datetime import UTC, datetime
from http import HTTPStatus
from mimetypes import MimeTypes

import requests
from sqlalchemy.orm import Session

from api.exceptions.business_exception import BusinessException
from api.models.engagement import Engagement
from api.models.engagement_file import EngagementFile
from api.models.uploaded_file import UploadedFile, UploadedFileStatus

from .object_storage_service import ObjectStorageService


class FileUploadService:
    """Handles file uploads to engagement resources."""

    def __init__(self, db_session: Session):
        """Initialize the service with persistent resources."""
        self.object_storage = ObjectStorageService()
        self.db_session = db_session
        self.mime = MimeTypes()
        # Old versions of mimetypes do not always detect certain file types, so add them manually
        self.mime.add_type('image/webp', '.webp')
        self.mime.add_type('image/avif', '.avif')
        self.mime.add_type('application/msword', '.doc')
        self.mime.add_type(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx')
        self.mime.add_type('application/vnd.ms-excel', '.xls')
        self.mime.add_type(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx')

    def prepare_file_upload(self, tenant_id: int, file_name: str, **kwargs):
        """Save a pending file upload entry and generate authentication headers."""
        document = {'filename': file_name}
        auth_headers = self.object_storage.get_auth_headers([document])[0]
        generated_path = self.object_storage.get_object_key(
            auth_headers.get('filepath', file_name))
        unique_filename = auth_headers['uniquefilename']
        _id = unique_filename.split('.')[0]

        mime_guess = self.mime.guess_type(file_name)[0]
        content_type = kwargs.get('content_type') or mime_guess

        uploaded_file = UploadedFile(
            id=_id,
            tenant_id=tenant_id,
            filename=file_name,
            unique_filename=unique_filename,
            path=generated_path,
            mimetype=content_type or 'application/x-zerosize',
            status=UploadedFileStatus.PENDING,
            size=0,
        )

        self.db_session.add(uploaded_file)

        if kwargs.get('engagement_id'):
            engagement = self.db_session.query(Engagement).get(
                kwargs.get('engagement_id'))
            if not engagement or engagement.tenant_id != tenant_id:
                raise BusinessException('Engagement not found.',
                                        HTTPStatus.NOT_FOUND)
            self.db_session.add(EngagementFile(
                engagement_id=kwargs.get('engagement_id'),
                widget_id=kwargs.get('widget_id'),
                file_id=uploaded_file.id
            ))

        self.db_session.commit()

        return auth_headers, uploaded_file

    def finalize_file_upload(self, uploaded_file_id: str):
        """Validate that the file has been uploaded to S3 and update its status accordingly."""
        file_record = self.get_file_upload(uploaded_file_id)
        key = self.object_storage.get_object_key(file_record.path)
        s3uri = f'https://{self.object_storage.s3_auth.aws_host}/{self.object_storage.s3_bucket}/{key}'

        response = requests.head(
            s3uri, auth=self.object_storage.s3_auth, timeout=None)
        if response.status_code == 200:
            last_modified = response.headers.get('Last-Modified')
            existing_content_type = file_record.mimetype if file_record.mimetype != 'application/x-zerosize' else None
            content_type = existing_content_type or response.headers.get(
                'Content-Type')
            # Try to enhance the content type if it's the generic 'application/octet-stream'
            if content_type == 'application/octet-stream':
                content_type = self.mime.guess_type(
                    file_record.filename)[0] or existing_content_type or content_type
            content_length = response.headers.get('Content-Length')

            uploaded_at = datetime.strptime(last_modified, '%a, %d %b %Y %H:%M:%S %Z').replace(
                tzinfo=UTC) if last_modified else datetime.now(UTC)
            file_record.uploaded_at = uploaded_at
            file_record.mimetype = content_type
            file_record.size = int(content_length) if content_length else None
            file_record.status = UploadedFileStatus.UPLOADED
        else:
            file_record.status = UploadedFileStatus.FAILED

        self.db_session.commit()
        return file_record, response.status_code

    def get_file_upload(self, uploaded_file_id: str) -> UploadedFile:
        """Retrieve a specific uploaded file by its ID."""
        if not (result := self.db_session.query(UploadedFile).get(uploaded_file_id)):
            raise BusinessException(
                error=f'Uploaded file with ID {uploaded_file_id} not found.', status_code=HTTPStatus.NOT_FOUND)
        return result

    def update_file_upload(self, uploaded_file_id: str, update_data: dict):
        """Update the metadata of a specific uploaded file."""
        uploaded_file = self.db_session.query(
            UploadedFile).filter_by(id=uploaded_file_id).first()
        if not uploaded_file:
            raise ValueError(
                f'Uploaded file with ID {uploaded_file_id} not found.')

        for key, value in update_data.items():
            setattr(uploaded_file, key, value)

        self.db_session.commit()
        return uploaded_file
