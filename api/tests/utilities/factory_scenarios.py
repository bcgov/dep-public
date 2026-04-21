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
"""Test Utils.

Test Utility for creating test scenarios.
"""

from datetime import datetime, timedelta
from enum import Enum

from faker import Faker

from api.config import get_named_config
from api.constants.comment_status import Status as CommentStatus
from api.constants.engagement_status import Status as EngagementStatus
from api.constants.engagement_status import SubmissionStatus
from api.constants.timeline_event_status import TimelineEventStatus
from api.constants.feedback import CommentType, FeedbackSourceType, FeedbackStatusType, RatingType
from api.constants.widget import WidgetType
from api.utils.enums import LoginSource, UserStatus


fake = Faker()

CONFIG = get_named_config('testing')


class TestUserInfo(dict, Enum):
    """Test scenarios of user."""

    user = {
        'id': 123,
        'first_name': 'System',
        'status_id': UserStatus.ACTIVE.value,
    }

    user_staff_1 = {
        'first_name': fake.name(),
        'middle_name': fake.name(),
        'last_name': fake.name(),
        'email_address': fake.email(),
        'status_id': UserStatus.ACTIVE.value,
        'tenant_id': '1'
    }

    user_staff_2 = {
        'first_name': fake.name(),
        'middle_name': fake.name(),
        'last_name': fake.name(),
        'email_address': fake.email(),
        'status_id': UserStatus.ACTIVE.value,
        'tenant_id': '2'
    }

    user_staff_3 = {
        'first_name': fake.name(),
        'middle_name': fake.name(),
        'last_name': fake.name(),
        'email_address': fake.email(),
        'status_id': UserStatus.ACTIVE.value,
        'tenant_id': '3'
    }


class TestParticipantInfo(dict, Enum):
    """Test scenarios of participant."""

    participant1 = {
        'email_address': fake.email(),
    }

    participant2 = {
        'email_address': fake.email(),
    }


class TestSurveyInfo(dict, Enum):
    """Test scenarios of Survey."""

    survey1 = {
        'id': 123,
        'name': fake.name(),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'created_by': '123',
        'updated_by': '123',
        'form_json': {'display': 'form', 'components': []},
        'is_hidden': False,
        'is_template': False
    }
    survey2 = {
        'id': 234,
        'name': fake.name(),
        'form_json': {'display': 'form', 'components': []}
    }
    survey3 = {
        'id': 345,
        'name': fake.name(),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'created_by': '123',
        'updated_by': '123',
        'form_json': {'display': 'form', 'components': [{'id': 'ex2zzg', 'key': 'simplecheckboxes',
                                                         'label': fake.name(), 'type': 'simplecheckboxes'}]},
        'is_hidden': False,
        'is_template': False
    }
    hidden_survey = {
        'id': 456,
        'name': fake.name(),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'created_by': '123',
        'updated_by': '123',
        'form_json': {'display': 'form', 'components': []},
        'is_hidden': True,
        'is_template': False
    }
    survey_template = {
        'id': 567,
        'name': fake.name(),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'created_by': '123',
        'updated_by': '123',
        'form_json': {'display': 'form', 'components': []},
        'is_hidden': False,
        'is_template': True
    }


class KeycloakScenario:
    """Keycloak scenario."""

    @staticmethod
    def create_user_request():
        """Return create user request.Sample request just to mock the data."""
        user_name = fake.simple_profile().get('username')
        create_user_request = {
            'username': user_name,
            'email': f'{user_name}@gov.bc.ca',
            'attributes': {},
            'enabled': True
        }

        return create_user_request


class TestTenantInfo(dict, Enum):
    """Test scenarios of tenants."""

    tenant1 = {
        'short_name': 'EAO',
        'name': fake.name(),
        'contact_name': fake.name(),
        'contact_email': fake.email(),
        'description': fake.text(max_nb_chars=300),
        'title': fake.text(max_nb_chars=20),
        'hero_image_url': None,
    }
    tenant2 = {
        'short_name': 'EMLI',
        'name': fake.name(),
        'contact_name': fake.name(),
        'contact_email': fake.email(),
        'description': fake.text(max_nb_chars=300),
        'title': fake.text(max_nb_chars=20),
        'hero_image_url': None,
    }


