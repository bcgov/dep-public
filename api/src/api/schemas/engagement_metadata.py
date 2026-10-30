"""Schemas for serializing and deserializing classes related to engagement metadata."""

from marshmallow import Schema, ValidationError, fields, pre_load, validate, validates_schema
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow_sqlalchemy.fields import Nested

from api.models.engagement_metadata import (
    EngagementMetadata, MetadataTaxon, MetadataTaxonDataType, MetadataTaxonFilterType)


def _check_value_unchanged(key, instance, data):
    if key in data and data[key] != getattr(instance, key):
        raise ValidationError(f'{key} field cannot be changed.')


def _check_required_value_unchanged(key, instance, data):
    if getattr(instance, 'is_required', False) and key in data and data[key] != getattr(instance, key):
        raise ValidationError(f'{key} field cannot be changed for required taxa.')


class EngagementMetadataSchema(SQLAlchemyAutoSchema):
    """Schema for engagement metadata."""

    class Meta:
        """Initialize values."""

        model = EngagementMetadata
        load_instance = True
        include_fk = True  # Include foreign keys in the schema
        include_relationships = True

    value = fields.String(validate=validate.Length(max=512))
    taxon_id = fields.Integer(required=True)
    position = fields.Integer(required=False)

    @pre_load
    def check_immutable_fields(self, data, **kwargs):
        """Validate fields."""
        if self.instance:
            _check_value_unchanged('id', self.instance, data)
            _check_value_unchanged('tenant_id', self.instance, data)
            _check_value_unchanged('engagement_id', self.instance, data)
        return data

    # Nested fields
    taxon = Nested('MetadataTaxonSchema', many=False,
                   exclude=['entries'])


class MetadataTaxonSchema(SQLAlchemyAutoSchema):
    """Schema for metadata taxa."""

    class Meta:
        """Initialize values."""

        model = MetadataTaxon
        load_instance = True
        include_fk = True

    name = fields.String(required=True, validate=validate.Length(max=64))
    description = fields.String(
        validate=validate.Length(max=512), allow_none=True)
    freeform = fields.Boolean()
    default_value = fields.String(
        validate=validate.Length(max=512), allow_none=True)
    data_type = fields.String(validate=validate.OneOf(
        [e.value for e in MetadataTaxonDataType]))
    one_per_engagement = fields.Boolean()
    position = fields.Integer(required=False)
    preset_values = fields.Method(
        'get_preset_values', deserialize='set_preset_values')
    filter_type = fields.String(
        validate=validate.OneOf([e.value for e in MetadataTaxonFilterType]), allow_none=True)
    include_freeform = fields.Boolean()
    is_required = fields.Boolean()
    wildcard_enabled = fields.Boolean()
    wildcard_name = fields.String(
        validate=validate.Length(max=64), allow_none=True)

    def get_preset_values(self, obj):
        """Serialize the preset_values property for Marshmallow."""
        return obj.preset_values

    def set_preset_values(self, values):
        """Deserialize the preset_values into a list of strings.

        The rest is handled in the preset_values property setter.
        """
        return values

    @validates_schema
    def validate_wildcard(self, data, **kwargs):
        """Validate wildcard settings against the taxon's supported select types."""
        instance = self.instance
        data_type = data.get('data_type', getattr(instance, 'data_type', None))
        wildcard_enabled = data.get(
            'wildcard_enabled', getattr(instance, 'wildcard_enabled', False))
        wildcard_name = data.get(
            'wildcard_name', getattr(instance, 'wildcard_name', None))
        preset_values = data.get(
            'preset_values',
            getattr(instance, 'preset_values', []),
        )

        if not wildcard_enabled:
            return
        if data_type not in {'text', 'number', 'url', 'email', 'phone', 'geo_area'}:
            raise ValidationError(
                'Wildcards are only supported for select-compatible data types.',
                field_name='wildcard_enabled',
            )
        if not isinstance(wildcard_name, str) or not wildcard_name.strip():
            raise ValidationError(
                'A wildcard name is required when the wildcard is enabled.',
                field_name='wildcard_name',
            )
        wildcard_name = wildcard_name.strip()
        if wildcard_name in preset_values:
            raise ValidationError(
                'The wildcard name cannot match a preset value.',
                field_name='wildcard_name',
            )
        data['wildcard_name'] = wildcard_name

    @pre_load
    def check_immutable_fields(self, data, **kwargs):
        """Check fields."""
        if self.instance:
            _check_value_unchanged('id', self.instance, data)
            _check_value_unchanged('tenant_id', self.instance, data)
            _check_value_unchanged('position', self.instance, data)
            _check_value_unchanged('is_required', self.instance, data)

            _check_required_value_unchanged('name', self.instance, data)
            _check_required_value_unchanged('data_type', self.instance, data)
        return data

    # Nested field
    entries = Nested(EngagementMetadataSchema, many=True,
                     exclude=['taxon', 'engagement'])


class MetadataTaxonFilterSchema(Schema):
    """Schema for metadata taxon filters."""

    taxon_id = fields.Integer(required=True)
    name = fields.String(required=False)
    values = fields.List(fields.String(), required=True)
    filter_type = fields.String(required=True, validate=validate.OneOf(
        [e.value for e in MetadataTaxonFilterType]))
    wildcard_name = fields.String(required=False, allow_none=True)
