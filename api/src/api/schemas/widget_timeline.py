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
"""Manager for widget timeline schema."""

from api.models.widget_timeline import WidgetTimeline as WidgetTimelineModel
from api.models.timeline_event import TimelineEvent as TimelineEventModel

from marshmallow_sqlalchemy.fields import Nested
from .base_schema import BaseSchema


class TimelineEventSchema(BaseSchema):  # pylint: disable=too-many-ancestors, too-few-public-methods
    """This is the schema for the timeline event model."""

    class Meta(BaseSchema.Meta):  # pylint: disable=too-few-public-methods
        """All of the fields in the Timeline Event schema."""

        model = TimelineEventModel
        include_fk = True
        fields = ('id', 'engagement_id', 'widget_id', 'timeline_id', 'description', 'time', 'position', 'status')


class WidgetTimelineSchema(BaseSchema):  # pylint: disable=too-many-ancestors, too-few-public-methods
    """This is the schema for the widget timeline model."""

    class Meta(BaseSchema.Meta):  # pylint: disable=too-few-public-methods
        """All of the fields in the Widget Timeline schema."""

        model = WidgetTimelineModel
        include_fk = True
        fields = ('id', 'engagement_id', 'widget_id', 'title', 'description', 'events')

    events = Nested(TimelineEventSchema, many=True)
