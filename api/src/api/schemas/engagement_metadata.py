"""Schemas for serializing and deserializing classes related to engagement metadata."""

from marshmallow import Schema, ValidationError, fields, pre_load, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow_sqlalchemy.fields import Nested

from api.models.engagement_metadata import (
    EngagementMetadata, MetadataTaxon, MetadataTaxonDataType, MetadataTaxonFilterType)


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

    @pre_load
    def check_immutable_fields(self, data, **kwargs):
        """Validate fields."""
        if self.instance:
            if 'id' in data and data['id'] != self.instance.id:
                raise ValidationError('id field cannot be changed.')
            if 'tenant_id' in data and data['tenant_id'] != self.instance.tenant_id:
                raise ValidationError('tenant_id field cannot be changed.')
            if 'engagement_id' in data and data['engagement_id'] != self.instance.engagement_id:
                raise ValidationError('engagement_id field cannot be changed.')
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

    def get_preset_values(self, obj):
        """Serialize the preset_values property for Marshmallow."""
        return obj.preset_values

    def set_preset_values(self, values):
        """Deserialize the preset_values into a list of strings.

        The rest is handled in the preset_values property setter.
        """
        return [str(value) for value in values]

    @pre_load
    def check_immutable_fields(self, data, **kwargs):
        """Check fields."""
        if self.instance:
            if 'id' in data and data['id'] != self.instance.id:
                raise ValidationError('id field cannot be changed.')
            if 'tenant_id' in data and data['tenant_id'] != self.instance.tenant_id:
                raise ValidationError('tenant_id field cannot be changed.')
            if 'position' in data and data['position'] != self.instance.position:
                raise ValidationError('Position field cannot be updated directly;'
                                      ' use a reorder operation instead.')
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
