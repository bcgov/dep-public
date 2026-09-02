"""Survey schema class.

Manages the survey
"""

from marshmallow import EXCLUDE, Schema, fields

from api.constants.comment_status import Status
from api.schemas.utils import count_comments_by_status

from .engagement import EngagementSchema


class SurveySchema(Schema):
    """Schema for survey."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id')
    name = fields.Str(data_key='name')
    form_json = fields.Dict(data_key='form_json')
    created_by = fields.Str(data_key='created_by')
    created_date = fields.Str(data_key='created_date')
    updated_by = fields.Str(data_key='updated_by')
    updated_date = fields.Str(data_key='updated_date')
    engagement_id = fields.Str(data_key='engagement_id')
    is_hidden = fields.Bool(data_key='is_hidden')
    is_template = fields.Bool(data_key='is_template')
    engagement = fields.Nested(EngagementSchema)
    comments_meta_data = fields.Method('get_comments_meta_data')
    tenant_id = fields.Str(data_key='tenant_id')

    def get_comments_meta_data(self, obj):
        """Get the meta data of the comments made in the survey."""
        pending = count_comments_by_status(obj.submissions, Status.Pending.value)
        approved = count_comments_by_status(obj.submissions, Status.Approved.value)
        rejected = count_comments_by_status(obj.submissions, Status.Rejected.value)
        needs_further_review = count_comments_by_status(
            obj.submissions,
            Status.Needs_further_review.value)
        total = sum([pending, approved, rejected, needs_further_review])
        return {
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'needs_further_review': needs_further_review
        }
