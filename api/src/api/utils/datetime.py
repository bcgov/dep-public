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
"""Datetime object helper."""
from datetime import UTC, datetime

from flask import current_app
from pytz import timezone
from pytz import UTC as PYTZ_UTC


def utc_now():
    """Get the UTC datetime without timezone info (naive)."""
    return datetime.now(UTC).replace(tzinfo=None)


def local_datetime():
    """Get the local (Pacific Timezone) datetime."""
    utcmoment = datetime.now(UTC)
    now = utcmoment.astimezone(timezone('US/Pacific'))
    return now


def utc_datetime():
    """Get the UTC datetime."""
    # Already UTC-aware — no need to convert
    return datetime.now(UTC)


def convert_and_format_to_utc_str(date_val: datetime, dt_format='%Y-%m-%d %H:%M:%S', timezone_override=None):
    """Convert a datetime object to UTC and format it as a string."""
    tz_name = timezone_override or current_app.config['LEGISLATIVE_TIMEZONE']
    tz_local = timezone(tz_name)

    # Handle both naive + aware safely
    if date_val.tzinfo is None:
        date_val = tz_local.localize(date_val)
    else:
        date_val = date_val.astimezone(tz_local)

    # Convert to UTC
    date_val_utc = date_val.astimezone(PYTZ_UTC)

    return date_val_utc.strftime(dt_format)
