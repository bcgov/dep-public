"""Service for object storage management."""
import os
import uuid
from typing import List
from urllib.parse import urlparse

import requests
from aws_requests_auth.aws_auth import AWSRequestsAuth

from api.config import Config
from api.schemas.document import Document


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

    def get_auth_headers(self, documents: List[Document]):
        """Get the S3 auth headers for the provided documents."""
        if (
            self.s3_auth.aws_access_key is None or
            self.s3_auth.aws_secret_access_key is None or
            self.s3_auth.aws_host is None or
            self.s3_bucket is None
        ):
            return {
                'status': 'Configuration Issue',
                'message': 'accesskey is None or secretkey is None or S3 host is None or formsbucket is None'
            }, 500

        for file in documents:
            s3sourceuri = file.get('s3sourceuri', None)
            filenamesplittext = os.path.splitext(file.get('filename'))
            uniquefilename = f'{uuid.uuid4()}{filenamesplittext[1]}'

            s3uri = s3sourceuri if s3sourceuri is not None else self.get_url(uniquefilename)

            if s3sourceuri is None:
                response = requests.put(s3uri, data=None, auth=self.s3_auth, timeout=None)
            else:
                response = requests.get(s3uri, auth=self.s3_auth, timeout=None)

            file['filepath'] = s3uri
            file['authheader'] = response.request.headers['Authorization']
            file['amzdate'] = response.request.headers['x-amz-date']
            file['uniquefilename'] = uniquefilename if s3sourceuri is None else ''

        return documents
