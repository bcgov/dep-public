"""Schema for ContactTranslation serialization and deserialization."""

from marshmallow import EXCLUDE, fields
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from api.models.contact_translation import ContactTranslation


class ContactTranslationSchema(SQLAlchemyAutoSchema):
    """Schema for ContactTranslation."""

    class Meta:
        """ContactTranslationSchema metadata."""

        model = ContactTranslation
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    language_id = fields.Int(required=True)
    contact_id = fields.Int(required=True)
    name = fields.Str(allow_none=True)
    title = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    bio = fields.Str(allow_none=True)
