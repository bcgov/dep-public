"""Comment model class.

Manages the comment
"""
from __future__ import annotations
from operator import or_

from sqlalchemy import and_, asc, desc
from sqlalchemy.sql import text
from sqlalchemy.sql.expression import true
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property

from api.utils.datetime import utc_now
from api.constants.comment_status import Status as CommentStatus
from api.constants.engagement_status import Status as EngagementStatus
from api.models.pagination_options import PaginationOptions
from api.models.engagement import Engagement
from api.models.report_setting import ReportSetting
from api.models.submission import Submission
from api.models.survey import Survey
from api.schemas.comment import CommentSchema
from api.schemas.submission import SubmissionSchema

from .base_model import BaseModel
from .comment_status import CommentStatus as CommentStatusModel
from .db import db


class Comment(BaseModel):
    """Definition of the Comment entity."""

    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    text = db.Column(db.Text, unique=False, nullable=False)
    submission_date = db.Column(db.DateTime)
    survey_id = db.Column(db.Integer, ForeignKey('survey.id', ondelete='CASCADE'), nullable=False)
    participant_id = db.Column(db.Integer, ForeignKey('participant.id', ondelete='SET NULL'), nullable=True)
    submission_id = db.Column(db.Integer, ForeignKey('submission.id', ondelete='SET NULL'), nullable=True)
    component_id = db.Column(db.String(10))

    @hybrid_property
    def is_displayed(self):
        """Get report settings."""
        return self._display()

    def _display(self):
        """Return report settings for single/multi line comment type questions."""
        report_setting = db.session.query(ReportSetting).filter(
            ReportSetting.question_key == self.component_id,
            ReportSetting.survey_id == self.survey_id).one_or_none()
        if report_setting:
            return f'{report_setting.display}'

        return None

    @classmethod
    def get_by_submission(cls, submission_id):
        """Get comments by submission id."""
        return db.session.query(Comment)\
            .join(Survey)\
            .filter(Comment.submission_id == submission_id)\
            .all()

    @classmethod
    def get_comments_by_survey_id_paginated(cls, survey_id, pagination_options: PaginationOptions, search_text=''):
        """Get comments paginated."""
        query = db.session.query(Comment)\
            .join(Survey)\
            .join(ReportSetting, and_(Comment.survey_id == ReportSetting.survey_id,
                                      Comment.component_id == ReportSetting.question_key))\
            .filter(and_(Comment.survey_id == survey_id, ReportSetting.display == true()))

        if search_text:
            query = query.filter(Comment.text.ilike('%' + search_text + '%'))

        sort = asc(text(pagination_options.sort_key)) if pagination_options.sort_order == 'asc'\
            else desc(text(pagination_options.sort_key))

        query = query.order_by(sort)

        no_pagination_options = not pagination_options or not pagination_options.page or not pagination_options.size
        if no_pagination_options:
            items = query.all()
            return items, len(items)

        page = query.paginate(page=pagination_options.page, per_page=pagination_options.size)

        return page.items, page.total

    @classmethod
    def get_accepted_comments_by_survey_id_paginated(
            cls, survey_id, pagination_options: PaginationOptions, search_text='', include_unpublished=False):
        """Get comments for closed engagements."""
        query = db.session.query(Comment)\
            .join(Submission, Submission.id == Comment.submission_id)\
            .join(CommentStatusModel, Submission.comment_status_id == CommentStatusModel.id)\
            .join(Survey, Survey.id == Submission.survey_id)\
            .join(Engagement, Engagement.id == Survey.engagement_id)\
            .join(ReportSetting, and_(Comment.survey_id == ReportSetting.survey_id,
                                      Comment.component_id == ReportSetting.question_key))\
            .filter(
                and_(
                    Comment.survey_id == survey_id,
                    CommentStatusModel.id == CommentStatus.Approved.value,
                    ReportSetting.display == true()
                ))

        if not include_unpublished:
            query = query.filter(Engagement.status_id != EngagementStatus.Unpublished.value)

        if search_text:
            query = query.filter(Comment.text.ilike('%' + search_text + '%'))

        query = query.order_by(Comment.id.asc())

        no_pagination_options = not pagination_options or not pagination_options.page or not pagination_options.size
        if no_pagination_options:
            items = query.all()
            return items, len(items)

        page = query.paginate(page=pagination_options.page, per_page=pagination_options.size)

        return page.items, page.total

    @classmethod
    def get_by_survey_id_paginated(
        cls,
        survey_id,
        pagination_options: PaginationOptions,
        search_text='',
        advanced_search_filters=None
    ):
        """Get submissions by survey id paginated."""
        null_value = None
        query = db.session.query(Submission)\
            .filter(and_(Submission.survey_id == survey_id,
                         or_(Submission.reviewed_by != 'System', Submission.reviewed_by == null_value)))

        if search_text:
            # Remove all non-digit characters from search text
            query = query.filter(Submission.comments.any(Comment.text.ilike('%' + search_text + '%')))

        if advanced_search_filters:
            query = cls._filter_by_advanced_filters(query, advanced_search_filters)

        sort = asc(text(pagination_options.sort_key)) if pagination_options.sort_order == 'asc'\
            else desc(text(pagination_options.sort_key))

        query = query.order_by(sort)

        no_pagination_options = not pagination_options.page or not pagination_options.size
        if no_pagination_options:
            items = query.all()
            return items, len(items)

        page = query.paginate(page=pagination_options.page, per_page=pagination_options.size)

        return page.items, page.total

    @staticmethod
    def __create_new_comment_entity(comment: CommentSchema):
        """Create new comment entity."""
        return Comment(
            text=comment.get('text', None),
            submission_date=utc_now(),
            created_date=utc_now(),
            created_by=comment.get('participant_id', None),
            survey_id=comment.get('survey_id', None),
            participant_id=comment.get('participant_id', None),
            submission_id=comment.get('submission_id', None),
            component_id=comment.get('component_id', None)
        )

    @staticmethod
    def _filter_by_advanced_filters(query, advanced_search_filters: dict):
        if status := advanced_search_filters.get('status'):
            query = query.filter(Submission.comment_status_id == status)

        if comment_date_to := advanced_search_filters.get('comment_date_to'):
            query = query.filter(Submission.created_date <= comment_date_to)

        if comment_date_from := advanced_search_filters.get('comment_date_from'):
            query = query.filter(Submission.created_date >= comment_date_from)

        if reviewer := advanced_search_filters.get('reviewer'):
            query = query.filter(Submission.reviewed_by.ilike(f'%{reviewer}%'))

        if reviewed_date_from := advanced_search_filters.get('reviewed_date_from'):
            query = query.filter(Submission.review_date >= reviewed_date_from)

        if reviewed_date_to := advanced_search_filters.get('reviewed_date_to'):
            query = query.filter(Submission.review_date <= reviewed_date_to)
        return query

    @classmethod
    def add_all_comments(cls, comments: list, session=None) -> list[Comment]:
        """Create comments."""
        new_comments = [cls.__create_new_comment_entity(comment) for comment in comments]
        if session is None:
            db.session.add_all(new_comments)
            db.session.commit()
        else:
            session.add_all(new_comments)
        return new_comments

    @classmethod
    def update(cls, submission_id, comment: CommentSchema, session=None) -> Comment:
        """Update comment text."""
        query = Comment.query.filter_by(id=comment.get('id'), submission_id=submission_id)
        update_fields = {
            'text': comment.get('text', None),
            'updated_by': comment.get('participant_id', None),
            'updated_date': utc_now(),
        }

        query.update(update_fields)
        if session is None:
            db.session.commit()
        else:
            session.flush()
        return query.first()

    @classmethod
    def get_comments_by_survey_id(cls, survey_id):
        """Get comments for staff."""
        null_value = None
        query = db.session.query(Submission)\
            .join(Comment, Submission.id == Comment.submission_id)\
            .filter(and_(Submission.survey_id == survey_id,
                         or_(Submission.reviewed_by != 'System', Submission.reviewed_by == null_value)))

        query = query.order_by(Submission.id.asc())
        items = query.all()
        return SubmissionSchema(many=True, exclude=['submission_json']).dump(items)

    @classmethod
    def get_public_viewable_comments_by_survey_id(cls, survey_id):
        """Get comments that are viewable on the public report."""
        query = db.session.query(Comment)\
            .join(Submission, Submission.id == Comment.submission_id)\
            .join(CommentStatusModel, Submission.comment_status_id == CommentStatusModel.id)\
            .join(Survey, Survey.id == Submission.survey_id)\
            .join(ReportSetting, and_(Comment.survey_id == ReportSetting.survey_id,
                                      Comment.component_id == ReportSetting.question_key))\
            .filter(
                and_(
                    Comment.survey_id == survey_id,
                    CommentStatusModel.id == CommentStatus.Approved.value,
                    ReportSetting.display == true(),
                    Submission.reviewed_by != 'System'
                ))
        query = query.order_by(Comment.text.asc())
        items = query.all()
        return CommentSchema(many=True, only=['submission_id', 'label', 'text']).dump(items)
