"""Tenant schema class."""

from marshmallow import EXCLUDE, Schema, fields, post_dump

from api.services.object_storage_service import ObjectStorageService


class TenantSchema(Schema):
    """Schema for tenant."""

    _object_storage = ObjectStorageService()

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    name = fields.Str(data_key='name')
    short_name = fields.Str(data_key='short_name')
    description = fields.Str(data_key='description')
    title = fields.Str(data_key='title')
    hero_image_url = fields.Str(data_key='hero_image_url')
    contact_name = fields.Str(data_key='contact_name')
    contact_email = fields.Str(data_key='contact_email')
    hero_image_credit = fields.Str(data_key='hero_image_credit')
    hero_image_description = fields.Str(data_key='hero_image_description')

    @post_dump(pass_collection=True)
    def _attach_hero_image_url(self, data, many, **kwargs):
        if not many:
            hero_image_url = data.get('hero_image_url')
            if hero_image_url:
                data['hero_image_url'] = self._object_storage.get_url(hero_image_url)
            return data

        for item in data:
            hero_image_url = item.get('hero_image_url')
            if hero_image_url:
                item['hero_image_url'] = self._object_storage.get_url(hero_image_url)

        return data
