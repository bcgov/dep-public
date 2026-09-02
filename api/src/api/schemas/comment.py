"""Comment model class.

Manages the comment
"""

from marshmallow import EXCLUDE, Schema, fields


class CommentSchema(Schema):
    """Schema for comment."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id')
    text = fields.Str(data_key='text')
    submission_date = fields.Date(data_key='submission_date')
    reviewed_by = fields.Str(data_key='reviewed_by')
    review_date = fields.Str(data_key='review_date')
    status_id = fields.Int(data_key='status_id')
    survey_id = fields.Int(data_key='survey_id')
    submission_id = fields.Int(data_key='submission_id')
    is_displayed = fields.Bool(data_key='is_displayed')
    status_id = fields.Method('get_comment_status_id')
    reviewed_by = fields.Method('get_comment_reviewed_by')
    label = fields.Method('get_comment_label')

    def get_comment_status_id(self, obj):
        """Get the associated status of the comment."""
        return obj.submission.comment_status_id

    def get_comment_reviewed_by(self, obj):
        """Get the associated reviewed by of the comment."""
        return obj.submission.reviewed_by

    def get_comment_label(self, obj):
        """Check the value for display type to categorize the form as a single/multi page."""
        """Forms' are stored with a display type as 'form' for single page and 'wizard' for multi page"""
        from api.services.survey_service import SurveyService
        form_json = obj.survey.form_json

        components = SurveyService().extract_components(form_json)

        component_labels = CommentSchema.loop_through_comment_label(self, obj, components)
        if len(component_labels) == 0:
            return obj.component_id + ' (Label not available)'
        return component_labels[0]

    def loop_through_comment_label(self, obj, components):
        """Loop through the component list to extract the label."""
        return [
            component.get('label', None)
            for component in components
            if component.get('key', None) == obj.component_id
        ]


class PublicCommentSchema(Schema):
    """Schema for public comment."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id')
    text = fields.Str(data_key='text')
    label = fields.Method('get_comment_label')

    def get_comment_label(self, obj):
        """Get the associated label of the comment."""
        components = list(obj.survey.form_json.get('components', []))
        if len(components) == 0:
            return None
        component_label = [
            component.get(
                'label',
                None) for component in components if component.get(
                'key',
                None) == obj.component_id]
        if len(component_label) == 0:
            return None
        return component_label[0]
