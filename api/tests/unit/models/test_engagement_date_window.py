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
"""Tests for public engagement search date windows."""

from datetime import datetime, timedelta
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import Flask
from sqlalchemy import Column, DateTime, Integer, MetaData, Table, create_engine
from sqlalchemy.orm import Session

from api.models.engagement import Engagement, db
from api.models.engagement_scope_options import EngagementScopeOptions
from api.models.pagination_options import PaginationOptions
from api.resources.engagement import _get_engagements


@pytest.mark.parametrize(
    'window, field, offsets, expected',
    [
        ('recently_opened', 'start_date',
         [-timedelta(days=30, microseconds=1), -timedelta(days=30), timedelta(0), timedelta(microseconds=1), None],
         [2, 3]),
        ('closing_soon', 'end_date',
         [timedelta(0), timedelta(microseconds=1), timedelta(days=14),
          timedelta(days=14, microseconds=1), None],
         [2, 3]),
    ],
)
def test_date_window_filters_in_sql(window, field, offsets, expected):
    """Date windows apply their exact boundaries before records are returned."""
    now = datetime(2026, 6, 1, 12)
    engine = create_engine('sqlite://')
    table = Table(
        'engagement', MetaData(),
        Column('id', Integer, primary_key=True),
        Column('start_date', DateTime),
        Column('end_date', DateTime),
    )
    table.create(engine)
    with engine.begin() as connection:
        connection.execute(table.insert(), [
            {'id': index, field: now + offset if offset is not None else None}
            for index, offset in enumerate(offsets, start=1)
        ])
    with Session(engine) as session, patch('api.models.engagement.utc_now', return_value=now):
        query = Engagement._filter_by_date_window(  # pylint: disable=protected-access
            session.query(Engagement.id), {'date_window': window},
        )
        assert [row.id for row in query.order_by(Engagement.id)] == expected
    engine.dispose()


@pytest.mark.parametrize('window', ['recently_opened', 'closing_soon'])
def test_public_search_passes_date_window(window):
    """The search endpoint passes its date window to the engagement query."""
    app = Flask(__name__)
    with app.test_request_context(f'/api/engagements/search?date_window={window}'), \
            patch('api.resources.engagement.TokenInfo.get_id', return_value=None), \
            patch('api.resources.engagement.EngagementService.get_engagements_paginated',
                  return_value={'items': [], 'total': 0}) as search:
        _, status = _get_engagements(public_search=True)

    assert status == HTTPStatus.OK
    assert search.call_args.args[2]['date_window'] == window


def test_public_search_query_applies_date_window():
    """Public search applies the date filter to its main query."""
    now = datetime(2026, 6, 1, 12)
    engine = create_engine('sqlite://')
    metadata = MetaData()
    status_table = Table('engagement_status', metadata, Column('id', Integer, primary_key=True))
    table = Table(
        'engagement', metadata,
        Column('id', Integer, primary_key=True),
        Column('status_id', Integer),
        Column('start_date', DateTime),
    )
    metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(status_table.insert(), [{'id': 2}])
        connection.execute(table.insert(), [
            {'id': 1, 'status_id': 2, 'start_date': now - timedelta(days=30)},
            {'id': 2, 'status_id': 2, 'start_date': now - timedelta(days=31)},
        ])
    with Session(engine) as session, \
            patch.object(db, 'session', session), \
            patch.object(Engagement, '_add_tenant_filter', side_effect=lambda query: query), \
            patch('api.models.engagement.utc_now', return_value=now):
        query = Engagement._get_engagements_query(  # pylint: disable=protected-access
            None, EngagementScopeOptions(restricted=False),
            {'public_search': True, 'date_window': 'recently_opened'},
        )
        assert [row.id for row in query.with_entities(Engagement.id)] == [1]
    engine.dispose()


@pytest.mark.parametrize('sort_key, expected', [('newest', [2, 1]), ('oldest', [1, 2])])
def test_public_search_sort_breaks_creation_date_ties(sort_key, expected):
    """Public search sorts records with equal creation dates deterministically."""
    engine = create_engine('sqlite://')
    table = Table(
        'engagement', MetaData(),
        Column('id', Integer, primary_key=True),
        Column('created_date', DateTime),
    )
    table.create(engine)
    with engine.begin() as connection:
        connection.execute(table.insert(), [
            {'id': 1, 'created_date': datetime(2026, 6, 1)},
            {'id': 2, 'created_date': datetime(2026, 6, 1)},
        ])
    with Session(engine) as session:
        options = PaginationOptions(page=1, size=1, sort_key=sort_key, sort_order='asc')
        order = Engagement._get_sort_order(options, {'public_search': True})  # pylint: disable=protected-access
        query = session.query(Engagement.id).order_by(*order)
        assert [query.offset(index).limit(1).one().id for index in range(2)] == expected
    engine.dispose()


def test_search_rejects_invalid_date_window():
    """Unsupported windows are rejected instead of returning unfiltered records."""
    app = Flask(__name__)
    with app.test_request_context('/api/engagements/search?date_window=invalid'), \
            patch('api.resources.engagement.TokenInfo.get_id', return_value=None), \
            patch('api.resources.engagement.EngagementService.get_engagements_paginated') as search:
        _, status = _get_engagements(public_search=True)

    assert status == HTTPStatus.BAD_REQUEST
    search.assert_not_called()
