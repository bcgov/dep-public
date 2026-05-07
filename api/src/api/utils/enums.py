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
"""Enum definitions."""
from enum import Enum, IntEnum


class ContentType(Enum):
    """Http Content Types."""

    JSON = 'application/json'
    FORM_URL_ENCODED = 'application/x-www-form-urlencoded'
    PDF = 'application/pdf'


class AuthHeaderType(Enum):
    """Authorization header types."""

    BASIC = 'Basic {}'
    BEARER = 'Bearer {}'


class WidgetDocumentType(Enum):
    """Document Types."""

    FILE = 'file'
    FOLDER = 'folder'


class MembershipStatus(Enum):
    """User Membership status."""

    ACTIVE = 1
    INACTIVE = 2
    REVOKED = 3


class GeneratedDocumentTypes(IntEnum):
    """Document Types."""

    COMMENT_SHEET_STAFF = 1
    # CAC_FORM_SHEET Removed
    COMMENT_SHEET_PROPONENT = 3


class LoginSource(Enum):
    """Login Source."""

    IDIR = 'idir'


class CompositeRoleNames(Enum):
    """Composite role names."""

    ADMIN = 'ADMIN'
    SUPER_ADMIN = 'SUPER_ADMIN'
    VIEWER = 'VIEWER'
    TEAM_MEMBER = 'TEAM_MEMBER'
    REVIEWER = 'REVIEWER'


class CompositeRoleId(IntEnum):
    """Composite role IDs."""

    ADMIN = 1
    TEAM_MEMBER = 2
    REVIEWER = 3
    VIEWER = 4
    SUPER_ADMIN = 5


class MembershipType(IntEnum):
    """Enum of Membership Type."""

    TEAM_MEMBER = 1
    REVIEWER = 2


class SourceType(Enum):
    """Notification source types."""

    ENGAGEMENT = 'engagement'


class SourceAction(Enum):
    """Notification source types."""

    CREATED = 'created'
    PUBLISHED = 'published'


class UserStatus(IntEnum):
    """User status."""

    ACTIVE = 1
    INACTIVE = 2