class TestEngagementInfo(dict, Enum):
    """Test scenarios of engagement."""

    engagement1 = {
        'name': fake.name(),
        'start_date': (datetime.today() - timedelta(days=1)).strftime('%Y-%m-%d'),
        'end_date': (datetime.today() + timedelta(days=1)).strftime('%Y-%m-%d'),
        'banner_url': '',
        'created_by': '123',
        'updated_by': '123',
        'status': EngagementStatus.Published.value,
        'is_internal': False,
        'description': 'My Test Engagement Description',
        'feedback_heading': 'My Feedback Heading',
        'feedback_body': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Feedback Body\",\
        \"type\":\"unstyled\",\
        \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'rich_description': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Rich Description Sample\",\
        \"type\":\"unstyled\",\
        \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'description_title': 'My Test Description Title',
        'surveys': [TestSurveyInfo.survey1],
    }

    engagement_draft = {
        'name': fake.name(),
        'start_date': (datetime.today() - timedelta(days=1)).strftime('%Y-%m-%d'),
        'end_date': (datetime.today() + timedelta(days=1)).strftime('%Y-%m-%d'),
        'banner_url': '',
        'created_by': '123',
        'updated_by': '123',
        'status': EngagementStatus.Draft.value,
        'is_internal': False,
        'description': 'My Test Engagement Description',
        'rich_description': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Rich Description Sample\",\
            \"type\":\"unstyled\",\
            \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'description_title': 'My Test Description Title',
        'content': 'Content Sample',
        'rich_content': '"{\"blocks\":[{\"key\":\"fclgj\",\"text\":\"Rich Content Sample\",\
            \"type\":\"unstyled\",\"depth\":0,\
            \"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"'
    }

    engagement2 = {
        'name': fake.name(),
        'start_date': (datetime.today() - timedelta(days=1)).strftime('%Y-%m-%d'),
        'end_date': (datetime.today() + timedelta(days=1)).strftime('%Y-%m-%d'),
        'banner_url': '',
        'created_by': '123',
        'updated_by': '123',
        'status': SubmissionStatus.Open.value,
        'is_internal': False,
        'feedback_heading': 'My Feedback Heading 2',
        'surveys': [TestSurveyInfo.survey1],
        'feedback_body': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Feedback Body 2\",\
        \"type\":\"unstyled\",\
        \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'description': 'My Test Engagement Description',
        'rich_description': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Rich Description Sample\",\
            \"type\":\"unstyled\",\
            \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'description_title': 'My Test Description Title',
        'content': 'Content Sample',
        'rich_content': '"{\"blocks\":[{\"key\":\"fclgj\",\"text\":\"Rich Content Sample\",\
            \"type\":\"unstyled\",\"depth\":0,\
            \"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'status_block': [{
            'survey_status': 'Upcoming',
            'block_text': '{\"blocks\":[{\"key\":\"fclgj\",\"text\":\"Rich Content Sample\",\
            \"type\":\"unstyled\",\"depth\":0,\
            \"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"'
        }
        ]
    }

    engagement3 = {
        'name': fake.name(),
        'start_date': (datetime.today() - timedelta(days=1)).strftime('%Y-%m-%d'),
        'end_date': (datetime.today() + timedelta(days=1)).strftime('%Y-%m-%d'),
        'banner_url': '',
        'tenant_id': 1,
        'created_by': '123',
        'updated_by': '123',
        'status': SubmissionStatus.Open.value,
        'is_internal': False,
        'feedback_heading': 'My Feedback Heading 3',
        'surveys': [TestSurveyInfo.survey1],
        'feedback_body': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Feedback Body 3\",\
        \"type\":\"unstyled\",\
        \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'description': 'My Test Engagement Description',
        'rich_description': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Rich Description Sample\",\
            \"type\":\"unstyled\",\
            \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'description_title': 'My Test Description Title',
    }


