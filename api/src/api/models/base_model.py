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
"""Super class to handle all operations related to base model."""
from datetime import datetime

from flask import g
from sqlalchemy import Column
from sqlalchemy.ext.declarative import declared_attr

from .db import db
TENANT_ID = 'tenant_id'


class BaseModel(db.Model):
    """This class manages all of the base model functions."""

    __abstract__ = True

    created_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    @declared_attr
    def created_by(cls):  # pylint:disable=no-self-argument, # noqa: N805
        """Return foreign key for created by."""
        return Column(db.String(50), default=cls._get_current_user)

    @declared_attr
    def updated_by(cls):  # pylint:disable=no-self-argument, # noqa: N805
        """Return foreign key for modified by."""
        return Column(db.String(50), onupdate=cls._get_current_user)

    @staticmethod
    def _get_current_user():
        """Return the current user.

        Used to populate the created_by and modified_by relationships on all models.
        """
        token_info = getattr(g, 'jwt_oidc_token_info', None) or {}
        return token_info.get('sub')

    @classmethod
    def find_by_id(cls, identifier: int):
        """Return model by id."""
        return cls.query.get(identifier)

    @staticmethod
    def commit():
        """Commit the session."""
        db.session.commit()

    def flush(self):
        """Save and flush."""
        self._set_tenant_id()
        db.session.add(self)
        db.session.flush()
        return self

    def save(self):
        """Save and commit."""
        self.flush()
        self.commit()

    def _set_tenant_id(self):
        # add tenant id to the model if the child model has tenant id column
        has_tenant_id = hasattr(g, 'tenant_id') and g.tenant_id
        if has_tenant_id and hasattr(self, TENANT_ID):
            if not getattr(self, TENANT_ID):
                setattr(self, TENANT_ID, g.tenant_id)

    @classmethod
    def _add_tenant_filter(cls, query):
        has_tenant_id = hasattr(cls, TENANT_ID)
        has_g_tenant_id = hasattr(g, 'tenant_id') and g.tenant_id
        if has_tenant_id and has_g_tenant_id:
            return query.filter(getattr(cls, TENANT_ID) == g.tenant_id)
        return query

    def delete(self):
        """Delete and commit."""
        db.session.delete(self)
        db.session.flush()
        db.session.commit()

    @staticmethod
    def rollback():
        """RollBack."""
        db.session.rollback()
