"""Uploaded file schema class."""
from marshmallow import EXCLUDE, fields, validate

from api.models.uploaded_file import UploadedFile, UploadedFileStatus
from api.schemas.base_schema import BaseSchema
from api.services.object_storage_service import ObjectStorageService


class UploadedFileSchema(BaseSchema):
    """Schema for uploaded files."""

    class Meta(BaseSchema.Meta):
        """
        Meta class for the uploaded file schema.

        Describes how the schema should be generated based on the model and its relationships.
        """

        model = UploadedFile
        include_fk = True
        load_instance = True
        fields = (
            'id',
            'filename',
            'unique_filename',
            'path',
            'mimetype',
            'size',
            'status',
            'uploaded_at',
            'url',
        )
        unknown = EXCLUDE

    def __init__(self, *args, **kwargs):
        """Initialize the schema with an object storage service instance to generate URLs."""
        super().__init__(*args, **kwargs)
        self.object_storage_service = ObjectStorageService()

    id = fields.UUID(data_key='id', required=True)
    filename = fields.Str(data_key='filename', required=True, validate=validate.Length(
        min=1, error='File name cannot be blank'))
    unique_filename = fields.Str(data_key='unique_filename', required=True, validate=validate.Length(
        min=1, error='Unique file name cannot be blank'))
    path = fields.Str(data_key='path', required=True, validate=validate.Length(
        min=1, error='File path cannot be blank'))
    mimetype = fields.Str(data_key='mimetype', required=True, validate=validate.Length(
        min=1, error='MIME type cannot be blank'))
    size = fields.Int(data_key='size', required=True, validate=validate.Range(
        min=1, error='File size must be greater than 0'))
    status = fields.Enum(UploadedFileStatus, data_key='status', required=True)
    uploaded_at = fields.DateTime(data_key='uploaded_at', required=True)
    url = fields.Method('get_url', dump_only=True)

    def get_url(self, obj):
        """Generate a URL for the uploaded file based on its unique filename."""
        return self.object_storage_service.get_url(obj.unique_filename)
