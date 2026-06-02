"""Email verification model class.

Manages the Email verification
"""
from __future__ import annotations
from sqlalchemy import ForeignKey

from api.utils.datetime import utc_now
from api.constants.email_verification import EmailVerificationType
from api.schemas.email_verification import EmailVerificationSchema

from .base_model import BaseModel
from .db import db


class EmailVerification(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the Email verification entity."""

    __tablename__ = 'email_verification'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    verification_token = db.Column(db.String(50), nullable=False)
    participant_id = db.Column(db.Integer, ForeignKey('participant.id'), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False)
    type = db.Column(db.Enum(EmailVerificationType), nullable=False)
    survey_id = db.Column(db.Integer, ForeignKey('survey.id'), nullable=True)
    submission_id = db.Column(db.Integer, ForeignKey('submission.id'), nullable=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenant.id'), nullable=True)

    @classmethod
    def get(cls, verification_token) -> EmailVerification:
        """Get an email verification."""
        db_email_verification = db.session.query(EmailVerification)\
            .filter_by(verification_token=verification_token)\
            .first()
        return db_email_verification

    @classmethod
    def create(cls, email_verification: EmailVerificationSchema, session=None) -> EmailVerification:
        """Create an email verification."""
        new_email_verification = EmailVerification(
            verification_token=email_verification.get('verification_token', None),
            participant_id=email_verification.get('participant_id', None),
            is_active=True,
            type=email_verification.get('type'),
            survey_id=email_verification.get('survey_id', None),
            submission_id=email_verification.get('submission_id', None),
            created_date=utc_now(),
            created_by=email_verification.get('created_by', None),
        )
        db.session.add(new_email_verification)
        if session is None:
            db.session.commit()
        else:
            session.flush()
        return new_email_verification

    @classmethod
    def update(cls, email_verification: EmailVerificationSchema, session=None) -> EmailVerification:
        """Update an email verification."""
        update_fields = {
            'is_active': email_verification.get('is_active', None),
            'updated_date': utc_now(),
            'updated_by': email_verification.get('updated_by', None),
        }
        email_verification_id = email_verification.get('id', None)
        query = EmailVerification.query.filter_by(id=email_verification_id)
        record = query.first()
        if not record:
            raise ValueError('Email Verification Not Found')
        query.update(update_fields)
        if session is None:
            db.session.commit()
        return query.first()