class TestEngagementMetadataInfo(dict, Enum):
    """Test data for engagement metadata."""

    metadata0 = {
        'engagement_id': None,
        'taxon_id': None,
        'value': fake.name()
    }
    metadata1 = {
        'engagement_id': 1,
        'taxon_id': 1,
        'value': fake.name()
    }
    metadata2 = {
        'engagement_id': 1,
        'taxon_id': 2,
        'value': fake.name()
    }
    metadata3 = {
        'engagement_id': 1,
        'taxon_id': 2,
        'value': fake.name()
    }
    metadata4 = {
        'engagement_id': 2,
        'taxon_id': 1,
        'value': fake.name()
    }


class TestEngagementMetadataTaxonInfo(dict, Enum):
    """Test data for engagement metadata taxa."""

    taxon1 = {
        'name': fake.name(),
        'description': fake.text(max_nb_chars=256),
        'data_type': 'text',
        'freeform': True,
        'one_per_engagement': False,
    }

    taxon2 = {
        'name': fake.name(),
        'description': fake.text(max_nb_chars=256),
        'data_type': 'long_text',
        'freeform': True,
        'one_per_engagement': False,
    }

    taxon3 = {
        'name': fake.name(),
        'description': fake.text(max_nb_chars=256),
        'data_type': 'text',
        'freeform': False,
        'one_per_engagement': True,
    }

    filterable_taxon1 = {
        'name': fake.name(),
        'description': fake.text(max_nb_chars=256),
        'data_type': 'text',
        'freeform': True,
        'one_per_engagement': False,
        'filter_type': 'chips_all',
        'include_freeform': True
    }

    filterable_taxon2 = {
        'name': fake.name(),
        'description': fake.text(max_nb_chars=256),
        'data_type': 'text',
        'freeform': False,
        'one_per_engagement': False,
        'filter_type': 'chips_all',
        'include_freeform': False
    }

    filterable_taxon3 = {
        'name': fake.name(),
        'description': fake.text(max_nb_chars=256),
        'data_type': 'text',
        'freeform': False,
        'one_per_engagement': False,
        'filter_type': 'chips_any',
        'include_freeform': False
    }

    filterable_taxon4 = {
        'name': fake.name(),
        'description': fake.text(max_nb_chars=256),
        'data_type': 'text',
        'freeform': True,
        'one_per_engagement': False,
        'filter_type': 'chips_any',
        'include_freeform': True
    }


class TestFeedbackInfo(dict, Enum):
    """Test scenarios of feedback."""

    feedback1 = {
        'status': FeedbackStatusType.Unreviewed,
        'comment': 'A feedback comment',
        'rating': RatingType.Satisfied,
        'comment_type': CommentType.Idea,
        'source': FeedbackSourceType.Public,
    }


class TestJwtClaims(dict, Enum):
    """Test scenarios of jwt claims."""

    no_role = {
        'iss': getattr(CONFIG, 'JWT_OIDC_TEST_ISSUER'),
        'aud': getattr(CONFIG, 'JWT_OIDC_TEST_AUDIENCE'),
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302065',
        'firstname': fake.first_name(),
        'lastname': fake.last_name(),
        'preferred_username': fake.user_name(),
        'client_roles': [
        ]
    }

    public_user_role = {
        'iss': getattr(CONFIG, 'JWT_OIDC_TEST_ISSUER'),
        'aud': getattr(CONFIG, 'JWT_OIDC_TEST_AUDIENCE'),
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'preferred_username': fake.user_name(),
        'email': fake.email(),
        'tenant_id': 1,
        'client_roles': [
            'public_user'
        ]
    }

    system_admin_role = {
        'iss': getattr(CONFIG, 'JWT_OIDC_TEST_ISSUER'),
        'aud': getattr(CONFIG, 'JWT_OIDC_TEST_AUDIENCE'),
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'idp_userid': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'preferred_username': f'{fake.user_name()}@idir',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'tenant_id': 1,
        'email': 'staff@gov.bc.ca',
        'identity_provider': LoginSource.IDIR.value,
        'client_roles': [
            'super_admin'
        ]
    }

    staff_admin_role = {
        'iss': getattr(CONFIG, 'JWT_OIDC_TEST_ISSUER'),
        'aud': getattr(CONFIG, 'JWT_OIDC_TEST_AUDIENCE'),
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'idp_userid': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'preferred_username': f'{fake.user_name()}@idir',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'tenant_id': 1,
        'email': 'staff@gov.bc.ca',
        'identity_provider': LoginSource.IDIR.value,
        'client_roles': []
    }
    team_member_role = {
        'iss': getattr(CONFIG, 'JWT_OIDC_TEST_ISSUER'),
        'aud': getattr(CONFIG, 'JWT_OIDC_TEST_AUDIENCE'),
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'idp_userid': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'preferred_username': f'{fake.user_name()}@idir',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'email': 'staff@gov.bc.ca',
        'identity_provider': LoginSource.IDIR.value,
        'tenant_id': 1,
        'client_roles': []
    }

    reviewer_role = {
        'iss': getattr(CONFIG, 'JWT_OIDC_TEST_ISSUER'),
        'aud': getattr(CONFIG, 'JWT_OIDC_TEST_AUDIENCE'),
        'sub': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'idp_userid': 'f7a4a1d3-73a8-4cbc-a40f-bb1145302064',
        'preferred_username': f'{fake.user_name()}@idir',
        'given_name': fake.first_name(),
        'family_name': fake.last_name(),
        'email': 'staff@gov.bc.ca',
        'identity_provider': LoginSource.IDIR.value,
        'tenant_id': 1,
        'client_roles': []
    }


