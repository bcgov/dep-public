"""Document schema class."""
from marshmallow import EXCLUDE, Schema, fields


class Document(Schema):
    """Document schema class."""

    class Meta:
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    filename = fields.Str(data_key='filename', allow_none=False)
    filepath = fields.Str(data_key='filepath', allow_none=True)
    authheader = fields.Str(data_key='authheader', allow_none=True)
    amzdate = fields.Str(data_key='amzdate', allow_none=True)
    s3sourceuri = fields.Str(data_key='s3sourceuri', allow_none=True)
    content_type = fields.Str(data_key='content_type', allow_none=True)
    engagement_id = fields.Int(data_key='engagement_id', allow_none=True)
    widget_id = fields.Int(data_key='widget_id', allow_none=True)
