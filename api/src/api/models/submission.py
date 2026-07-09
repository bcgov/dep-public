"""Submission model class.

Manages the Submission
"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql

from api.constants.comment_status import Status
from api.constants.user import SYSTEM_REVIEWER
from api.models.participant import Participant
from api.models.survey import Survey
from api.schemas.submission import SubmissionSchema
from api.utils.datetime import utc_now

from .base_model import BaseModel
from .db import db


class Submission(BaseModel):  # pylint: disable=too-few-public-methods
    """Definition of the Submission entity."""

    __tablename__ = 'submission'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    submission_json = db.Column(postgresql.JSONB(
        astext_type=db.Text()), nullable=False, server_default='{}')
    survey_id = db.Column(db.Integer, ForeignKey(
        'survey.id', ondelete='CASCADE'), nullable=False)
    engagement_id = db.Column(db.Integer, ForeignKey(
        'engagement.id', ondelete='CASCADE'), nullable=False)
    participant_id = db.Column(
        db.Integer, ForeignKey('participant.id'), nullable=True)
    reviewed_by = db.Column(db.String(50))
    review_date = db.Column(db.DateTime)
    comment_status_id = db.Column(db.Integer, ForeignKey(
        'comment_status.id', ondelete='SET NULL'))
    has_personal_info = db.Column(db.Boolean, nullable=True)
    has_profanity = db.Column(db.Boolean, nullable=True)
    rejected_reason_other = db.Column(db.String(500), nullable=True)
    has_threat = db.Column(db.Boolean, nullable=True)
    notify_email = db.Column(db.Boolean(), default=True)
    comments = db.relationship(
        'Comment', backref='submission', cascade='all, delete')
    staff_note = db.relationship(
        'StaffNote', backref='submission', cascade='all, delete')

    @classmethod
    def get_by_survey_id(cls, survey_id) -> List[SubmissionSchema]:
        """Get submissions by survey id."""
        return db.session.query(Submission).filter_by(survey_id=survey_id).all()

    @classmethod
    def create(cls, submission: SubmissionSchema, session=None) -> Submission:
        """Save submission.

        Submissions for a survey with comments field blank will be auto approved.
        Submissions for a survey without a comment input field will be auto approved.
        This removes the dependency for a user to approve a submission without a comment as no review is required.
        """
        has_comments = cls.__check_if_submission_has_comments(submission)
        if has_comments:
            const_comment_status = Status.Pending.value
            const_reviewed_by = None
            const_review_date = None
        else:
            const_comment_status = Status.Approved.value
            const_reviewed_by = SYSTEM_REVIEWER
            const_review_date = utc_now()

        new_submission = Submission(
            submission_json=submission.get('submission_json', None),
            engagement_id=submission.get('engagement_id', None),
            survey_id=submission.get('survey_id', None),
            participant_id=submission.get('participant_id', None),
            created_date=utc_now(),
            updated_date=None,
            created_by=submission.get('created_by', None),
            updated_by=submission.get('updated_by', None),
            comment_status_id=const_comment_status,
            reviewed_by=const_reviewed_by,
            review_date=const_review_date,
        )
        if session is None:
            db.session.add(new_submission)
            db.session.commit()
        else:
            session.add(new_submission)
            session.flush()
        return new_submission

    @staticmethod
    def __check_if_submission_has_comments(submission: SubmissionSchema):
        """Check if comment exists."""
        submission_json = submission.get('submission_json', {})
        text_fields = ['simpletextarea', 'simpletextfield']

        for field in submission_json:
            if any(field.startswith(prefix) for prefix in text_fields) and len(submission_json[field]) > 0:
                return True

        return False

    @classmethod
    def update(cls, submission: SubmissionSchema, session=None) -> Submission:
        """Update submission."""
        update_fields = {
            'submission_json': submission.get('submission_json', None),
            'updated_date': utc_now(),
            'updated_by': submission.get('updated_by', None),
        }
        submission_id = submission.get('id', None)
        query = Submission.query.filter_by(id=submission_id)
        record = query.first()
        if not record:
            raise ValueError('Submission Not Found')
        query.update(update_fields)
        if session is None:
            db.session.commit()
        else:
            session.flush()
        return query.first()

    @classmethod
    def update_comment_status(cls, submission_id, comment: dict, session=None) -> Optional[Submission]:
        """Update comment status."""
        status_id = comment.get('status_id', None)
        has_personal_info = comment.get('has_personal_info', None)
        has_profanity = comment.get('has_profanity', None)
        has_threat = comment.get('has_threat', None)
        rejected_reason_other = comment.get('rejected_reason_other', None)
        notify_email = comment.get('notify_email', None)

        query = Submission.query.filter_by(id=submission_id)

        if not query.first():
            return None

        update_fields = {
            'comment_status_id': status_id,
            'has_personal_info': has_personal_info,
            'has_profanity': has_profanity,
            'has_threat': has_threat,
            'rejected_reason_other': rejected_reason_other,
            'notify_email': notify_email,
            'reviewed_by': comment.get('reviewed_by'),
            'review_date': utc_now(),
            'updated_by': comment.get('participant_id'),
            'updated_date': utc_now(),
        }

        query.update(update_fields)
        if session is None:
            db.session.commit()
        else:
            session.flush()

        return query.first()

    @classmethod
    def get_engaged_participants(cls, engagement_id) -> List[Participant]:
        """Get users that have submissions for the specified engagement id."""
        users = db.session.query(Participant)\
            .join(Submission)\
            .join(Survey)\
            .filter(Survey.engagement_id == engagement_id)\
            .all()
        return users
