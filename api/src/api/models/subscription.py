"""Subscription model class.

Manages the Subscription
"""
from __future__ import annotations
from sqlalchemy import ForeignKey

from api.constants.subscription_type import SubscriptionType
from api.utils.datetime import utc_now

from .base_model import BaseModel
from .db import db


class Subscription(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the subscription entity."""

    __tablename__ = 'subscription'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    engagement_id = db.Column(db.Integer, nullable=True)
    participant_id = db.Column(db.Integer, ForeignKey('participant.id'), nullable=True)
    is_subscribed = db.Column(db.Boolean, nullable=False)
    project_id = db.Column(db.String(50))
    type = db.Column(db.Enum(SubscriptionType), nullable=True)

    @classmethod
    def get(cls) -> Subscription:
        """Get a subscription."""
        db_subscription = db.session.query(Subscription)
        return db_subscription

    @classmethod
    def get_by_engagement_id(cls, engagement_id) -> Subscription:
        """Get a subscription."""
        db_subscription = db.session.query(Subscription)\
            .filter_by(engagement_id=engagement_id)\
            .order_by(Subscription.created_date.desc())\
            .first()
        return db_subscription

    @classmethod
    def get_by_participant_id(cls, participant_id) -> Subscription:
        """Get a subscription."""
        db_subscription = db.session.query(Subscription)\
            .filter_by(participant_id=participant_id)\
            .order_by(Subscription.created_date.desc())\
            .first()
        return db_subscription

    @classmethod
    def get_by_participant_and_eng_id(cls, participant_id, engagement_id) -> Subscription:
        """Get a subscription."""
        db_subscription = db.session.query(Subscription)\
            .filter_by(participant_id=participant_id, engagement_id=engagement_id)\
            .order_by(Subscription.created_date.desc())\
            .first()
        return db_subscription

    @classmethod
    def create(cls, subscription: dict, session=None) -> Subscription:
        """Create a subscription."""
        new_subscription = Subscription(
            engagement_id=subscription.get('engagement_id', None),
            participant_id=subscription.get('participant_id', None),
            is_subscribed=subscription.get('is_subscribed', False),
            project_id=subscription.get('project_id', None),
            type=subscription.get('type', None),
            created_date=utc_now(),
            created_by=subscription.get('created_by', None),
        )
        db.session.add(new_subscription)
        if session is None:
            db.session.commit()
        else:
            session.flush()
        return new_subscription

    @classmethod
    def update_subscription_for_participant(cls, subscription: dict, session=None) -> Subscription:
        """Update subscription for a participant."""
        update_fields = {
            'is_subscribed': subscription.get('is_subscribed', False),
            'updated_date': utc_now(),
            'updated_by': subscription.get('updated_by', None),
        }
        participant_id = subscription.get('participant_id', None)
        query = Subscription.query.filter_by(participant_id=participant_id)
        record = query.first()
        if not record:
            raise ValueError('Subscription Not Found')
        query.update(update_fields)
        if session is None:
            db.session.commit()
        return query.first()

    @classmethod
    def update_subscription_for_participant_eng(cls, subscription: dict, session=None) -> Subscription:
        """Update subscription for a participant and engagement."""
        update_fields = {
            'is_subscribed': subscription.get('is_subscribed', False),
            'updated_date': utc_now(),
            'updated_by': subscription.get('updated_by', None),
        }
        participant_id = subscription.get('participant_id', None)
        engagement_id = subscription.get('engagement_id', None)
        query = Subscription.query.filter_by(participant_id=participant_id, engagement_id=engagement_id)
        record = query.first()
        if not record:
            raise ValueError('Subscription Not Found')
        query.update(update_fields)
        if session is None:
            db.session.commit()
        return query.first()
