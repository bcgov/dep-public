# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Widget image schema definition."""

from api.models.widget_image import WidgetImage as WidgetImageModel

from .base_schema import BaseSchema


class WidgetImageSchema(BaseSchema):
    """This is the schema for the image model."""

    class Meta(BaseSchema.Meta):  # pylint: disable=too-few-public-methods
        """Images all of the Widget Image fields to a default schema."""

        model = WidgetImageModel
        include_fk = True
        fields = (
            'id',
            'widget_id',
            'engagement_id',
            'image_url',
            'alt_text',
            'description',
        )
