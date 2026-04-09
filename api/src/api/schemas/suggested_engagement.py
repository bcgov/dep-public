"""Suggested engagement schema class.

Represents an individual suggested engagement.
"""
from marshmallow import EXCLUDE, Schema, ValidationError, fields, pre_load, validate, validates_schema

from api.services.object_storage_service import ObjectStorageService
from api.utils.submission_status import get_submission_status


class SuggestedEngagementSyncItemSchema(Schema):
    """Schema for create/sync payload items."""

    class Meta:
        """Exclude unknown fields."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id', allow_none=True)
    suggested_engagement_id = fields.Int(data_key='suggested_engagement_id', required=True)
    sort_index = fields.Int(
        data_key='sort_index',
        required=True,
        validate=validate.Range(min=1, error='sort_index must be 1 or greater'),
    )

    @pre_load(pass_collection=True)
    def normalize_sort_index(self, data, many, **kwargs):
        """Normalize sort_index from payload order when omitted."""
        rows = data if many else [data]
        normalized_rows = []
        for index, row in enumerate(rows, start=1):
            item = dict(row)
            item.setdefault('sort_index', index)
            normalized_rows.append(item)
        return normalized_rows if many else normalized_rows[0]

    @validates_schema(pass_collection=True)
    def validate_uniqueness(self, data, many, **kwargs):
        """Ensure payload does not contain duplicate slots or duplicate targets."""
        rows = data if many else [data]
        slots = [row['sort_index'] for row in rows]
        targets = [row['suggested_engagement_id'] for row in rows]

        if len(slots) != len(set(slots)):
            raise ValidationError('Duplicate sort_index values are not allowed', field_name='sort_index')
        if len(targets) != len(set(targets)):
            raise ValidationError(
                'Duplicate suggested_engagement_id values are not allowed',
                field_name='suggested_engagement_id',
            )


class SuggestedEngagementAttachment(Schema):
    """Schema for attached engagement data."""

    _object_storage = ObjectStorageService()

    id = fields.Int(data_key='id')
    name = fields.Str(data_key='name', required=True, validate=validate.Length(min=1, error='Name cannot be blank'))
    description = fields.Str(data_key='description')
    rich_description = fields.Str(data_key='rich_description')
    description_title = fields.Str(data_key='description_title')
    start_date = fields.Date(data_key='start_date', required=True)
    end_date = fields.Date(data_key='end_date', required=True)
    submission_status = fields.Function(lambda obj: get_submission_status(obj))
    banner_filename = fields.Str(data_key='banner_filename')
    banner_url = fields.Method('get_banner_url', data_key='banner_url')
    tenant_id = fields.Int(data_key='tenant_id')
    is_internal = fields.Bool(data_key='is_internal')
    consent_message = fields.Str(data_key='consent_message')
    sponsor_name = fields.Str(data_key='sponsor_name')

    def get_banner_url(self, obj):
        """Return the object storage URL for the banner image."""
        banner_filename = getattr(obj, 'banner_filename', None)
        if banner_filename is None and isinstance(obj, dict):
            banner_filename = obj.get('banner_filename')
        return self._object_storage.get_url(banner_filename)


class SuggestedEngagementWithAttachment(Schema):
    """Schema for a suggested engagement with the engagement data attached."""

    class Meta:
        """Exclude unknown fields."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id')
    engagement_id = fields.Int(data_key='engagement_id')
    suggested_engagement_id = fields.Int(data_key='suggested_engagement_id')
    sort_index = fields.Int(data_key='sort_index')
    engagement = fields.Nested(SuggestedEngagementAttachment, attribute='suggested_engagement')


class SuggestedEngagementSchema(Schema):
    """Schema for suggested engagement."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id')
    engagement_id = fields.Int(data_key='engagement_id')
    suggested_engagement_id = fields.Int(data_key='suggested_engagement_id')
    sort_index = fields.Int(data_key='sort_index')