class TestWidgetInfo(dict, Enum):
    """Test scenarios of widget."""

    widget1 = {
        'widget_type_id': WidgetType.WHO_IS_LISTENING.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 1,
    }
    widget2 = {
        'widget_type_id': WidgetType.DOCUMENTS.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 2,
    }
    widget_events = {
        'widget_type_id': WidgetType.EVENTS.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 3,
    }
    widget_subscribe = {
        'widget_type_id': WidgetType.SUBSCRIBE.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 1,
    }
    widget_map = {
        'widget_type_id': WidgetType.Map.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 2,
    }
    widget_video = {
        'widget_type_id': WidgetType.Video.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 3,
    }
    widget_timeline = {
        'widget_type_id': WidgetType.Timeline.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 1,
    }
    widget_image = {
        'widget_type_id': WidgetType.Image.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 2,
    }
    widget_listening = {
        'widget_type_id': WidgetType.WHO_IS_LISTENING.value,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'location': 3,
    }


class TestWidgetItemInfo(dict, Enum):
    """Test scenarios of widget item."""

    widget_item1 = {
        'widget_data_id': 1,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
    }

    widget_item2 = {
        'widget_data_id': 2,
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
    }


class TestContactInfo(dict, Enum):
    """Test scenarios of contact."""

    contact1 = {
        'name': fake.name(),
        'title': fake.job(),
        'phone_number': fake.phone_number(),
        'email': fake.email(),
        'address': fake.address(),
        'bio': fake.paragraph(nb_sentences=3),
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'tenant_id': 1
    }


class TestSubmissionInfo(dict, Enum):
    """Test scenarios of submission."""

    submission1 = {
        'submission_json': {'simpletextarea': fake.paragraph(nb_sentences=3)},
        'created_by': '123',
        'updated_by': '123',
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'comment_status_id': CommentStatus.Pending.value,
        'review_by': 'John Doe',
        'review_date': datetime.now().strftime('%Y-%m-%d'),
    }

    approved_submission = {
        'submission_json': {'simpletextarea': fake.paragraph(nb_sentences=3)},
        'created_by': str(fake.pyint()),
        'updated_by': str(fake.pyint()),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'comment_status_id': CommentStatus.Approved.value,
        'review_by': fake.first_name(),
        'review_date': datetime.now().strftime('%Y-%m-%d'),
    }

    rejected_submission = {
        'submission_json': {'simpletextarea': fake.paragraph(nb_sentences=3)},
        'created_by': str(fake.pyint()),
        'updated_by': str(fake.pyint()),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'comment_status_id': CommentStatus.Rejected.value,
        'review_by': fake.first_name(),
        'review_date': datetime.now().strftime('%Y-%m-%d'),
    }

    pending_submission = {
        'submission_json': {'simpletextarea': fake.paragraph(nb_sentences=3)},
        'created_by': str(fake.pyint()),
        'updated_by': str(fake.pyint()),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'comment_status_id': CommentStatus.Pending.value,
        'review_by': fake.first_name(),
        'review_date': datetime.now().strftime('%Y-%m-%d'),
    }

    needs_further_review_submission = {
        'submission_json': {'simpletextarea': fake.paragraph(nb_sentences=3)},
        'created_by': str(fake.pyint()),
        'updated_by': str(fake.pyint()),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'updated_date': datetime.now().strftime('%Y-%m-%d'),
        'comment_status_id': CommentStatus.Needs_further_review.value,
        'review_by': fake.first_name(),
        'review_date': datetime.now().strftime('%Y-%m-%d'),
    }


