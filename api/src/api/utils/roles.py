# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Role definitions."""
from enum import Enum


class Role(Enum):
    """User Role."""

    PUBLIC_USER = 'public_user'
    ANONYMOUS_USER = 'anonymous_user'

    # STAFF Based roles
    CREATE_TENANT = 'create_tenant'
    VIEW_USERS = 'view_users'
    TOGGLE_USER_STATUS = 'toggle_user_status'
    CREATE_ADMIN_USER = 'create_admin_user'
    UPDATE_USER_GROUP = 'update_user_group'
    CREATE_ENGAGEMENT = 'create_engagement'
    VIEW_SURVEYS = 'view_surveys'
    CREATE_SURVEY = 'create_survey'
    EDIT_SURVEY = 'edit_survey'
    CLONE_SURVEY = 'clone_survey'
    PUBLISH_ENGAGEMENT = 'publish_engagement'
    VIEW_ENGAGEMENT = 'view_engagement'
    VIEW_ASSIGNED_ENGAGEMENTS = 'view_assigned_engagements'
    VIEW_PRIVATE_ENGAGEMENTS = 'view_private_engagements'
    EDIT_ENGAGEMENT = 'edit_engagement'
    REVIEW_COMMENTS = 'review_comments'
    REVIEW_ALL_COMMENTS = 'review_all_comments'
    ACCESS_DASHBOARD = 'access_dashboard'
    VIEW_MEMBERS = 'view_members'
    EDIT_MEMBERS = 'edit_members'
    VIEW_ALL_SURVEYS = 'view_all_surveys'  # Administrator can view all kind of surveys including hidden
    EDIT_ALL_SURVEYS = 'edit_all_surveys'
    EDIT_DRAFT_ENGAGEMENT = 'edit_draft_engagement'
    EDIT_SCHEDULED_ENGAGEMENT = 'edit_scheduled_engagement'
    EDIT_UPCOMING_ENGAGEMENT = 'edit_upcoming_engagement'
    EDIT_OPEN_ENGAGEMENT = 'edit_open_engagement'
    EDIT_CLOSED_ENGAGEMENT = 'edit_closed_engagement'
    VIEW_APPROVED_COMMENTS = 'view_approved_comments'  # used just in the front end to show the comment page
    VIEW_FEEDBACKS = 'view_feedbacks'
    VIEW_ALL_ENGAGEMENTS = 'view_all_engagements'  # Allows user access to all engagements including draft
    SHOW_ALL_COMMENT_STATUS = 'show_all_comment_status'  # Allows user to see all comment status
    VIEW_ALL_SURVEY_RESULTS = 'view_all_survey_results'  # Allows users to view results to all questions
    UNPUBLISH_ENGAGEMENT = 'unpublish_engagement'
    EXPORT_ALL_TO_CSV = 'export_all_to_csv'
    EXPORT_INTERNAL_COMMENT_SHEET = 'export_internal_comment_sheet'
    EXPORT_PROPONENT_COMMENT_SHEET = 'export_proponent_comment_sheet'
    SUPER_ADMIN = 'super_admin'
    MANAGE_METADATA = 'manage_metadata'
    VIEW_LANGUAGES = 'view_languages'
    EDIT_LANGUAGES = 'edit_languages'
    SYSTEM = 'system'  # System user role for EPIC connections
