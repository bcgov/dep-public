"""Engagement model class.

Manages the engagement
"""

from marshmallow import EXCLUDE, Schema, ValidationError, fields, pre_load, validate, validates_schema

from api.constants.comment_status import Status as CommentStatus
from api.schemas.engagement_status_block import EngagementStatusBlockSchema
from api.schemas.engagement_survey import EngagementSurveySchema
from api.schemas.suggested_engagement import SuggestedEngagementSyncItemSchema, SuggestedEngagementWithAttachment
from api.schemas.utils import count_comments_by_status
from api.utils.submission_status import get_submission_status

from .engagement_status import EngagementStatusSchema


class EngagementSchema(Schema):
    """Schema for engagement."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id')
    name = fields.Str(data_key='name', required=True, validate=validate.Length(
        min=1, error='Name cannot be blank'))
    description = fields.Str(data_key='description')
    rich_description = fields.Str(data_key='rich_description')
    description_title = fields.Str(data_key='description_title')
    start_date = fields.Str(data_key='start_date', required=True)
    end_date = fields.Str(data_key='end_date', required=True)
    status_id = fields.Int(data_key='status_id')
    created_by = fields.Str(data_key='created_by')
    created_date = fields.Str(data_key='created_date')
    updated_by = fields.Str(data_key='updated_by')
    updated_date = fields.Str(data_key='updated_date')
    published_date = fields.Str(data_key='published_date')
    scheduled_date = fields.Str(data_key='scheduled_date')
    banner_filename = fields.Str(data_key='banner_filename')
    engagement_status = fields.Nested(EngagementStatusSchema)
    surveys = fields.Nested(EngagementSurveySchema, many=True)
    selected_survey_id = fields.Int(data_key='selected_survey_id')
    submission_status = fields.Function(lambda obj: get_submission_status(obj))
    submissions_meta_data = fields.Method('get_submissions_meta_data')
    status_block = fields.List(fields.Nested(EngagementStatusBlockSchema))
    tenant_id = fields.Str(data_key='tenant_id')
    is_internal = fields.Bool(data_key='is_internal')
    languages = fields.List(fields.Str(), data_key='languages', load_only=True)
    suggested_engagements = fields.Nested(
        SuggestedEngagementWithAttachment,
        many=True,
        attribute='suggested_engagement_links',
        dump_only=True,
    )
    suggested_engagements_input = fields.Nested(
        SuggestedEngagementSyncItemSchema,
        many=True,
        load_only=True,
    )

    @pre_load
    def map_suggested_engagements_input(self, data, **kwargs):
        """Map external suggested_engagements payload to internal load-only field."""
        if isinstance(data, dict) and 'suggested_engagements' in data and 'suggested_engagements_input' not in data:
            data = dict(data)
            data['suggested_engagements_input'] = data['suggested_engagements']
        return data

    def get_submissions_meta_data(self, obj):
        """Get the meta data of the submissions made in the survey."""
        if not obj or len(obj.surveys) == 0:
            return {
                'total': 0,
                'pending': 0,
                'approved': 0,
                'rejected': 0,
                'needs_further_review': 0
            }
        submissions = obj.surveys[0].submissions
        return {
            'total': len(submissions),
            'pending': count_comments_by_status(submissions, CommentStatus.Pending.value),
            'approved': count_comments_by_status(submissions, CommentStatus.Approved.value),
            'rejected': count_comments_by_status(submissions, CommentStatus.Rejected.value),
            'needs_further_review': count_comments_by_status(
                submissions,
                CommentStatus.Needs_further_review.value)
        }

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Validate that start date is before end date."""
        if kwargs.get('partial', False):
            return

        if data.get('start_date') > data.get('end_date'):
            raise ValidationError('From date must be before to date')