class TestCommentInfo(dict, Enum):
    """Test scenarios of comment."""

    comment1 = {
        'text': fake.paragraph(nb_sentences=3),
        'component_id': 'simpletext',
        'submission_date': datetime.now().strftime('%Y-%m-%d'),
    }


class TestEventInfo(dict, Enum):
    """Test scenarios of event."""

    event_meetup = {
        'title': fake.name(),
        'type': 'MEETUP',
        'items': [
            {
                'event_name': 'An amazing meetup',
                'description': fake.name(),
                'venue': 'Online',
                'location_address': 'location_address',
                'location_name': 'Anywhere',
                'start_date': datetime.now().strftime('%Y-%m-%d'),
                'end_date': (datetime.now() + timedelta(weeks=+1)).strftime('%Y-%m-%d'),
                'url': fake.url(),
                'url_label': fake.name(),
            }
        ]
    }

    event_openhouse = {
        'title': fake.name(),
        'type': 'OPENHOUSE',
        'items': [
            {
                'event_name': 'An amazing openhouse',
                'description': fake.name(),
                'venue': 'Online',
                'location_address': 'location_address',
                'location_name': 'Anywhere',
                'start_date': datetime.now().strftime('%Y-%m-%d'),
                'end_date': (datetime.now() + timedelta(weeks=+1)).strftime('%Y-%m-%d'),
                'url': fake.url(),
                'url_label': fake.name(),
            }
        ]
    }

    event_virtual = {
        'title': fake.name(),
        'type': 'VIRTUAL',
        'items': [
            {
                'event_name': 'An amazing virtual event',
                'description': fake.name(),
                'venue': 'Online',
                'location_address': '',
                'location_name': '',
                'start_date': datetime.now().strftime('%Y-%m-%d'),
                'end_date': (datetime.now() + timedelta(weeks=+1)).strftime('%Y-%m-%d'),
                'url': fake.url(),
                'url_label': fake.name(),
            }
        ]
    }


class TestWidgetDocumentInfo(dict, Enum):
    """Test scenarios of document."""

    document1 = {
        'id': '4',
        'title': fake.word(),
        'type': 'folder',
        'parent_document_id': None,
        'url': None,
        'sort_index': 1,
    }

    document2 = {
        'id': '2',
        'title': fake.file_name(extension='pdf'),
        'type': 'file',
        'parent_document_id': None,
        'url': fake.image_url(),
        'sort_index': 1,
    }

    document3 = {
        'id': '3',
        'title': fake.file_name(extension='pdf'),
        'type': 'file',
        'parent_document_id': None,
        'url': fake.image_url(),
        'sort_index': 1,
    }


class TestEngagementSlugInfo(dict, Enum):
    """Test scenarios of feedback."""

    slug1 = {
        'engagement_id': 1,
        'slug': fake.text(max_nb_chars=20),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
    }


class TestReportSettingInfo(dict, Enum):
    """Test scenarios of feedback."""

    report_setting_1 = {
        'created_by': str(fake.pyint()),
        'created_date': datetime.now().strftime('%Y-%m-%d'),
        'display': True,
        'id': 1,
        'question': 'What is your opinion about this?',
        'question_id': str(fake.pyint()),
        'question_key': 'simpletextarea',
        'question_type': 'simpletextarea',
        'survey_id': 1,
        'updated_by': str(fake.pyint()),
        'updated_date': datetime.now().strftime('%Y-%m-%d')
    }


