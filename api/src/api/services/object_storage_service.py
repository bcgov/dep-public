"""Service for object storage management."""
import os
import uuid
from typing import Any, List, Union
from urllib.parse import urlparse

import requests
from aws_requests_auth.aws_auth import AWSRequestsAuth

from api.config import Config


class ObjectStorageService:
    """Object storage management service."""

    def __init__(self):
        """Initialize the service."""
        # initialize s3 config from environment variables
        s3_client = Config().S3_CONFIG
        self.s3_auth = AWSRequestsAuth(
            aws_access_key=s3_client['ACCESS_KEY_ID'],
            aws_secret_access_key=s3_client['SECRET_ACCESS_KEY'],
            aws_host=s3_client['HOST'],
            aws_region=s3_client['REGION'],
            aws_service=s3_client['SERVICE']
        )
        self.s3_bucket = s3_client['BUCKET']

    def get_url(self, filename: str):
        """Get the object url."""
        object_key = self.get_object_key(filename)
        if (not self.s3_auth.aws_host or not self.s3_bucket or not object_key):
            return ''

        return f'https://{self.s3_auth.aws_host}/{self.s3_bucket}/{object_key}'

    def get_object_key(self, filename: str):
        """Extract the object key from a stored filename/path/url."""
        if not filename:
            return ''

        parsed = urlparse(filename)
        if parsed.scheme and parsed.netloc:
            path = parsed.path.lstrip('/')
            if not path:
                return ''
            bucket_prefix = f'{self.s3_bucket}/' if self.s3_bucket else ''
            if bucket_prefix and path.startswith(bucket_prefix):
                return path[len(bucket_prefix):]
            return path

        return filename.lstrip('/')

    def delete_file(self, file_path: str):
        """Delete a file from the object storage service."""
        if not file_path:
            return
        object_key = self.get_object_key(file_path)
        if not object_key:
            return
        s3uri = f'https://{self.s3_auth.aws_host}/{self.s3_bucket}/{object_key}'
        requests.delete(s3uri, auth=self.s3_auth, timeout=None)

    def is_configured(self):
        """Return whether object storage configuration is present."""
        return (
            self.s3_auth.aws_access_key is not None and
            self.s3_auth.aws_secret_access_key is not None and
            self.s3_auth.aws_host is not None and
            self.s3_bucket is not None
        )

    def generate_unique_filename(self, filename: str):
        """Return a unique filename preserving the original extension."""
        filenamesplittext = os.path.splitext(filename)
        return f'{uuid.uuid4()}{filenamesplittext[1]}'

    def build_public_upload_key(self, tenant_id: int, survey_id: int, verification_id: int, filename: str):
        """Build an object key for a public survey upload."""
        unique_filename = self.generate_unique_filename(filename)
        object_key = (
            f'tenant_{tenant_id}/survey_{survey_id}/'
            f'verification_{verification_id}/{unique_filename}'
        )
        return object_key, unique_filename

    @staticmethod
    def build_public_upload_prefix(tenant_id: int, survey_id: int, verification_id: int):
        """Build the expected object key prefix for a public survey upload."""
        return f'tenant_{tenant_id}/survey_{survey_id}/verification_{verification_id}/'

    def get_signed_request_details(self, method: str, object_key: str, content_type: Union[str, None] = None):
        """Return signed request headers for a single object request without executing it."""
        if not self.is_configured():
            raise ValueError(
                '(get_signed_request_details) S3 Object service is not configured properly.'
            )

        s3uri = self.get_url(object_key)
        if not s3uri:
            raise ValueError('Invalid object key for object storage upload.')

        headers = {}
        if content_type:
            headers['Content-Type'] = content_type

        prepared_request = requests.Request(
            method, s3uri, headers=headers).prepare()
        signed_request = self.s3_auth(prepared_request)

        return {
            'filepath': s3uri,
            'authheader': signed_request.headers['Authorization'],
            'amzdate': signed_request.headers['x-amz-date'],
        }

    def get_signed_upload_details(self, object_key: str, content_type: Union[str, None] = None):
        """Return signed request headers for a single object PUT without uploading it."""
        return self.get_signed_request_details('PUT', object_key, content_type)

    def get_auth_headers(self, documents: List[dict[str, Any]]):
        """Get the S3 auth headers for the provided documents."""
        if not self.is_configured():
            return {
                'status': 'Configuration Issue',
                'message': '(get_auth_headers) S3 Object service is not configured properly.',
            }, 500

        for file in documents:
            s3sourceuri = file.get('s3sourceuri', None)
            filename = file.get('filename')
            if not filename:
                raise ValueError('filename is required')
            uniquefilename = self.generate_unique_filename(filename)

            s3uri = s3sourceuri if s3sourceuri is not None else self.get_url(
                uniquefilename)

            if s3sourceuri is None:
                response = requests.put(
                    s3uri, data=None, auth=self.s3_auth, timeout=None)
            else:
                response = requests.get(s3uri, auth=self.s3_auth, timeout=None)

            file['filepath'] = s3uri
            file['authheader'] = response.request.headers['Authorization']
            file['amzdate'] = response.request.headers['x-amz-date']
            file['uniquefilename'] = uniquefilename if s3sourceuri is None else ''

        return documents
