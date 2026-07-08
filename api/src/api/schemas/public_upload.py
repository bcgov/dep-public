"""Schemas for public object-storage upload authorization."""

from marshmallow import EXCLUDE, Schema, fields, validate


class PublicUploadAuthorizationRequestSchema(Schema):
    """Request schema for token-scoped public upload authorization."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    filename = fields.Str(
        data_key='filename',
        required=True,
        validate=validate.Length(min=1, max=2048),
    )
    content_type = fields.Str(
        data_key='content_type',
        required=True,
        validate=validate.Length(min=1, max=255),
    )
    size = fields.Int(
        data_key='size',
        required=True,
        validate=validate.Range(min=1),
    )
    verification_token = fields.Str(
        data_key='verification_token',
        required=True,
        validate=validate.Length(min=1, max=255),
    )


class PublicObjectAccessRequestSchema(Schema):
    """Request schema for token-scoped access to a previously uploaded object."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    file_id = fields.Str(
        data_key='file_id',
        required=True,
        validate=validate.Length(min=1, max=4096),
    )
    verification_token = fields.Str(
        data_key='verification_token',
        required=True,
        validate=validate.Length(min=1, max=255),
    )