class TestSubscribeInfo(Enum):
    """Test scenarios of subscribe."""

    subscribe_info_1 = {
        'widget_id': 1,
        'type': 'EMAIL_LIST',
        'items': [
            {
                'description': '{\"blocks\":[{\"key\":\"2ku94\",\"text\":\
                    "Rich Description Sample\",\"type\":\"unstyled\", \
                    "depth\":0,\"inlineStyleRanges\":[],\
                    "entityRanges\":[],\"data\":{}}],\"entityMap\":{}}',
                'call_to_action_type': 'link',
                'call_to_action_text': 'Click here to sign up',
                'form_type': 'EMAIL_LIST'
            }
        ]
    }

    subscribe_info_2 = {
        'widget_id': 1,
        'type': 'SIGN_UP',
        'items': [
            {
                'description': '{\"blocks\":[{\"key\":\"2ku94\",\"text\":\
                    "Rich Description Sample\",\"type\":\"unstyled\", \
                    "depth\":0,\"inlineStyleRanges\":[],\
                    "entityRanges\":[],\"data\":{}}],\"entityMap\":{}}',
                'call_to_action_type': 'link',
                'call_to_action_text': 'Click here to sign up',
                'form_type': 'SIGN_UP'
            }
        ]
    }


class TestWidgetMap(dict, Enum):
    """Test scenarios of video widget."""

    map1 = {
        'longitude': fake.longitude(),
        'latitude': fake.latitude(),
        'marker_label': fake.name()
    }

    map2 = {
        'longitude': fake.longitude(),
        'latitude': fake.latitude(),
        'marker_label': fake.name()
    }


class TestWidgetVideo(dict, Enum):
    """Test scenarios of video widget."""

    video1 = {
        'id': '1',
        'video_url': fake.url(),
        'description': fake.text(max_nb_chars=50),
    }


class TestWidgetListening(dict, Enum):
    """Test scenarios of Who is Listening widget."""

    listening1 = {
        'id': '1',
        'description': fake.text(max_nb_chars=50),
    }


class TestTimelineInfo(dict, Enum):
    """Test scenarios of event."""

    widget_timeline = {
        'title': fake.name(),
        'description': fake.text(max_nb_chars=50),
    }

    timeline_event = {
        'timeline_id': '1',
        'description': fake.text(max_nb_chars=50),
        'time': datetime.now().strftime('%Y-%m-%d'),
        'position': 1,
        'status': TimelineEventStatus.Pending.value
    }


class TestWidgetPollInfo(dict, Enum):
    """Test scenarios of widget polls."""

    poll1 = {
        'title': fake.sentence(),
        'description': fake.text(),
        'status': 'active',
        'engagement_id': 1  # Placeholder, should be replaced with actual engagement ID in tests
    }

    poll2 = {
        'title': fake.sentence(),
        'description': fake.text(),
        'status': 'inactive',
        'engagement_id': 1  # Placeholder, should be replaced with actual engagement ID in tests
    }

    poll3 = {
        'title': fake.sentence(),
        'description': fake.text(),
        'status': 'active',
        'engagement_id': 2  # Placeholder, should be replaced with another engagement ID in tests
    }


class TestPollAnswerInfo(dict, Enum):
    """Test scenarios for poll answers."""

    answer1 = {
        'answer_text': 'Answer 1'
    }

    answer2 = {
        'answer_text': 'Answer 2'
    }

    answer3 = {
        'answer_text': 'Answer 3'
    }


class TestPollResponseInfo(dict, Enum):
    """Test scenarios for poll responses."""

    response1 = {
        'participant_id': fake.uuid4(),
        'selected_answer_id': 1,  # should be replaced with an actual answer ID in tests
        'poll_id': 1,            # should be replaced with an actual poll ID in tests
        'widget_id': 1,          # Placeholder, should be replaced with an actual widget ID in tests
    }

    response2 = {
        'participant_id': fake.uuid4(),
        'selected_answer_id': 2,  # should be replaced with an actual answer ID in tests
        'poll_id': 1,            # should be replaced with an actual poll ID in tests
        'widget_id': 1,          # should be replaced with an actual widget ID in tests
    }


