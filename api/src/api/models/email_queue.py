"""Email queue model class.

Manages the Email queue
"""
from __future__ import annotations

from typing import List
from sqlalchemy import and_, func

from api.constants.notification_status import NotificationStatus
from api.models.engagement import Engagement
from api.utils.datetime import local_datetime
from api.utils.enums import SourceAction, SourceType

from .base_model import BaseModel
from .db import db


class EmailQueue(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the email queue entity."""

    __tablename__ = 'email_queue'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    entity_id = db.Column(db.Integer, nullable=False)  # id of the entity which triggers notificatio
    entity_type = db.Column(db.String(100),
                            nullable=False)  # type of the entity which triggers email ,like engagement , user
    action = db.Column(db.String(100))  # created , deleted etc
    notification_status = db.Column(db.Enum(NotificationStatus), nullable=True)

    @staticmethod
    def get_unprocessed_mails_for_open_engagements(max_size: int) -> List[EmailQueue]:
        """Return a list of unprocessed emails."""
        now = local_datetime().date()
        query = db.session.query(EmailQueue)\
            .join(Engagement, Engagement.id == EmailQueue.entity_id)\
            .filter(and_(EmailQueue.notification_status.is_(None),
                         EmailQueue.entity_type == SourceType.ENGAGEMENT.value,
                         EmailQueue.action == SourceAction.PUBLISHED.value),
                    func.date(Engagement.start_date) == now)
        if max_size != 0:
            query = query.limit(max_size)
        return query.all()
