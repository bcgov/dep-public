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
"""Manager for widget map schema."""

from api.models.widget_map import WidgetMap as WidgetMapModel

from .base_schema import BaseSchema


class WidgetMapSchema(BaseSchema):  # pylint: disable=too-many-ancestors, too-few-public-methods
    """This is the schema for the map model."""

    class Meta(BaseSchema.Meta):  # pylint: disable=too-few-public-methods
        """Maps all of the Widget Map fields to a default schema."""

        model = WidgetMapModel
        include_fk = True
        fields = ('id', 'widget_id', 'engagement_id', 'marker_label', 'latitude', 'longitude', 'geojson', 'file_name')