class TestEngagementDetailsTabsInfo(dict, Enum):
    """Test scenarios of engagement details tabs."""

    details_tab1 = {
        'id': 1,
        'engagement_id': 1,
        'heading': 'This is a heading',
        'label': 'Tab Label',
        'slug': 'tab_label',
        'sort_index': 0,
        'body': '{"blocks":[{"key":"fclgj","text":"Rich Content Sample",\
            "type":"unstyled","depth":0,\
            "inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    }
    details_tab2 = {
        'id': 2,
        'engagement_id': 1,
        'heading': 'This is another heading',
        'label': 'Tab Label 2',
        'slug': 'tab_label_2',
        'sort_index': 1,
        'body': '{"blocks":[{"key":"fclgj","text":"Another Rich Content Sample",\
            "type":"unstyled","depth":0,\
            "inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    }


class TestLanguageInfo(dict, Enum):
    """Test scenarios of language."""

    language1 = {
        'name': 'Spanish',
        'code': 'en',
        'right_to_left': False,
    }


class TestWidgetTranslationInfo(dict, Enum):
    """Test scenarios of widget translation content."""

    widgettranslation1 = {
        'title': fake.text(max_nb_chars=20),
        'map_marker_label': fake.text(max_nb_chars=20),
    }


class TestSurveyTranslationInfo(dict, Enum):
    """Test scenarios of Survey Translation."""

    survey_translation1 = {
        'survey_id': 1,
        'language_id': 2,
        'name': 'Survey Name',
        'form_json': '{"question": "What is your name?"}'
    }


class TestPollAnswerTranslationInfo(dict, Enum):
    """Test scenarios of Poll Answer Translation."""

    translation1 = {
        'poll_answer_id': 1,
        'language_id': 2,
        'answer_text': 'Answer 1'
    }


class TestSubscribeItemTranslationInfo(dict, Enum):
    """Test scenarios of Subscribe Item Translation."""

    translate_info1 = {
        'subscribe_item_id': 1,
        'language_id': 2,
        'description': fake.text(),
    }


class TestEventItemTranslationInfo(dict, Enum):
    """Test scenarios of Event Item Translation."""

    event_item_info1 = {
        'event_item_id': 1,
        'language_id': 2,
        'event_name': 'An amazing event',
        'description': fake.text(),
        'location_name': 'Location name',
        'location_address': 'location address',
        'url': fake.url(),
        'url_label': fake.name(),
    }


class TestTimelineEventTranslationInfo(dict, Enum):
    """Test scenarios of TimeLine Event Translation."""

    timeline_event_info1 = {
        'timeline_event_id': 1,
        'language_id': 2,
        'description': fake.text(),
        'time': datetime.now().strftime('%Y-%m-%d'),
    }


class TestEngagementTranslationInfo(dict, Enum):
    """Test scenarios of engagement translation content."""

    engagementtranslation1 = {
        'name': fake.text(max_nb_chars=20),
        'description': fake.text(max_nb_chars=20),
        'rich_description': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Rich Description Sample\",\
            \"type\":\"unstyled\",\
            \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'content': 'Content Sample',
        'rich_content': '"{\"blocks\":[{\"key\":\"fclgj\",\"text\":\"Rich Content Sample\",\
            \"type\":\"unstyled\",\"depth\":0,\
            \"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
        'description_title': 'My Test Description Title',
        'feedback_heading': 'My Feedback Heading 4',
        'surveys': [TestSurveyInfo.survey1],
        'feedback_body': '"{\"blocks\":[{\"key\":\"2ku94\",\"text\":\"Feedback Body 4\",\
        \"type\":\"unstyled\",\
        \"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
    }


class TestEngagementDetailsTabTranslationInfo(dict, Enum):
    """Test scenarios of engagement details tab translation content."""

    translation_info1 = {
        'engagement_details_tab_id': 1,
        'language_id': 49,
        'label': fake.text(max_nb_chars=20),
        'slug': fake.text(max_nb_chars=20),
        'heading': fake.text(max_nb_chars=60),
        'body': '"{\"blocks\":[{\"key\":\"fclgj\",\"text\":\"Rich Content Sample\",\
            \"type\":\"unstyled\",\"depth\":0,\
            \"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}],\"entityMap\":{}}"',
    }
